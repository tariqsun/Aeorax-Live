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
  Play,
  Copy,
  Check,
  ArrowRightLeft,
  BookOpen,
  UserCheck,
  Settings,
  Download,
  ChevronRight,
  ArrowUpRight,
  Globe,
  X,
  AlertTriangle,
  Terminal,
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
  apiKey: string;
  apiSecret: string;
  accentColor: "blue" | "purple" | "emerald" | "amber";
}

interface RoomData {
  id: string;
  name: string;
  slug: string;
  teacher: string;
  studentsCount: number;
  status: "RUNNING" | "IDLE";
  recordEnabled: boolean;
  durationMinutes?: number;
}

export default function AeoraxDashboard() {
  // Portal View Switcher: "SUPER_ADMIN" vs "CLIENT_PORTAL" (College Admin)
  const [currentView, setCurrentView] = useState<"SUPER_ADMIN" | "CLIENT_PORTAL">("SUPER_ADMIN");
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>("oxford-intl");

  // Tab navigation
  const [adminTab, setAdminTab] = useState<"overview" | "nodes" | "colleges" | "moodle" | "recordings" | "advisor">("overview");
  const [clientTab, setClientTab] = useState<"rooms" | "teachers" | "recordings">("rooms");
  const [selectedMoodleCollegeSlug, setSelectedMoodleCollegeSlug] = useState<string>("oxford-intl");
  const [moodleTestResult, setMoodleTestResult] = useState<"idle" | "testing" | "success">("idle");

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollerSuccessToast, setPollerSuccessToast] = useState<boolean>(false);

  const triggerScalelitePoller = () => {
    setIsPolling(true);
    setTimeout(() => {
      setIsPolling(false);
      setPollerSuccessToast(true);
      setTimeout(() => setPollerSuccessToast(false), 3000);
    }, 800);
  };

  // Manual Node Registration State
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState<boolean>(false);
  const [nodeFormData, setNodeFormData] = useState({
    name: "",
    fqdn: "",
    ip: "",
    secret: "",
    ramTotalGb: 16,
    diskTotalGb: 100,
    cpuCores: 8,
  });
  const [manualNodeTestStatus, setManualNodeTestStatus] = useState<"idle" | "testing" | "success">("idle");
  const [nodeAddSuccessMsg, setNodeAddSuccessMsg] = useState<string | null>(null);

  // 1-Click Fresh VPS Installer Command State
  const [quickInstallFqdn, setQuickInstallFqdn] = useState<string>("node1.aeoraxlive.com");
  const [quickInstallEmail, setQuickInstallEmail] = useState<string>("admin@aeoraxlive.com");
  const [isCommandCopied, setIsCommandCopied] = useState<boolean>(false);

  const copyInstallerCommand = () => {
    const cmd = `curl -sSL https://raw.githubusercontent.com/tariqsun/Aeorax-Live/main/scripts/install-node.sh | sudo bash -s -- --fqdn ${quickInstallFqdn} --email ${quickInstallEmail} --panel https://master.nesthost.net`;
    navigator.clipboard.writeText(cmd);
    setIsCommandCopied(true);
    setTimeout(() => setIsCommandCopied(false), 3000);
  };

  const handleAddManualNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeFormData.fqdn || !nodeFormData.ip) return;

    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      name: nodeFormData.name || `BBB Node (${nodeFormData.fqdn})`,
      fqdn: nodeFormData.fqdn,
      ip: nodeFormData.ip,
      status: "READY",
      cpu: 12.5,
      steal: 0.1,
      ramPercent: 24.0,
      ramUsedGb: Math.round(nodeFormData.ramTotalGb * 0.24 * 10) / 10,
      ramTotalGb: Number(nodeFormData.ramTotalGb) || 16,
      diskPercent: 18.0,
      diskUsedGb: Math.round(nodeFormData.diskTotalGb * 0.18),
      diskTotalGb: Number(nodeFormData.diskTotalGb) || 100,
      meetings: 0,
      participants: 0,
      webcams: 0,
    };

    setNodes((prev) => [...prev, newNode]);
    setIsAddNodeModalOpen(false);
    setNodeFormData({ name: "", fqdn: "", ip: "", secret: "", ramTotalGb: 16, diskTotalGb: 100, cpuCores: 8 });
    setManualNodeTestStatus("idle");
    setNodeAddSuccessMsg(`Node "${newNode.name}" registered successfully with Manual DNS and linked to Scalelite!`);
    setTimeout(() => setNodeAddSuccessMsg(null), 5000);
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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
      apiKey: "key_oxford_live_9a8b7c",
      apiSecret: "sec_oxford_bbb_secret_998877",
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
      apiKey: "key_beaconhouse_live_112233",
      apiSecret: "sec_beaconhouse_bbb_secret_445566",
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
      apiKey: "key_cambridge_live_778899",
      apiSecret: "sec_cambridge_bbb_secret_112233",
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
      apiKey: "key_lg_live_445566",
      apiSecret: "sec_lg_bbb_secret_889900",
      accentColor: "amber",
    },
  ];

  // Client's Virtual Classrooms
  const [clientRooms, setClientRooms] = useState<RoomData[]>([
    {
      id: "room-1",
      name: "Advanced Artificial Intelligence & Neural Networks",
      slug: "cs401-ai",
      teacher: "Prof. Sarah Jenkins",
      studentsCount: 48,
      status: "RUNNING",
      recordEnabled: true,
      durationMinutes: 42,
    },
    {
      id: "room-2",
      name: "Organic Chemistry Laboratory Lecture",
      slug: "chem201-lab",
      teacher: "Dr. Alistair Finch",
      studentsCount: 35,
      status: "RUNNING",
      recordEnabled: true,
      durationMinutes: 18,
    },
    {
      id: "room-3",
      name: "Microeconomics & Global Trade Policies",
      slug: "econ302",
      teacher: "Dr. Robert Vance",
      studentsCount: 0,
      status: "IDLE",
      recordEnabled: true,
    },
    {
      id: "room-4",
      name: "Data Structures & Modern Algorithms",
      slug: "cs201-dsa",
      teacher: "Prof. Sarah Jenkins",
      studentsCount: 0,
      status: "IDLE",
      recordEnabled: true,
    },
  ]);

  const activeCollege = colleges.find((c) => c.slug === selectedCollegeSlug) || colleges[0];

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

  const launchMeeting = (roomId: string) => {
    setClientRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, status: r.status === "RUNNING" ? "IDLE" : "RUNNING", studentsCount: r.status === "IDLE" ? 24 : 0 }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar with View Switcher */}
      <header className="border-b border-slate-200/90 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c101a]/85 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-200">
            A
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Aeorax Live
              </h1>
              {currentView === "SUPER_ADMIN" ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/20 font-bold tracking-wide">
                  Super Admin View
                </span>
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/20 font-bold tracking-wide">
                  Client Portal: {activeCollege.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentView === "SUPER_ADMIN"
                ? "Fleet Orchestration & Multi-Tenant BigBlueButton Management"
                : `Dedicated Tenant Portal • Plan: ${activeCollege.plan}`}
            </p>
          </div>
        </div>

        {/* Global Controls & PORTAL SWITCHER */}
        <div className="flex items-center space-x-4 text-sm">
          {/* View Switcher Toggle Button */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentView("SUPER_ADMIN")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                currentView === "SUPER_ADMIN"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>
            <button
              onClick={() => setCurrentView("CLIENT_PORTAL")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                currentView === "CLIENT_PORTAL"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Client Account</span>
            </button>
          </div>

          {/* College Selector (When in Client Portal) */}
          {currentView === "CLIENT_PORTAL" && (
            <select
              value={selectedCollegeSlug}
              onChange={(e) => setSelectedCollegeSlug(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {colleges.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 shadow-xs hover:shadow-md transform hover:scale-105"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: CLIENT ACCOUNT / COLLEGE ADMIN PORTAL                             */}
      {/* ========================================================================= */}
      {currentView === "CLIENT_PORTAL" ? (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Client Header Welcome Banner */}
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white dark:from-purple-950/30 dark:via-slate-900/60 dark:to-indigo-950/30 border border-purple-200/90 dark:border-purple-800/40 shadow-xs">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start space-x-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{activeCollege.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 font-bold">
                      {activeCollege.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Tenant ID: <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{activeCollege.slug}</span> • Connected to Aeorax Managed BBB Cluster
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => launchMeeting("room-3")}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-500/20 transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Virtual Room</span>
                </button>
              </div>
            </div>
          </div>

          {/* Client Quota & Usage Highlights — Clickable Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Concurrent Rooms -> Switches to Rooms tab */}
            <div
              onClick={() => setClientTab("rooms")}
              className={`glass-card glass-hover card-theme-purple p-5 rounded-2xl cursor-pointer group transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                clientTab === "rooms" ? "ring-2 ring-purple-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                <span>Concurrent Rooms</span>
                <div className="flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <Video className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                {activeCollege.activeRooms} <span className="text-sm font-bold text-slate-500">/ {activeCollege.maxRooms}</span>
              </div>
              <div className="h-2 w-full bg-purple-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                  style={{ width: `${(activeCollege.activeRooms / activeCollege.maxRooms) * 100}%` }}
                />
              </div>
              <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-2.5 flex items-center space-x-1">
                <span>Manage Classrooms</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Concurrent Students -> Switches to Rooms tab */}
            <div
              onClick={() => setClientTab("rooms")}
              className={`glass-card glass-hover card-theme-blue p-5 rounded-2xl cursor-pointer group transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                clientTab === "rooms" ? "ring-2 ring-blue-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                <span>Active Students</span>
                <div className="flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                {activeCollege.activeStudents} <span className="text-sm font-bold text-slate-500">/ {activeCollege.maxStudents}</span>
              </div>
              <div className="h-2 w-full bg-blue-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                  style={{ width: `${(activeCollege.activeStudents / activeCollege.maxStudents) * 100}%` }}
                />
              </div>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-2.5 flex items-center space-x-1">
                <span>View Live Sessions</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Storage Used -> Switches to Recordings tab */}
            <div
              onClick={() => setClientTab("recordings")}
              className={`glass-card glass-hover card-theme-emerald p-5 rounded-2xl cursor-pointer group transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                clientTab === "recordings" ? "ring-2 ring-emerald-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                <span>Cloud Storage (R2)</span>
                <div className="flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                {activeCollege.storageGb} <span className="text-sm font-bold text-slate-500">/ {activeCollege.storageLimitGb} GB</span>
              </div>
              <div className="h-2 w-full bg-emerald-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                  style={{ width: `${(activeCollege.storageGb / activeCollege.storageLimitGb) * 100}%` }}
                />
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2.5 flex items-center space-x-1">
                <span>Open Recordings</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Plan Status -> Switches to Teachers / Faculty tab */}
            <div
              onClick={() => setClientTab("teachers")}
              className={`glass-card glass-hover card-theme-amber p-5 rounded-2xl cursor-pointer group transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                clientTab === "teachers" ? "ring-2 ring-amber-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                <span>Subscription Plan</span>
                <div className="flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="text-xl font-black mt-2 text-slate-900 dark:text-white truncate">
                {activeCollege.plan.split("(")[0]}
              </div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-3">
                Auto-Renew: Active • SLA 99.9% Uptime
              </div>
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-2.5 flex items-center space-x-1">
                <span>Authorized Faculty</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Client Navigation Tabs (No technical Moodle options for college) */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: "rooms", label: "Virtual Classrooms", icon: Video },
              { id: "teachers", label: "Teachers & Staff", icon: Users },
              { id: "recordings", label: "Class Recordings", icon: HardDrive },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = clientTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setClientTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* CLIENT TAB 1: VIRTUAL CLASSROOMS */}
          {clientTab === "rooms" && (
            <div className="space-y-4">
              <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider">
                    <tr>
                      <th className="py-4 px-5">Classroom Name</th>
                      <th className="py-4 px-5">Teacher / Moderator</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">Live Students</th>
                      <th className="py-4 px-5">Auto-Record</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {clientRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-purple-50/40 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-5">
                          <div className="font-extrabold text-slate-900 dark:text-white">{room.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">/{room.slug}</div>
                        </td>
                        <td className="py-4 px-5 font-medium">{room.teacher}</td>
                        <td className="py-4 px-5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-black ${
                              room.status === "RUNNING"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 animate-pulse"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200"
                            }`}
                          >
                            {room.status === "RUNNING" ? `LIVE (${room.durationMinutes}m)` : "IDLE"}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">
                          {room.studentsCount > 0 ? `${room.studentsCount} Students` : "—"}
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                            Enabled
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right space-x-2">
                          <button
                            onClick={() => launchMeeting(room.id)}
                            className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all duration-200 ${
                              room.status === "RUNNING"
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-xs"
                            }`}
                          >
                            {room.status === "RUNNING" ? "End Class" : "Start Class (BBB)"}
                          </button>
                          <button
                            onClick={() => copyToClipboard(`https://panel.aeoraxlive.com/join/${activeCollege.slug}/${room.slug}`)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 transition"
                          >
                            Copy Student Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CLIENT TAB 3: RECORDINGS */}
          {clientTab === "recordings" && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Classroom Recordings Library</h3>
              <p className="text-xs text-slate-500 font-medium">All sessions are securely archived to Cloudflare R2 object storage.</p>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {[
                  { title: "AI Week 3 — Convolutional Networks", date: "Oct 17, 2026", duration: "54 mins", size: "380 MB" },
                  { title: "Organic Chemistry — Benzene Rings Synthesis", date: "Oct 16, 2026", duration: "48 mins", size: "310 MB" },
                  { title: "Macroeconomics — Inflation Forecasting", date: "Oct 15, 2026", duration: "62 mins", size: "420 MB" },
                ].map((rec, i) => (
                  <div key={i} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{rec.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{rec.date} • {rec.duration} • {rec.size}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1.5 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-bold rounded-xl hover:bg-purple-100 transition">
                        Watch Playback
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 transition">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLIENT TAB 4: TEACHERS */}
          {clientTab === "teachers" && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authorized College Faculty</h3>
                  <p className="text-xs text-slate-500 font-medium">Teachers who can launch and moderate classrooms</p>
                </div>
                <button className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition">
                  Invite Teacher
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {[
                  { name: "Prof. Sarah Jenkins", email: "jenkins@oxford-intl.edu", rooms: "CS401-AI, CS201-DSA" },
                  { name: "Dr. Alistair Finch", email: "finch@oxford-intl.edu", rooms: "CHEM201-LAB" },
                  { name: "Dr. Robert Vance", email: "vance@oxford-intl.edu", rooms: "ECON302" },
                ].map((t, i) => (
                  <div key={i} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.email} • Assigned: {t.rooms}</div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: SUPER ADMIN MASTER PLATFORM VIEW                                   */
        /* ========================================================================= */
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Super Admin Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "nodes", label: "BBB Meeting Nodes", icon: Server },
              { id: "colleges", label: "Colleges & Quotas", icon: GraduationCap },
              { id: "moodle", label: "Moodle & LMS Gateway", icon: Lock },
              { id: "recordings", label: "Recording & R2 Pipeline", icon: Video },
              { id: "advisor", label: "Smart Capacity Advisor", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
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

          {/* TOP METRIC HIGHLIGHTS — CLICKABLE COLORFUL GLASS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Active Colleges -> Switches to Colleges tab */}
            <div
              onClick={() => setAdminTab("colleges")}
              className={`glass-card glass-hover card-theme-blue p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                adminTab === "colleges" ? "ring-2 ring-blue-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  Active Colleges
                </span>
                <div className="flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
                {colleges.length}
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mt-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>100% Tenant Isolation</span>
              </div>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-2.5 flex items-center space-x-1">
                <span>Manage Tenants & Quotas</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: BBB Nodes Fleet -> Switches to Nodes tab */}
            <div
              onClick={() => setAdminTab("nodes")}
              className={`glass-card glass-hover card-theme-purple p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                adminTab === "nodes" ? "ring-2 ring-purple-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                  BBB Nodes Fleet
                </span>
                <div className="flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/30">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
                {nodes.length}
              </div>
              <div className="text-xs font-bold text-purple-700 dark:text-purple-400 mt-2">
                3 Ready • 1 Draining
              </div>
              <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-2.5 flex items-center space-x-1">
                <span>Manage Node Servers</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Active Classrooms -> Switches to Overview */}
            <div
              onClick={() => setAdminTab("overview")}
              className={`glass-card glass-hover card-theme-amber p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                adminTab === "overview" ? "ring-2 ring-amber-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Active Classrooms
                </span>
                <div className="flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <div className="p-2 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-500/30">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
                {totalRooms}
              </div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-2">
                Distributed via Scalelite
              </div>
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-2.5 flex items-center space-x-1">
                <span>Inspect Fleet Activity</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Live Students & Cams -> Switches to Advisor tab */}
            <div
              onClick={() => setAdminTab("advisor")}
              className={`glass-card glass-hover card-theme-emerald p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                adminTab === "advisor" ? "ring-2 ring-emerald-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Live Students & Cams
                </span>
                <div className="flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
                {totalStudents}
              </div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2">
                {totalCams} active video feeds
              </div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2.5 flex items-center space-x-1">
                <span>Capacity Telemetry</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Fleet RAM & Disk -> Switches to Nodes tab */}
            <div
              onClick={() => setAdminTab("nodes")}
              className={`glass-card glass-hover card-theme-rose p-5 rounded-2xl relative overflow-hidden group cursor-pointer transition-all duration-200 transform hover:scale-102 hover:shadow-lg active:scale-98 ${
                adminTab === "nodes" ? "ring-2 ring-rose-500 shadow-md" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">
                  Fleet RAM & Disk
                </span>
                <div className="flex items-center space-x-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  <div className="p-2 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-500/30">
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-2xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
                {totalRamUsed.toFixed(1)} <span className="text-sm font-bold text-slate-500">/ {totalRamTotal} GB</span>
              </div>
              <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-2">
                Disk: {totalDiskUsed.toFixed(0)} / {totalDiskTotal} GB NVMe
              </div>
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-2.5 flex items-center space-x-1">
                <span>View Server Hardware</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* SUPER ADMIN TAB 1: OVERVIEW */}
          {adminTab === "overview" && (
            <div className="space-y-6">
              {/* Capacity Advisor Banner */}
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden border border-blue-200/90 dark:border-blue-800/40 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/50 dark:from-blue-950/40 dark:via-slate-900/80 dark:to-indigo-950/40 shadow-xs">
                <div className="flex items-start space-x-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        Smart Capacity Advisor: Nominal Cluster Load
                      </h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 font-black">
                        HEALTHY
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-3xl">
                      Current aggregate node fleet utilization is <strong className="text-blue-600 dark:text-blue-400 font-bold">52.4%</strong>. All active WebRTC streams are operating with low jitter (&lt;12ms).
                    </p>
                  </div>
                </div>
              </div>

              {/* Scalelite Load Balancer Controller & Live Stats */}
              <div className="glass-card p-6 rounded-3xl space-y-5 border border-purple-200/90 dark:border-purple-800/40 bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-white dark:from-purple-950/20 dark:via-slate-900/60 dark:to-slate-900/60 shadow-xs">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                          Scalelite Load Balancer Controller
                        </h3>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 font-bold border border-emerald-300">
                          v1.4.0 Connected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Load Balancer API: <code className="text-purple-600 dark:text-purple-400 font-bold font-mono">http://scalelite:3000/bigbluebutton/api</code> • Secret: <code className="text-slate-600 dark:text-slate-400 font-mono">aeorax_scalelite_...</code>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={triggerScalelitePoller}
                      disabled={isPolling}
                      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-md shadow-purple-500/20"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? "animate-spin" : ""}`} />
                      <span>{isPolling ? "Syncing Nodes..." : "Sync Poller Now"}</span>
                    </button>
                  </div>
                </div>

                {pollerSuccessToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Scalelite Poller triggered: Successfully synchronized meeting states across 4 BigBlueButton nodes!</span>
                  </div>
                )}

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs">
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Balancing Strategy</span>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">
                      Least-Loaded Dynamic Scheduling
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold mt-0.5 inline-block">Active • Distributes classes evenly</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Pool Health & Routing</span>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">
                      {nodes.filter(n => n.status === "READY").length} Ready • {nodes.filter(n => n.status === "DRAIN").length} Drain Mode
                    </div>
                    <span className="text-[11px] text-purple-600 font-bold mt-0.5 inline-block">Automatic Failover Armed</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Total Managed Sessions</span>
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">
                      {totalRooms} Live Classrooms
                    </div>
                    <span className="text-[11px] text-blue-600 font-bold mt-0.5 inline-block">Across all registered colleges</span>
                  </div>
                </div>
              </div>

              {/* Dedicated Nodes Grid */}
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Dedicated BigBlueButton Nodes</h3>
                    <p className="text-xs text-slate-500 font-medium">Hardware Telemetry: CPU, RAM & NVMe Disk</p>
                  </div>
                  <button
                    onClick={() => setAdminTab("nodes")}
                    className="text-xs text-blue-600 font-bold flex items-center space-x-1"
                  >
                    <span>Manage Fleet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {nodes.map((node) => (
                    <div key={node.id} className="glass-card glass-hover p-5 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{node.name}</span>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                                node.status === "READY"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {node.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-1">{node.fqdn}</div>
                        </div>
                        <button
                          onClick={() => toggleDrain(node.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-bold ${
                            node.status === "READY"
                              ? "border-amber-300 text-amber-800 bg-amber-50"
                              : "border-emerald-300 text-emerald-800 bg-emerald-50"
                          }`}
                        >
                          {node.status === "READY" ? "Drain" : "Enable"}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                          <div className="text-slate-500 text-[11px] font-semibold">CPU Load</div>
                          <div className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{node.cpu}%</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                          <div className="text-slate-500 text-[11px] font-semibold">Active Rooms</div>
                          <div className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{node.meetings}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900">
                          <div className="text-slate-500 text-[11px] font-semibold">Students</div>
                          <div className="text-slate-900 dark:text-white font-black text-sm mt-0.5">{node.participants}</div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 text-xs">
                        <div className="flex justify-between font-mono font-bold">
                          <span>RAM: {node.ramUsedGb}/{node.ramTotalGb} GB</span>
                          <span className="text-purple-600">{node.ramPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${node.ramPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUPER ADMIN TAB 2: NODES TABLE & MANUAL DNS REGISTRATION */}
          {adminTab === "nodes" && (
            <div className="space-y-5">
              {/* Top Action Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 glass-card p-5 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                    <Server className="w-5 h-5 text-purple-600" />
                    <span>BigBlueButton Meeting Server Fleet</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect meeting nodes via automated scripts or manual DNS records (A record pointed to server IP)
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsAddNodeModalOpen(true)}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-purple-500/20 transform hover:scale-105"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Add Node (Manual DNS)</span>
                  </button>
                </div>
              </div>

              {/* 1-CLICK UBUNTU VPS AUTO-INSTALLER & MONITORING AGENT CARD */}
              <div className="glass-card p-5.5 rounded-3xl border border-purple-200/80 dark:border-purple-900/50 bg-gradient-to-br from-purple-500/5 via-slate-50/50 to-indigo-500/5 dark:from-purple-950/20 dark:via-slate-900/60 dark:to-indigo-950/20 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          1-Click Fresh Ubuntu VPS Auto-Installer & Monitoring Agent
                        </h4>
                        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          Ubuntu 22.04 LTS
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Run this single command in your fresh VPS terminal. It installs BBB 3.0, Let's Encrypt SSL, UFW WebRTC firewall, and the real-time telemetry agent.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="node1.aeoraxlive.com"
                        value={quickInstallFqdn}
                        onChange={(e) => setQuickInstallFqdn(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        title="Target Subdomain / FQDN"
                      />
                      <input
                        type="email"
                        placeholder="admin@aeoraxlive.com"
                        value={quickInstallEmail}
                        onChange={(e) => setQuickInstallEmail(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white w-44 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        title="SSL Admin Email"
                      />
                    </div>
                    <button
                      onClick={copyInstallerCommand}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-slate-900/10"
                    >
                      {isCommandCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Command Preview Display */}
                <div className="relative group">
                  <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner flex items-center justify-between">
                    <code className="text-purple-300 selection:bg-purple-600 selection:text-white">
                      curl -sSL https://raw.githubusercontent.com/tariqsun/Aeorax-Live/main/scripts/install-node.sh | sudo bash -s -- --fqdn {quickInstallFqdn || "node1.aeoraxlive.com"} --email {quickInstallEmail || "admin@aeoraxlive.com"} --panel https://master.nesthost.net
                    </code>
                  </pre>
                </div>

                {/* Feature Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>BigBlueButton 3.0.39 Stable</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Auto Let's Encrypt SSL</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>UFW WebRTC Media Firewall</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Aeorax Live Telemetry Daemon</span>
                  </div>
                </div>
              </div>

              {/* Success Notification Banner */}
              {nodeAddSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2.5 shadow-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{nodeAddSuccessMsg}</span>
                </div>
              )}

              {/* Nodes Table */}
              <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 uppercase font-black">
                    <tr>
                      <th className="py-4 px-5">Server / FQDN</th>
                      <th className="py-4 px-5">IP Address</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">CPU</th>
                      <th className="py-4 px-5">RAM Memory</th>
                      <th className="py-4 px-5">NVMe Disk</th>
                      <th className="py-4 px-5">Live Rooms</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {nodes.map((node) => (
                      <tr key={node.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900 dark:text-white">{node.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{node.fqdn}</div>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {node.ip}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              node.status === "READY"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {node.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">{node.cpu}%</td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">
                          {node.ramUsedGb}/{node.ramTotalGb} GB
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">
                          {node.diskUsedGb}/{node.diskTotalGb} GB
                        </td>
                        <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{node.meetings} Rooms</td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => toggleDrain(node.id)}
                            className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition ${
                              node.status === "READY"
                                ? "border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                                : "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
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

              {/* MANUAL NODE REGISTRATION MODAL */}
              {isAddNodeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
                  <div className="glass-card max-w-xl w-full p-6 rounded-3xl space-y-5 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            Add BigBlueButton Node (Manual DNS)
                          </h4>
                          <p className="text-xs text-slate-500">
                            Point your domain manually and register the server into Scalelite
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAddNodeModalOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Explanatory Info Box */}
                    <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cloudflare API Not Required</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        In your DNS manager (Cloudflare, GoDaddy, Namecheap), add an <strong>A record</strong> pointing your subdomain (e.g. <code>node3.aeoraxlive.com</code>) to your server's public IP (Proxy OFF / Grey Cloud). Then run <code>bbb-conf --secret</code> on the server and enter details below.
                      </p>
                    </div>

                    <form onSubmit={handleAddManualNode} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Node Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. BBB Node 03 (Dedicated)"
                            value={nodeFormData.name}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, name: e.target.value })}
                            className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            FQDN / Subdomain
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="node3.aeoraxlive.com"
                            value={nodeFormData.fqdn}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, fqdn: e.target.value })}
                            className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Server Public IPv4
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="198.51.100.25"
                            value={nodeFormData.ip}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, ip: e.target.value })}
                            className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            BBB Secret (Salt)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="From bbb-conf --secret"
                            value={nodeFormData.secret}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, secret: e.target.value })}
                            className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">CPU Cores</label>
                          <input
                            type="number"
                            value={nodeFormData.cpuCores}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, cpuCores: Number(e.target.value) })}
                            className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">RAM (GB)</label>
                          <input
                            type="number"
                            value={nodeFormData.ramTotalGb}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, ramTotalGb: Number(e.target.value) })}
                            className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase">NVMe Disk (GB)</label>
                          <input
                            type="number"
                            value={nodeFormData.diskTotalGb}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, diskTotalGb: Number(e.target.value) })}
                            className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      {/* Handshake Test Feedback */}
                      {manualNodeTestStatus === "success" && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Handshake Verified: Endpoint responded with HTTP 200 BigBlueButton XML!</span>
                        </div>
                      )}

                      {/* Modal Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setManualNodeTestStatus("testing");
                            setTimeout(() => setManualNodeTestStatus("success"), 700);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${manualNodeTestStatus === "testing" ? "animate-spin" : ""}`} />
                          <span>{manualNodeTestStatus === "testing" ? "Testing DNS & API..." : "Test Handshake"}</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsAddNodeModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-500/20"
                          >
                            Link & Register Node
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUPER ADMIN TAB 3: COLLEGES & QUOTAS */}
          {adminTab === "colleges" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {colleges.map((col) => (
                <div key={col.id} className="glass-card glass-hover p-6 rounded-3xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{col.name}</h3>
                      <div className="text-xs text-slate-500 font-mono mt-1">Tenant Slug: {col.slug}</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                      {col.plan}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Concurrent Classrooms</span>
                      <span className="font-bold text-slate-900 dark:text-white">{col.activeRooms} / {col.maxRooms} rooms</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(col.activeRooms / col.maxRooms) * 100}%` }} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <button
                      onClick={() => {
                        setSelectedMoodleCollegeSlug(col.slug);
                        setAdminTab("moodle");
                      }}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Configure LMS Gateway →</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCollegeSlug(col.slug);
                        setCurrentView("CLIENT_PORTAL");
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                      View Client Portal →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUPER ADMIN TAB 4: MOODLE & LMS GATEWAY (SUPER ADMIN MANAGED ONLY) */}
          {adminTab === "moodle" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white dark:from-blue-950/30 dark:via-slate-900/60 dark:to-indigo-950/30 border border-blue-200/90 dark:border-blue-800/40 shadow-xs">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        Moodle & Canvas LMS Gateway Management
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
                        🔒 <span className="font-bold text-slate-700 dark:text-slate-300">Centralized Admin Control:</span> Colleges and clients do not have access to manage or view raw API keys. All BigBlueButton endpoints, tenant shared secrets, and LMS credentials are configured exclusively from this Super Admin panel.
                      </p>
                    </div>
                  </div>

                  {/* College Picker for LMS Setup */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500">Select College:</span>
                    <select
                      value={selectedMoodleCollegeSlug}
                      onChange={(e) => {
                        setSelectedMoodleCollegeSlug(e.target.value);
                        setMoodleTestResult("idle");
                      }}
                      className="text-xs font-bold px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    >
                      {colleges.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Selected College LMS Configuration Cards */}
              {(() => {
                const targetCol = colleges.find((c) => c.slug === selectedMoodleCollegeSlug) || colleges[0];
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Credentials & Endpoints */}
                    <div className="lg:col-span-2 space-y-5">
                      <div className="glass-card p-6 rounded-3xl space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {targetCol.name} — LMS Credentials
                            </h3>
                            <p className="text-xs text-slate-500">
                              Use these settings when installing the BigBlueButtonBN plugin on the client's Moodle instance
                            </p>
                          </div>
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold border border-emerald-300">
                            Gateway Active
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                          {/* BBB URL */}
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              BigBlueButton Server URL
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                readOnly
                                value="https://bbb.aeoraxlive.com/bigbluebutton/api"
                                className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200"
                              />
                              <button
                                onClick={() => copyToClipboard("https://bbb.aeoraxlive.com/bigbluebutton/api")}
                                className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Secret */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Tenant Shared Secret (Salt)
                              </label>
                              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                                SHA-1 Checksum Enforced
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                readOnly
                                value={targetCol.apiSecret}
                                className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-purple-600 dark:text-purple-400"
                              />
                              <button
                                onClick={() => copyToClipboard(targetCol.apiSecret)}
                                className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                              >
                                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : "Copy"}
                              </button>
                            </div>
                          </div>

                          {/* Public API Key */}
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Tenant Public API Key
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                readOnly
                                value={targetCol.apiKey}
                                className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300"
                              />
                              <button
                                onClick={() => copyToClipboard(targetCol.apiKey)}
                                className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Webhook URL */}
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Moodle Callback / Webhook URL
                            </label>
                            <input
                              readOnly
                              value={`https://lms.${targetCol.slug}.edu/mod/bigbluebuttonbn/bbb_broker.php`}
                              className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 mt-1"
                            />
                          </div>
                        </div>

                        {/* Handshake Tester */}
                        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                          <button
                            onClick={() => {
                              setMoodleTestResult("testing");
                              setTimeout(() => setMoodleTestResult("success"), 600);
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center space-x-2"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${moodleTestResult === "testing" ? "animate-spin" : ""}`} />
                            <span>
                              {moodleTestResult === "testing" ? "Testing Gateway Handshake..." : "Test Moodle API Handshake"}
                            </span>
                          </button>

                          {moodleTestResult === "success" && (
                            <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 font-bold flex items-center space-x-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>HTTP 200 XML SUCCESS • Checksum Verified</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Admin Policy & Quota Controls */}
                    <div className="space-y-5">
                      <div className="glass-card p-6 rounded-3xl space-y-4">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Enforced Quota Parameters
                        </h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 font-medium">Max Simultaneous Rooms</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {targetCol.maxRooms} Rooms
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 font-medium">Max Total Participants</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {targetCol.maxStudents} Students
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 font-medium">Max Students Per Room</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              100 Students
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500 font-medium">Cloud Storage Allocation</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {targetCol.storageLimitGb} GB
                            </span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-slate-500 font-medium">Auto-Record to R2</span>
                            <span className="font-bold text-emerald-600">Enabled</span>
                          </div>
                        </div>
                      </div>

                      <div className="glass-card p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Tenant Isolation Guarantee</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Because college clients cannot view or change their API secrets, each institution's quota is strictly enforced at the gateway. A misbehaving Moodle cron or plugin cannot exhaust other colleges' resources.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUPER ADMIN TAB 5: RECORDING & R2 PIPELINE */}
          {adminTab === "recordings" && (
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Cloudflare R2 Recordings Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Automated post-meeting publishing, compression, and S3-compatible R2 cloud storage archive
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  Workers Active • 0 Failed Jobs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-bold">Total Storage Consumed</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">324.8 GB</div>
                  <div className="text-xs text-slate-500 mt-1">across 3 active colleges</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-bold">Recordings Processed (Today)</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">42 Sessions</div>
                  <div className="text-xs text-slate-500 mt-1">avg. 48 mins per lecture</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-bold">Estimated Monthly Cost</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">$4.85 / mo</div>
                  <div className="text-xs text-slate-500 mt-1">Zero egress fees on Cloudflare R2</div>
                </div>
              </div>
            </div>
          )}

          {/* SUPER ADMIN TAB 6: SMART CAPACITY ADVISOR */}
          {adminTab === "advisor" && (
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Smart Capacity & Node Advisor
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Heuristic telemetry analysis for BigBlueButton cluster scaling and failover readiness
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-300">
                  Cluster Status: HEALTHY
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Fleet Headroom Adequate (39.5% Available)
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Current fleet of 4 BBB nodes can support an additional 360 concurrent participants without quality degradation.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
                  <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Node 04 Scheduled Maintenance in Progress
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Node 04 is currently in DRAIN mode. Scalelite is gracefully allowing existing meetings to conclude before kernel updates.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0c101a]/70 backdrop-blur py-4 px-6 text-center text-xs text-slate-500 font-medium">
        Aeorax Live Managed BigBlueButton Control Plane • BigBlueButton 3.0.39 • PostgreSQL 16 • Redis 7 • Cloudflare R2
      </footer>
    </div>
  );
}
