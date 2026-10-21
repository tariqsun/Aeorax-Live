"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Video,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

function SessionEndedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "The meeting session has ended.";
  const meetingID = searchParams.get("meetingID") || "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-x-2 flex items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-black text-lg">
            A
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Aeorax <span className="text-blue-400">Live</span>
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Classroom Session Concluded
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {decodeURIComponent(reason)}
            </p>
          </div>

          {/* Meeting Details Pill */}
          {meetingID && (
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Session Identifier
              </span>
              <div className="font-mono font-bold text-slate-300 truncate">
                {meetingID}
              </div>
            </div>
          )}

          {/* Recording Notice */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 text-left flex items-start space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 shrink-0 mt-0.5">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-indigo-200">
                Session Recording Pipeline
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                If recording was enabled for this classroom, BigBlueButton is now packaging audio and presentation slides for Cloudflare R2 archival.
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <a
              href="/"
              className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Aeorax Live Dashboard</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 font-medium">
          Powered by Aeorax Live Multi-Tenant Cloud Architecture
        </div>
      </div>
    </div>
  );
}

export default function SessionEndedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">
          Loading session status...
        </div>
      }
    >
      <SessionEndedContent />
    </Suspense>
  );
}
