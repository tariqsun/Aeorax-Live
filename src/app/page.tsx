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
} from "lucide-react";

interface NodeData {
  id: string;
  name: string;
  fqdn: string;
  ip: string;
  status: "READY" | "DRAIN" | "PROVISIONING";
  cpu: number;
  steal: number;
  ram: number;
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
}

export default function AeoraxDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "nodes" | "colleges" | "recordings" | "advisor">("overview");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Apply light theme by default or saved preference
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

  // Realistic sample demo data for visualization
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: "node-1",
      name: "BBB Node 01 (Primary Pool)",
      fqdn: "node1.aeoraxlive.com",
      ip: "198.51.100.11",
      status: "READY",
      cpu: 48.2,
      steal: 0.2,
      ram: 58.4,
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
      ram: 64.1,
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
      ram: 42.0,
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
      ram: 28.0,
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
    },
  ];

  const totalRooms = nodes.reduce((acc, n) => acc + n.meetings, 0);
  const totalStudents = nodes.reduce((acc, n) => acc + n.participants, 0);
  const totalCams = nodes.reduce((acc, n) => acc + n.webcams, 0);

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
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c101a]/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-md shadow-blue-500/25">
            A
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Aeorax Live</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-semibold">
                Control Plane
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold">
                BBB 3.0.39 Stable
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Managed BigBlueButton Multi-Tenant Platform for Colleges
            </p>
          </div>
        </div>

        {/* Global Cluster State & Controls */}
        <div className="flex items-center space-x-5 text-sm">
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-800 dark:text-emerald-300 font-semibold text-xs">Cluster: Online</span>
          </div>

          <div className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
            Target OS: <span className="text-slate-700 dark:text-slate-200 font-mono font-medium">Ubuntu 22.04 LTS</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
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
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Top Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Active Colleges</span>
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">{colleges.length}</div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">100% Tenant Isolation</div>
          </div>

          <div className="card-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>BBB Nodes Fleet</span>
              <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">{nodes.length}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">3 Ready / 1 Draining</div>
          </div>

          <div className="card-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Active Classrooms</span>
              <Video className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">{totalRooms}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Distributed via Scalelite</div>
          </div>

          <div className="card-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Live Students / Cams</span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">{totalStudents}</div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">{totalCams} active video feeds</div>
          </div>

          <div className="card-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>R2 Cloud Storage</span>
              <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white">152 GB</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Zero Egress Fees</div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* SRE Advisor Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/40 flex items-start justify-between shadow-xs">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Smart Capacity Advisor: Nominal Load</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-bold">
                      HEALTHY
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Current aggregate node utilization is 52.4%. All active meeting streams and webcams are operating with low jitter (&lt;12ms) and 0% packet loss.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                    <span>Active BBB Pool: 3 Ready Nodes</span>
                    <span>•</span>
                    <span>Max Concurrent Capacity: ~600 Students</span>
                    <span>•</span>
                    <span>Recommendation: No Scaling Needed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nodes Quick List */}
            <div className="card-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Dedicated BigBlueButton Nodes</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Direct WebRTC IPv4 Nodes (Cloudflare DNS-Only)</p>
                </div>
                <button
                  onClick={() => setActiveTab("nodes")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Manage Fleet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{node.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              node.status === "READY"
                                ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
                                : "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{node.fqdn}</div>
                      </div>
                      <button
                        onClick={() => toggleDrain(node.id)}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition ${
                          node.status === "READY"
                            ? "border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-transparent dark:hover:bg-amber-500/10"
                            : "border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-transparent dark:hover:bg-emerald-500/10"
                        }`}
                      >
                        {node.status === "READY" ? "Drain Node" : "Enable Node"}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-slate-500 dark:text-slate-400 font-medium">CPU Load</div>
                        <div className="text-slate-900 dark:text-white font-bold mt-0.5">{node.cpu}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 dark:text-slate-400 font-medium">Active Rooms</div>
                        <div className="text-slate-900 dark:text-white font-bold mt-0.5">{node.meetings}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 dark:text-slate-400 font-medium">Students / Cams</div>
                        <div className="text-slate-900 dark:text-white font-bold mt-0.5">
                          {node.participants} / {node.webcams}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEETING NODES */}
        {activeTab === "nodes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">BigBlueButton Nodes Inventory</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage high-performance dedicated media servers</p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/20">
                <PlusCircle className="w-4 h-4" />
                <span>Add Node Wizard</span>
              </button>
            </div>

            <div className="card-panel rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Server / FQDN</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">CPU & Steal</th>
                    <th className="py-4 px-5">Memory</th>
                    <th className="py-4 px-5">Rooms</th>
                    <th className="py-4 px-5">Students / Cams</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-white">{node.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{node.fqdn}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            node.status === "READY"
                              ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
                              : "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
                          }`}
                        >
                          {node.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{node.cpu}% CPU</div>
                        <div className="text-slate-500">{node.steal}% Steal</div>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {node.ram}% RAM
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{node.meetings}</td>
                      <td className="py-4 px-5 font-mono text-xs">
                        {node.participants} users ({node.webcams} cams)
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => toggleDrain(node.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition ${
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

        {/* TAB 3: COLLEGES & QUOTAS */}
        {activeTab === "colleges" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">College Tenants & Quotas</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enforce atomic server-side concurrent room and seat leases
                </p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/20">
                <PlusCircle className="w-4 h-4" />
                <span>Onboard College</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colleges.map((col) => (
                <div key={col.id} className="card-panel p-6 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{col.name}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Slug: <span className="text-blue-600 dark:text-blue-400 font-semibold">{col.slug}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold">
                      {col.plan}
                    </span>
                  </div>

                  {/* Room Quota Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Concurrent Classrooms</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {col.activeRooms} / {col.maxRooms} rooms
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${(col.activeRooms / col.maxRooms) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Student Seats Quota Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Concurrent Students</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {col.activeStudents} / {col.maxStudents} seats
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${(col.activeStudents / col.maxStudents) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Storage Quota */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Cloudflare R2 Recording Storage</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {col.storageGb} / {col.storageLimitGb} GB
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${(col.storageGb / col.storageLimitGb) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Isolated Moodle API Secret</span>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                      Manage Keys →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RECORDINGS */}
        {activeTab === "recordings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recording & Cloudflare R2 Pipeline</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified archival lifecycle with zero student data loss
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-panel p-5 rounded-2xl">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  1. Raw BBB Spool
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5">2 Pending</div>
                <div className="text-xs text-slate-500 mt-1">Local capture on node</div>
              </div>
              <div className="card-panel p-5 rounded-2xl">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  2. Scalelite Importer
                </div>
                <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">1 Ingesting</div>
                <div className="text-xs text-slate-500 mt-1">Shared presentation spool</div>
              </div>
              <div className="card-panel p-5 rounded-2xl">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  3. Cloudflare R2 Archive
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">1,248 Verified</div>
                <div className="text-xs text-slate-500 mt-1">SHA-256 Checksum Match</div>
              </div>
              <div className="card-panel p-5 rounded-2xl">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  4. Safety Retention
                </div>
                <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1.5">48 Hours</div>
                <div className="text-xs text-slate-500 mt-1">Gate before local purge</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SMART CAPACITY ADVISOR */}
        {activeTab === "advisor" && (
          <div className="space-y-6">
            <div className="card-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">SRE Capacity & Autoscaling Advisor</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Continuous telemetry heuristics & predictive bottleneck detection
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-200 font-mono text-xs space-y-2 border border-slate-800">
                <div className="text-blue-400 font-bold">[DIAGNOSTIC SNAPSHOT]</div>
                <div>Node 1: CPU=48.2% | Steal=0.2% | Rooms=8  | Cams=42  -&gt; STATUS: NOMINAL</div>
                <div>Node 2: CPU=62.7% | Steal=0.4% | Rooms=11 | Cams=68  -&gt; STATUS: ELEVATED (Monitor)</div>
                <div>Node 3: CPU=34.0% | Steal=0.1% | Rooms=5  | Cams=25  -&gt; STATUS: NOMINAL</div>
                <div>Node 4: CPU=12.1% | Steal=0.1% | Rooms=1  | Cams=2   -&gt; STATUS: DRAINING</div>
                <div className="text-emerald-400 font-bold mt-2">&gt;&gt; OVERALL FLEET HEALTH SCORE: 92/100 (HEALTHY)</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101a] py-4 px-6 text-center text-xs text-slate-500">
        Aeorax Live Managed BigBlueButton Control Plane • BigBlueButton 3.0.39 • PostgreSQL 16 • Redis 7 • Cloudflare R2
      </footer>
    </div>
  );
}
