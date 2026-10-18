"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  Users,
  Video,
  ShieldCheck,
  Activity,
  GraduationCap,
  HardDrive,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Lock,
  Sun,
  Moon,
  Sparkles,
  Layers,
  CheckCircle,
  Cpu,
  Database,
} from "lucide-react";

interface NodeData {
  id: string;
  name: string;
  fqdn: string;
  ip: string;
  status: "READY" | "DRAIN" | "PROVISIONING";
  cpu: number;
  steal: number;
  ramPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskPercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  meetings: number;
  participants: number;
  webcams: number;
}

interface CollegeData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  activeRooms: number;
  maxRooms: number;
  activeStudents: number;
  maxStudents: number;
  storageGb: number;
  storageLimitGb: number;
  status: "ACTIVE" | "TRIAL";
  accentColor: "blue" | "purple" | "emerald" | "amber";
}

export default function AeoraxDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "nodes" | "colleges" | "recordings" | "advisor">("overview");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("aeorax-theme") as "light" | "dark") || "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("aeorax-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: "node-1",
      name: "BBB Node 01 (Primary Pool)",
      fqdn: "node1.aeoraxlive.com",
      ip: "198.51.100.11",
      status: "READY",
      cpu: 48.2,
      steal: 0.2,
      ramPercent: 58.4,
      ramUsedGb: 9.3,
      ramTotalGb: 16,
      diskPercent: 42.0,
      diskUsedGb: 42,
      diskTotalGb: 100,
      meetings: 8,
      participants: 240,
      webcams: 42,
    },
    {
      id: "node-2",
      name: "BBB Node 02 (Primary Pool)",
      fqdn: "node2.aeoraxlive.com",
      ip: "198.51.100.12",
      status: "READY",
      cpu: 62.7,
      steal: 0.4,
      ramPercent: 64.1,
      ramUsedGb: 10.3,
      ramTotalGb: 16,
      diskPercent: 54.5,
      diskUsedGb: 54.5,
      diskTotalGb: 100,
      meetings: 11,
      participants: 310,
      webcams: 68,
    },
    {
      id: "node-3",
      name: "BBB Node 03 (Dedicated Stanford)",
      fqdn: "node3.aeoraxlive.com",
      ip: "198.51.100.13",
      status: "READY",
      cpu: 34.0,
      steal: 0.1,
      ramPercent: 42.0,
      ramUsedGb: 13.4,
      ramTotalGb: 32,
      diskPercent: 28.0,
      diskUsedGb: 56,
      diskTotalGb: 200,
      meetings: 5,
      participants: 180,
      webcams: 25,
    },
    {
      id: "node-4",
      name: "BBB Node 04 (Maintenance Drain)",
      fqdn: "node4.aeoraxlive.com",
      ip: "198.51.100.14",
      status: "DRAIN",
      cpu: 12.1,
      steal: 0.1,
      ramPercent: 28.0,
      ramUsedGb: 4.5,
      ramTotalGb: 16,
      diskPercent: 35.0,
      diskUsedGb: 35,
      diskTotalGb: 100,
      meetings: 1,
      participants: 12,
      webcams: 2,
    },
  ]);

  const colleges: CollegeData[] = [
    {
      id: "col-1",
      name: "Oxford International College",
      slug: "oxford-intl",
      plan: "Enterprise Tier (15 Rooms)",
      activeRooms: 7,
      maxRooms: 15,
      activeStudents: 285,
      maxStudents: 600,
      storageGb: 48,
      storageLimitGb: 200,
      status: "ACTIVE",
      accentColor: "blue",
    },
    {
      id: "col-2",
      name: "Beaconhouse National Institute",
      slug: "beaconhouse",
      plan: "Standard College (8 Rooms)",
      activeRooms: 6,
      maxRooms: 8,
      activeStudents: 220,
      maxStudents: 300,
      storageGb: 32,
      storageLimitGb: 100,
      status: "ACTIVE",
      accentColor: "purple",
    },
    {
      id: "col-3",
      name: "Cambridge Academy of Sciences",
      slug: "cambridge-sci",
      plan: "Pro Growth (10 Rooms)",
      activeRooms: 9,
      maxRooms: 10,
      activeStudents: 215,
      maxStudents: 400,
      storageGb: 64,
      storageLimitGb: 150,
      status: "ACTIVE",
      accentColor: "emerald",
    },
    {
      id: "col-4",
      name: "Lahore Grammar Distance Learning",
      slug: "lg-online",
      plan: "Starter Trial (3 Rooms)",
      activeRooms: 3,
      maxRooms: 3,
      activeStudents: 22,
      maxStudents: 100,
      storageGb: 8,
      storageLimitGb: 25,
      status: "TRIAL",
      accentColor: "amber",
    },
  ];

  const totalRooms = nodes.reduce((acc, n) => acc + n.meetings, 0);
  const totalStudents = nodes.reduce((acc, n) => acc + n.participants, 0);
  const totalCams = nodes.reduce((acc, n) => acc + n.webcams, 0);
  const totalRamUsed = nodes.reduce((acc, n) => acc + n.ramUsedGb, 0);
  const totalRamTotal = nodes.reduce((acc, n) => acc + n.ramTotalGb, 0);
  const totalDiskUsed = nodes.reduce((acc, n) => acc + n.diskUsedGb, 0);
  const totalDiskTotal = nodes.reduce((acc, n) => acc + n.diskTotalGb, 0);

  const toggleDrain = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, status: n.status === "READY" ? "DRAIN" : "READY" }
          : n
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar with Frosted Glass Effect */}
      <header className="border-b border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c101a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-200">
            A
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Aeorax Live
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-300/80 dark:border-blue-500/20 font-bold tracking-wide">
                Control Plane
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/20 font-bold tracking-wide">
                BBB 3.0.39 Stable
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Managed BigBlueButton Multi-Tenant Platform for Colleges
            </p>
          </div>
        </div>

        {/* Global Cluster State & Controls */}
        <div className="flex items-center space-x-5 text-sm">
          <div className="flex items-center space-x-2 bg-emerald-100/60 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-300/80 dark:border-emerald-800/40 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-900 dark:text-emerald-300 font-bold text-xs tracking-wide">Cluster: Online</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span>Target OS:</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">Ubuntu 22.04 LTS</span>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Theme Toggle Button with Hover Glow */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 shadow-xs hover:shadow-md transform hover:scale-105"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs with Vibrant Active States */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "nodes", label: "BBB Meeting Nodes", icon: Server },
            { id: "colleges", label: "Colleges & Quotas", icon: GraduationCap },
            { id: "recordings", label: "Recording & R2 Pipeline", icon: Video },
            { id: "advisor", label: "Smart Capacity Advisor", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2.5 px-4.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 transform ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-102"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TOP METRIC HIGHLIGHTS — COLORFUL GLASS CARDS WITH HOVER LIFT & GLOW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Active Colleges (Blue Gradient Glass) */}
          <div className="glass-card glass-hover card-theme-blue p-5 rounded-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                Active Colleges
              </span>
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform duration-200">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
              {colleges.length}
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mt-2">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>100% Tenant Isolation</span>
            </div>
          </div>

          {/* Card 2: BBB Nodes Fleet (Purple Gradient Glass) */}
          <div className="glass-card glass-hover card-theme-purple p-5 rounded-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                BBB Nodes Fleet
              </span>
              <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform duration-200">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
              {nodes.length}
            </div>
            <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mt-2">
              3 Ready • 1 Draining
            </div>
          </div>

          {/* Card 3: Active Classrooms (Amber/Sunset Gradient Glass) */}
          <div className="glass-card glass-hover card-theme-amber p-5 rounded-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Active Classrooms
              </span>
              <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform duration-200">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
              {totalRooms}
            </div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-2">
              Distributed via Scalelite
            </div>
          </div>

          {/* Card 4: Live Students / Cams (Emerald Gradient Glass) */}
          <div className="glass-card glass-hover card-theme-emerald p-5 rounded-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                Live Students & Cams
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
              {totalStudents}
            </div>
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">
              {totalCams} active video feeds
            </div>
          </div>

          {/* Card 5: Fleet Hardware Usage: RAM & Disk (Rose/Pink Gradient Glass) */}
          <div className="glass-card glass-hover card-theme-rose p-5 rounded-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all duration-300" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">
                Fleet RAM & Disk
              </span>
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/30 group-hover:scale-110 transition-transform duration-200">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
              {totalRamUsed.toFixed(1)} <span className="text-sm font-bold text-slate-500">/ {totalRamTotal} GB RAM</span>
            </div>
            <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-2">
              Disk: {totalDiskUsed.toFixed(0)} / {totalDiskTotal} GB NVMe
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Smart Capacity Advisor Hero Glass Banner with Ambient Glow */}
            <div className="glass-card glass-hover p-6 rounded-3xl relative overflow-hidden border border-blue-200/90 dark:border-blue-800/40 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/50 dark:from-blue-950/40 dark:via-slate-900/80 dark:to-indigo-950/40 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        Smart Capacity Advisor: Nominal Cluster Load
                      </h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-black tracking-wide shadow-xs">
                        HEALTHY
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-3xl">
                      Current aggregate node fleet utilization is <strong className="text-blue-600 dark:text-blue-400 font-bold">52.4%</strong>. All active WebRTC meeting streams and webcams are operating with ultra-low jitter (&lt;12ms) and 0% packet loss.
                    </p>
                    <div className="flex items-center space-x-4 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-3.5">
                      <span className="bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        Active Pool: 3 Ready Nodes
                      </span>
                      <span>•</span>
                      <span className="bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        Max Concurrent Capacity: ~600 Students
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-sans">
                        ✓ No Scaling Action Required
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedicated BBB Nodes Grid with Detailed RAM & Disk Meters */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Dedicated BigBlueButton Nodes</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Hardware Telemetry: Real-time CPU, RAM & NVMe Disk Allocation
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("nodes")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/20 transition-all hover:scale-105"
                >
                  <span>Manage Fleet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="glass-card glass-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 group border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{node.name}</span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black tracking-wide ${
                              node.status === "READY"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{node.fqdn}</div>
                      </div>
                      <button
                        onClick={() => toggleDrain(node.id)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all duration-200 transform hover:scale-105 ${
                          node.status === "READY"
                            ? "border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100"
                            : "border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100"
                        }`}
                      >
                        {node.status === "READY" ? "Drain Node" : "Enable Node"}
                      </button>
                    </div>

                    {/* Hardware Metrics Summary: CPU, Rooms, Students */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="bg-slate-50/90 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] flex items-center space-x-1">
                          <Cpu className="w-3 h-3 text-blue-500" />
                          <span>CPU Load</span>
                        </div>
                        <div className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{node.cpu}%</div>
                        <div className="text-[10px] text-slate-500">{node.steal}% Steal</div>
                      </div>

                      <div className="bg-slate-50/90 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] flex items-center space-x-1">
                          <Video className="w-3 h-3 text-indigo-500" />
                          <span>Active Rooms</span>
                        </div>
                        <div className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{node.meetings}</div>
                        <div className="text-[10px] text-slate-500">{node.webcams} Webcams</div>
                      </div>

                      <div className="bg-slate-50/90 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        <div className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] flex items-center space-x-1">
                          <Users className="w-3 h-3 text-emerald-500" />
                          <span>Live Students</span>
                        </div>
                        <div className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{node.participants}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active Audio</div>
                      </div>
                    </div>

                    {/* Dedicated RAM & Disk Progress Status */}
                    <div className="space-y-2.5 pt-2">
                      {/* RAM Memory Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center space-x-1">
                            <Database className="w-3.5 h-3.5 text-purple-500" />
                            <span>Memory (RAM)</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {node.ramUsedGb} / {node.ramTotalGb} GB ({node.ramPercent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${node.ramPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* NVMe Disk Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center space-x-1">
                            <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                            <span>NVMe Disk Storage</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">
                            {node.diskUsedGb} / {node.diskTotalGb} GB ({node.diskPercent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${node.diskPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEETING NODES INVENTORY TABLE WITH RAM & DISK STATUS */}
        {activeTab === "nodes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">BigBlueButton Nodes Inventory</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Detailed hardware telemetry: CPU, RAM memory, and NVMe disk quotas
                </p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105">
                <PlusCircle className="w-4 h-4" />
                <span>Add Node Wizard</span>
              </button>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Server / FQDN</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">CPU & Steal</th>
                    <th className="py-4 px-5">RAM Memory</th>
                    <th className="py-4 px-5">NVMe Disk</th>
                    <th className="py-4 px-5">Rooms & Cams</th>
                    <th className="py-4 px-5">Students</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 dark:text-white">{node.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{node.fqdn}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{node.ip}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-black ${
                            node.status === "READY"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
                          }`}
                        >
                          {node.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">{node.cpu}% CPU</div>
                        <div className="text-slate-500">{node.steal}% Steal</div>
                      </td>

                      {/* RAM Memory Column with Status Bar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900 dark:text-white">
                          <span>{node.ramUsedGb} / {node.ramTotalGb} GB</span>
                          <span className="text-purple-600 dark:text-purple-400">{node.ramPercent}%</span>
                        </div>
                        <div className="h-1.5 w-28 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-slate-200/60 dark:border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                            style={{ width: `${node.ramPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* NVMe Disk Column with Status Bar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900 dark:text-white">
                          <span>{node.diskUsedGb} / {node.diskTotalGb} GB</span>
                          <span className="text-cyan-600 dark:text-cyan-400">{node.diskPercent}%</span>
                        </div>
                        <div className="h-1.5 w-28 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-slate-200/60 dark:border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                            style={{ width: `${node.diskPercent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-black text-slate-900 dark:text-white">{node.meetings} Rooms</div>
                        <div className="text-xs text-slate-500">{node.webcams} active cams</div>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {node.participants} users
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => toggleDrain(node.id)}
                          className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all duration-200 transform hover:scale-105 ${
                            node.status === "READY"
                              ? "border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-transparent dark:hover:bg-amber-500/10"
                              : "border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-transparent dark:hover:bg-emerald-500/10"
                          }`}
                        >
                          {node.status === "READY" ? "Drain" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COLLEGES & QUOTAS — COLORFUL CARDS WITH VIBRANT PROGRESS METERS */}
        {activeTab === "colleges" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">College Tenants & Quotas</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Enforce atomic server-side concurrent room and seat leases
                </p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105">
                <PlusCircle className="w-4 h-4" />
                <span>Onboard College</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {colleges.map((col) => (
                <div key={col.id} className="glass-card glass-hover p-6 rounded-3xl space-y-4 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {col.name}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                        Tenant Slug: <span className="text-blue-600 dark:text-blue-400 font-bold">{col.slug}</span>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/20 font-black">
                      {col.plan}
                    </span>
                  </div>

                  {/* Room Quota Multi-stop Gradient Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Concurrent Classrooms</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {col.activeRooms} / {col.maxRooms} rooms
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${(col.activeRooms / col.maxRooms) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Student Seats Quota Multi-stop Gradient Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Concurrent Students</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {col.activeStudents} / {col.maxStudents} seats
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-400 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${(col.activeStudents / col.maxStudents) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Storage Quota Multi-stop Gradient Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-semibold">Cloudflare R2 Recording Storage</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {col.storageGb} / {col.storageLimitGb} GB
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-green-400 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${(col.storageGb / col.storageLimitGb) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Isolated Moodle API Secret</span>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold hover:underline">
                      Manage Keys →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RECORDINGS PIPELINE — COLORFUL STAGES */}
        {activeTab === "recordings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Recording & Cloudflare R2 Pipeline</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Verified archival lifecycle with zero student data loss
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card glass-hover card-theme-amber p-6 rounded-3xl">
                <div className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  1. Raw BBB Spool
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">2 Pending</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Local capture on node</div>
              </div>

              <div className="glass-card glass-hover card-theme-blue p-6 rounded-3xl">
                <div className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  2. Scalelite Importer
                </div>
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">1 Ingesting</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Shared presentation spool</div>
              </div>

              <div className="glass-card glass-hover card-theme-emerald p-6 rounded-3xl">
                <div className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  3. Cloudflare R2 Archive
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">1,248 Verified</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">SHA-256 Checksum Match</div>
              </div>

              <div className="glass-card glass-hover card-theme-purple p-6 rounded-3xl">
                <div className="text-xs font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                  4. Safety Retention
                </div>
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">48 Hours</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Gate before local purge</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SMART CAPACITY ADVISOR */}
        {activeTab === "advisor" && (
          <div className="space-y-6">
            <div className="glass-card glass-hover p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    SRE Capacity & Autoscaling Advisor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Continuous telemetry heuristics & predictive bottleneck detection
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-slate-200 font-mono text-xs space-y-2 border border-slate-800 shadow-md">
                <div className="text-blue-400 font-black">[DIAGNOSTIC SNAPSHOT]</div>
                <div>Node 1: CPU=48.2% | RAM=58.4% (9.3/16 GB) | Disk=42% (42/100 GB) | Cams=42 -&gt; STATUS: NOMINAL</div>
                <div>Node 2: CPU=62.7% | RAM=64.1% (10.3/16 GB)| Disk=54.5% (54.5/100 GB) | Cams=68 -&gt; STATUS: ELEVATED (Monitor)</div>
                <div>Node 3: CPU=34.0% | RAM=42.0% (13.4/32 GB)| Disk=28% (56/200 GB) | Cams=25 -&gt; STATUS: NOMINAL</div>
                <div>Node 4: CPU=12.1% | RAM=28.0% (4.5/16 GB) | Disk=35% (35/100 GB) | Cams=2  -&gt; STATUS: DRAINING</div>
                <div className="text-emerald-400 font-black mt-2">&gt;&gt; OVERALL FLEET HEALTH SCORE: 92/100 (HEALTHY)</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer with Subtle Glass Effect */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0c101a]/70 backdrop-blur py-4 px-6 text-center text-xs text-slate-500 font-medium">
        Aeorax Live Managed BigBlueButton Control Plane • BigBlueButton 3.0.39 • PostgreSQL 16 • Redis 7 • Cloudflare R2
      </footer>
    </div>
  );
}
