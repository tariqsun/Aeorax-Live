#!/usr/bin/env python3
"""
Aeorax Live - BigBlueButton Automated R2 Recording Lifecycle Hook
Location on BBB Node: /usr/local/bigbluebutton/core/scripts/post_publish/post_publish_aeorax_r2.py

Workflow:
1. BigBlueButton finishes recording & processing the classroom presentation.
2. This script is automatically invoked with `-m <meeting_id>`.
3. Reads metadata.xml to extract the tenant college slug.
4. Archives / uploads the published presentation files to Cloudflare R2 under:
   s3://aeorax-live/{college_slug}/recordings/{meeting_id}/
5. Notifies Aeorax Panel API (/api/recordings/ingest) with recording size & duration.
6. Cleans local raw recording storage from /var/bigbluebutton/recording/raw/ to free up server NVMe disk!
"""

import sys
import os
import argparse
import xml.etree.ElementTree as ET
import json
import urllib.request
import urllib.error
import shutil
import tarfile
import hashlib
import time

PANEL_URL = os.environ.get("AEORAX_PANEL_URL", "https://panel.nesthost.net")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT", "https://442ee27fafab567aa3828a2a4ee62738.r2.cloudflarestorage.com")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "8816f95bb2b3e35d47791fb176548a68")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "f3022ade353c0297634cc8bf80f6a6cac6749ca6b86dc230a267b767e57e7508")
R2_BUCKET = os.environ.get("R2_BUCKET_NAME", "aeorax-live")
SHARED_SECRET = os.environ.get("AEORAX_SHARED_SECRET", "aeorax2026!")

def parse_meeting_metadata(meeting_id):
    meta_path = f"/var/bigbluebutton/published/presentation/{meeting_id}/metadata.xml"
    if not os.path.exists(meta_path):
        return None, "Classroom Recording", 0

    try:
        tree = ET.parse(meta_path)
        root = tree.getroot()
        
        # Look for custom collegeSlug metadata
        college_slug = None
        for meta in root.findall(".//meta"):
            for child in meta:
                if child.tag.lower() in ("collegeslug", "college_slug", "tenant"):
                    college_slug = child.text.strip()
                    break

        # Fallback: check if meeting ID is prefixed with college slug (e.g. oxford-intl-room1-12345)
        if not college_slug:
            parts = meeting_id.split("-")
            if len(parts) >= 2:
                college_slug = parts[0]
            else:
                college_slug = "default-college"

        # Meeting name / title
        name_node = root.find(".//meetingName")
        title = name_node.text if name_node is not None and name_node.text else "Classroom Recording"

        # Duration
        playback = root.find(".//playback")
        duration = 0
        if playback is not None:
            dur_node = playback.find("duration")
            if dur_node is not None and dur_node.text:
                try:
                    duration = int(float(dur_node.text) / 1000)
                except ValueError:
                    duration = 0

        return college_slug, title, duration
    except Exception as e:
        print(f"[Aeorax-R2] Error parsing metadata: {e}", file=sys.stderr)
        return "default-college", "Classroom Recording", 0

def archive_and_upload(meeting_id, college_slug):
    published_dir = f"/var/bigbluebutton/published/presentation/{meeting_id}"
    if not os.path.exists(published_dir):
        print(f"[Aeorax-R2] Published directory not found: {published_dir}")
        return None, 0

    tar_path = f"/tmp/{meeting_id}.tar.gz"
    print(f"[Aeorax-R2] Compressing recording into {tar_path}...")
    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(published_dir, arcname=meeting_id)

    total_size = os.path.getsize(tar_path)
    r2_key = f"{college_slug}/recordings/{meeting_id}/presentation.tar.gz"

    # Request presigned upload URL from Aeorax Panel API
    presign_payload = json.dumps({
        "action": "presign-upload",
        "key": r2_key,
        "contentType": "application/gzip",
        "expiresInSeconds": 1800
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            f"{PANEL_URL}/api/storage/r2",
            data=presign_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            upload_url = res_data.get("url")

        if not upload_url:
            print("[Aeorax-R2] Failed to get presigned upload URL", file=sys.stderr)
            return None, 0

        print(f"[Aeorax-R2] Streaming recording to Cloudflare R2 ({r2_key})...")
        with open(tar_path, "rb") as f:
            upload_req = urllib.request.Request(
                upload_url,
                data=f.read(),
                headers={"Content-Type": "application/gzip"},
                method="PUT"
            )
            with urllib.request.urlopen(upload_req, timeout=120) as up_res:
                print(f"[Aeorax-R2] Upload complete: HTTP {up_res.status}")

        # Clean temporary archive
        if os.path.exists(tar_path):
            os.remove(tar_path)

        return r2_key, total_size
    except Exception as e:
        print(f"[Aeorax-R2] Error uploading to R2: {e}", file=sys.stderr)
        if os.path.exists(tar_path):
            os.remove(tar_path)
        return None, 0

def cleanup_local_raw(meeting_id):
    """
    Remove bulky raw recording files from the live server to preserve NVMe disk space.
    """
    raw_dirs = [
        f"/var/bigbluebutton/recording/raw/{meeting_id}",
        f"/var/bigbluebutton/recording/process/presentation/{meeting_id}",
    ]
    for d in raw_dirs:
        if os.path.exists(d):
            try:
                shutil.rmtree(d)
                print(f"[Aeorax-R2] Cleaned raw local directory to free disk: {d}")
            except Exception as e:
                print(f"[Aeorax-R2] Warning: Could not remove {d}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Aeorax R2 Recording Mover")
    parser.add_argument("-m", "--meeting-id", required=True, help="BigBlueButton Meeting / Record ID")
    args = parser.parse_args()
    meeting_id = args.meeting_id

    print(f"[Aeorax-R2] Processing recording lifecycle for meeting: {meeting_id}")
    college_slug, title, duration = parse_meeting_metadata(meeting_id)
    print(f"[Aeorax-R2] Tenant College: {college_slug} | Title: {title} | Duration: {duration}s")

    r2_key, size_bytes = archive_and_upload(meeting_id, college_slug)
    if not r2_key:
        print("[Aeorax-R2] Migration failed, leaving local files intact for retry.")
        sys.exit(1)

    # Notify Aeorax Panel Ingest API
    ingest_payload = json.dumps({
        "bbbRecordId": meeting_id,
        "collegeSlug": college_slug,
        "title": title,
        "durationSeconds": duration,
        "sizeBytes": size_bytes,
        "r2Key": r2_key,
        "r2Bucket": R2_BUCKET,
        "sharedSecret": SHARED_SECRET
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            f"{PANEL_URL}/api/recordings/ingest",
            data=ingest_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            print(f"[Aeorax-R2] Successfully notified panel database: {res.read().decode('utf-8')}")
    except Exception as e:
        print(f"[Aeorax-R2] Warning: Failed to notify panel database: {e}", file=sys.stderr)

    # Now that the recording is securely stored in R2, prune bulky raw recording data on the BBB server
    cleanup_local_raw(meeting_id)
    print(f"[Aeorax-R2] Lifecycle complete! Recording moved to {college_slug}/ in Cloudflare R2.")

if __name__ == "__main__":
    main()
