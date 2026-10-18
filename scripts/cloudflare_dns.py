#!/usr/bin/env python3
"""
Aeorax Live — Cloudflare DNS-Only Node Provisioner
Ensures all BigBlueButton meeting nodes are provisioned with proxied=False (Grey Cloud).
Supports --dry-run mode for pre-flight verification without changing production DNS.
"""

import sys
import os
import argparse
import json

def provision_node_record(hostname: str, ipv4: str, dry_run: bool = True):
    print(f"[*] Preparing DNS record for BigBlueButton Node:")
    print(f"    - Hostname : {hostname}")
    print(f"    - IPv4     : {ipv4}")
    print(f"    - Type     : A")
    print(f"    - Proxied  : FALSE (DNS-Only / Grey Cloud - Mandatory for WebRTC media)")

    cf_api_token = os.environ.get("CLOUDFLARE_API_TOKEN")
    cf_zone_id = os.environ.get("CLOUDFLARE_ZONE_ID")

    if dry_run or not cf_api_token or not cf_zone_id:
        print("\n[DRY RUN / SIMULATION MODE]")
        if not cf_api_token or not cf_zone_id:
            print("[INFO] CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID not set in environment.")
        print(f"[SUCCESS] Proposed Cloudflare Payload:")
        payload = {
            "type": "A",
            "name": hostname,
            "content": ipv4,
            "ttl": 120,
            "proxied": False,
            "comment": "Aeorax Live BigBlueButton Dedicated Media Node"
        }
        print(json.dumps(payload, indent=2))
        return True

    # Real API execution if credentials provided
    import urllib.request
    url = f"https://api.cloudflare.com/client/v4/zones/{cf_zone_id}/dns_records"
    headers = {
        "Authorization": f"Bearer {cf_api_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "type": "A",
        "name": hostname,
        "content": ipv4,
        "ttl": 120,
        "proxied": False,
        "comment": "Aeorax Live BigBlueButton Dedicated Media Node"
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if res_data.get("success"):
                print(f"[SUCCESS] DNS record created in Cloudflare (ID: {res_data['result']['id']})")
                return True
            else:
                print(f"[ERROR] Cloudflare API error: {res_data.get('errors')}")
                return False
    except Exception as e:
        print(f"[ERROR] Failed to communicate with Cloudflare API: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Provision Cloudflare DNS-Only A-Record for BBB Node")
    parser.add_argument("--hostname", required=True, help="Node FQDN, e.g. node1.aeoraxlive.com")
    parser.add_argument("--ip", required=True, help="Node Public IPv4 address")
    parser.add_argument("--execute", action="store_true", help="Execute against live Cloudflare API (default is dry-run)")

    args = parser.parse_args()
    dry_run = not args.execute

    success = provision_node_record(args.hostname, args.ip, dry_run=dry_run)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
