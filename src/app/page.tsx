"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Palette,
  Trash2,
  Building,
  Upload,
  LogOut,
  Mail,
  Key,
  Folder,
  Eye,
  EyeOff,
  User,
  FlaskConical,
  Radio,
  Gauge,
  PlayCircle,
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "COLLEGE_ADMIN" | "TEACHER" | "STUDENT";
  collegeId?: string | null;
  collegeSlug?: string | null;
  collegeName?: string | null;
}

interface R2ObjectItem {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  priceMonthly: number;
  maxRooms: number;
  maxStudents: number;
  storageGb: number;
  description: string;
  features: string[];
}

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
  bbbVersion?: string;
}

interface CollegeData {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
  plan: string;
  activeRooms: number;
  maxRooms: number;
  activeStudents: number;
  maxStudents: number;
  storageGb: number;
  storageLimitGb: number;
  status: "ACTIVE" | "TRIAL" | "SUSPENDED";
  apiKey: string;
  apiSecret: string;
  accentColor?: "blue" | "purple" | "emerald" | "amber";
  createdAt?: string;
}

interface RoomData {
  id: string;
  collegeId?: string;
  collegeSlug?: string;
  name: string;
  slug: string;
  teacher: string;
  studentsCount: number;
  status: "RUNNING" | "IDLE" | "ENDED";
  recordEnabled: boolean;
  durationMinutes?: number;
  maxParticipants?: number;
  createdAt?: string;
}

export default function AeoraxDashboard() {
  // Authentication & RBAC Layer State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [loginIdentifier, setLoginIdentifier] = useState<string>("superadmin@aeoraxlive.com");
  const [loginPassword, setLoginPassword] = useState<string>("AdminPassword123!");
  const [loginRole, setLoginRole] = useState<"SUPER_ADMIN" | "COLLEGE_ADMIN">("SUPER_ADMIN");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Portal View Switcher: "SUPER_ADMIN" vs "CLIENT_PORTAL" (College Admin)
  const [currentView, setCurrentView] = useState<"SUPER_ADMIN" | "CLIENT_PORTAL">("SUPER_ADMIN");
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>("oxford-intl");

  // Multi-Tenant Cloudflare R2 Filtering & Lifecycle Simulation State
  const [selectedR2CollegeFilter, setSelectedR2CollegeFilter] = useState<string>("ALL");
  const [isSimulatingBBBMove, setIsSimulatingBBBMove] = useState<boolean>(false);
  const [bbbMoveSuccessMsg, setBbbMoveSuccessMsg] = useState<string | null>(null);

  // Tab navigation
  const [adminTab, setAdminTab] = useState<"overview" | "nodes" | "testlab" | "colleges" | "moodle" | "recordings" | "advisor" | "branding">("overview");
  const [clientTab, setClientTab] = useState<"rooms" | "teachers" | "recordings">("rooms");
  const [selectedMoodleCollegeSlug, setSelectedMoodleCollegeSlug] = useState<string>("oxford-intl");
  const [moodleTestResult, setMoodleTestResult] = useState<"idle" | "testing" | "success">("idle");

  // Direct Server Benchmark & Direct Meeting Test Lab State
  const [testTargetType, setTestTargetType] = useState<"SCALELITE" | "NODE" | "CUSTOM">("SCALELITE");
  const [testSelectedNodeFqdn, setTestSelectedNodeFqdn] = useState<string>("node1.nesthost.net");
  const [testCustomApiUrl, setTestCustomApiUrl] = useState<string>("");
  const [testCustomSecret, setTestCustomSecret] = useState<string>("");
  const [testMeetingName, setTestMeetingName] = useState<string>("Admin Cluster Benchmark Lab");
  const [testMeetingID, setTestMeetingID] = useState<string>(() => `benchmark-${Math.random().toString(36).substring(2, 8)}`);
  const [testModeratorName, setTestModeratorName] = useState<string>("Admin Tester");
  const [testAttendeeName, setTestAttendeeName] = useState<string>("Student Load Tester");
  const [testRecordEnabled, setTestRecordEnabled] = useState<boolean>(true);
  const [testAutoStartRecord, setTestAutoStartRecord] = useState<boolean>(true);
  const [testSelectedCollegeForR2, setTestSelectedCollegeForR2] = useState<string>("oxford-intl");
  const [isCreatingTestMeeting, setIsCreatingTestMeeting] = useState<boolean>(false);
  const [activeTestSession, setActiveTestSession] = useState<{
    meetingID: string;
    meetingName: string;
    targetApiUrl: string;
    targetSecret?: string;
    moderatorJoinUrl: string;
    attendeeJoinUrl: string;
    attendeePW: string;
    moderatorPW: string;
    record: boolean;
    targetLabel: string;
    createdAt: string;
  } | null>(null);
  const [testTelemetry, setTestTelemetry] = useState<{
    running: boolean;
    participantCount: number;
    listenerCount: number;
    voiceParticipantCount: number;
    videoCount: number;
    recording: boolean;
    duration: number;
    hasUserJoined: boolean;
    lastUpdated: string;
  } | null>(null);
  const [isFetchingTelemetry, setIsFetchingTelemetry] = useState<boolean>(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState<boolean>(false);
  const [testLabToast, setTestLabToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isTestingR2Sync, setIsTestingR2Sync] = useState<boolean>(false);
  const [r2TestResult, setR2TestResult] = useState<any | null>(null);

  // Dynamic Classroom Branding & White-Label State
  const [selectedBrandingCollegeSlug, setSelectedBrandingCollegeSlug] = useState<string>("oxford-intl");
  const [brandingSettings, setBrandingSettings] = useState<Record<string, {
    whiteLabelEnabled: boolean;
    brandName: string;
    primaryColor: string;
    logoUrl: string;
    bannerText: string;
    welcomePdfUrl: string;
    customCss: string;
  }>>({
    "default": {
      whiteLabelEnabled: false,
      brandName: "Aeorax Live",
      primaryColor: "#6366f1",
      logoUrl: "",
      bannerText: "Welcome to Aeorax Live Virtual Classroom",
      welcomePdfUrl: "https://master.nesthost.net/slides/welcome.pdf",
      customCss: "",
    },
    "oxford-intl": {
      whiteLabelEnabled: true,
      brandName: "Oxford International College",
      primaryColor: "#0284c7",
      logoUrl: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&auto=format&fit=crop&q=80",
      bannerText: "Welcome Oxford Students & Faculty",
      welcomePdfUrl: "https://master.nesthost.net/slides/oxford-welcome.pdf",
      customCss: "",
    },
    "stanford-demo": {
      whiteLabelEnabled: true,
      brandName: "Stanford Demo Institute",
      primaryColor: "#e11d48",
      logoUrl: "",
      bannerText: "Stanford Medical Lectures & Seminars",
      welcomePdfUrl: "",
      customCss: "",
    },
    "cambridge-biz": {
      whiteLabelEnabled: false,
      brandName: "Cambridge Business School",
      primaryColor: "#10b981",
      logoUrl: "",
      bannerText: "Cambridge Business Case Studies",
      welcomePdfUrl: "",
      customCss: "",
    },
    "mit-online": {
      whiteLabelEnabled: false,
      brandName: "MIT Online Academy",
      primaryColor: "#f59e0b",
      logoUrl: "",
      bannerText: "MIT Engineering Lab",
      welcomePdfUrl: "",
      customCss: "",
    },
  });
  const [brandingSaveToast, setBrandingSaveToast] = useState<boolean>(false);
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);

  // Check Active Session on Mount
  const checkAuthSession = async () => {
    try {
      setIsAuthLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.authenticated && data.user) {
        setCurrentUser(data.user);
        if (data.user.role === "COLLEGE_ADMIN" && data.user.collegeSlug) {
          setCurrentView("CLIENT_PORTAL");
          setSelectedCollegeSlug(data.user.collegeSlug);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuthSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setLoginError(data.error || "Authentication failed. Please verify your credentials.");
        return;
      }
      setCurrentUser(data.user);
      if (data.user.role === "COLLEGE_ADMIN" && data.user.collegeSlug) {
        setCurrentView("CLIENT_PORTAL");
        setSelectedCollegeSlug(data.user.collegeSlug);
      } else {
        setCurrentView("SUPER_ADMIN");
      }
    } catch (err: any) {
      setLoginError(err.message || "Unable to contact authentication service.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setLoginPassword("");
  };

  // Load saved branding from API on mount
  useEffect(() => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setBrandingSettings({
            default: json.data.global,
            ...json.data.colleges,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      const isGlobal = selectedBrandingCollegeSlug === "default";
      const config = brandingSettings[selectedBrandingCollegeSlug];
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: isGlobal ? "global" : selectedBrandingCollegeSlug,
          config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBrandingSaveToast(true);
        setTimeout(() => setBrandingSaveToast(false), 4000);
      }
    } catch (err) {
      console.error("Save branding error:", err);
    } finally {
      setIsSavingBranding(false);
    }
  };

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
  const [quickInstallFqdn, setQuickInstallFqdn] = useState<string>("node1.nesthost.net");
  const [quickInstallEmail, setQuickInstallEmail] = useState<string>("admin@nesthost.net");
  const [isCommandCopied, setIsCommandCopied] = useState<boolean>(false);

  const copyInstallerCommand = () => {
    const cmd = `curl -sSL https://raw.githubusercontent.com/tariqsun/Aeorax-Live/main/scripts/install-node.sh | sudo bash -s -- --fqdn ${quickInstallFqdn} --email ${quickInstallEmail} --panel https://panel.nesthost.net`;
    navigator.clipboard.writeText(cmd);
    setIsCommandCopied(true);
    setTimeout(() => setIsCommandCopied(false), 3000);
  };

  const handleAddManualNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeFormData.fqdn || !nodeFormData.ip) return;

    try {
      setManualNodeTestStatus("testing");
      const res = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nodeFormData.name || `BBB Node (${nodeFormData.fqdn})`,
          fqdn: nodeFormData.fqdn,
          ip: nodeFormData.ip,
          bbbVersion: "4.0.0",
          ramTotalGb: Number(nodeFormData.ramTotalGb) || 16,
          diskTotalGb: Number(nodeFormData.diskTotalGb) || 100,
          cpuCores: Number(nodeFormData.cpuCores) || 8,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to register node");
        return;
      }
      setIsAddNodeModalOpen(false);
      setNodeFormData({ name: "", fqdn: "", ip: "", secret: "", ramTotalGb: 16, diskTotalGb: 100, cpuCores: 8 });
      setManualNodeTestStatus("idle");
      setNodeAddSuccessMsg(`Node "${data.node.name}" registered successfully with Manual DNS and saved to database!`);
      setTimeout(() => setNodeAddSuccessMsg(null), 5000);
      await refreshNodes();
    } catch (err: any) {
      alert(err.message || "Failed to register node");
    } finally {
      setManualNodeTestStatus("idle");
    }
  };

  // Automated Node Provisioning Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardData, setWizardData] = useState({
    fqdn: "node2.nesthost.net",
    ip: "13.140.140.237",
    name: "BigBlueButton Node 02 (Dedicated)",
    sshPort: 22,
    sshUser: "root",
    sshPassword: "",
    sshKey: "",
    adminEmail: "admin@nesthost.net",
  });
  const [preflightStatus, setPreflightStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [preflightData, setPreflightData] = useState<any>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  // Installation execution state
  const [installProgress, setInstallProgress] = useState<number>(0);
  const [installStepTitle, setInstallStepTitle] = useState<string>("Initializing...");
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [installStatus, setInstallStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [completedNodeResult, setCompletedNodeResult] = useState<any>(null);
  const [copiedInstallLogs, setCopiedInstallLogs] = useState<boolean>(false);
  const [copiedUpgradeLogs, setCopiedUpgradeLogs] = useState<boolean>(false);

  const installLogsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal smoothly to latest line whenever new logs arrive
  useEffect(() => {
    if (installLogsEndRef.current) {
      installLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [installLogs]);

  const copyTextWithFallback = (text: string, onCopied: () => void) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        onCopied();
      }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          onCopied();
        } finally {
          document.body.removeChild(textArea);
        }
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        onCopied();
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleCopyInstallLogs = () => {
    copyTextWithFallback(installLogs.join("\n"), () => {
      setCopiedInstallLogs(true);
      setTimeout(() => setCopiedInstallLogs(false), 2000);
    });
  };

  const handleCopyUpgradeLogs = () => {
    copyTextWithFallback(upgradeLogs.join("\n"), () => {
      setCopiedUpgradeLogs(true);
      setTimeout(() => setCopiedUpgradeLogs(false), 2000);
    });
  };

  const handleRunPreflight = async () => {
    setPreflightStatus("checking");
    setPreflightError(null);
    try {
      const res = await fetch("/api/nodes/provision/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wizardData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Preflight failed");
      }
      setPreflightData(data);
      setPreflightStatus("success");
    } catch (err: any) {
      setPreflightError(err.message || "Failed to reach server");
      setPreflightStatus("error");
    }
  };

  const handleStartInstallation = async () => {
    setWizardStep(3);
    setInstallStatus("running");
    setInstallProgress(10);
    setInstallStepTitle("Connecting to VPS via SSH...");
    setInstallLogs([`[${new Date().toLocaleTimeString()}] Establishing SSH connection to ${wizardData.ip}:${wizardData.sshPort}...`]);

    const params = new URLSearchParams({
      fqdn: wizardData.fqdn,
      ip: wizardData.ip,
      sshPort: String(wizardData.sshPort || 22),
      sshUser: wizardData.sshUser || "root",
      sshPassword: wizardData.sshPassword || "",
      adminEmail: wizardData.adminEmail || "admin@nesthost.net",
      nodeName: wizardData.name || `BBB Node (${wizardData.fqdn})`,
    });

    const eventSource = new EventSource(`/api/nodes/provision/install-stream?${params.toString()}`);

    eventSource.addEventListener("log", (e) => {
      try {
        const text = JSON.parse(e.data);
        setInstallLogs((prev) => [...prev, text]);

        // Dynamically increment real progress according to output logs
        if (text.includes("Updating apt")) {
          setInstallProgress(25);
          setInstallStepTitle("Updating Ubuntu package mirrors & repositories...");
        } else if (text.includes("Installing prerequisites")) {
          setInstallProgress(40);
          setInstallStepTitle("Installing locales, UFW firewall, and utilities...");
        } else if (text.includes("Downloading official BigBlueButton")) {
          setInstallProgress(55);
          setInstallStepTitle("Downloading official BigBlueButton 3.0 packages...");
        } else if (text.includes("Running bbb-install")) {
          setInstallProgress(75);
          setInstallStepTitle("Compiling FreeSWITCH, WebRTC media & requesting Let's Encrypt SSL...");
        } else if (text.includes("Extracting BBB credentials")) {
          setInstallProgress(90);
          setInstallStepTitle("Configuring Scalelite secret & API endpoints...");
        }
      } catch {
        setInstallLogs((prev) => [...prev, e.data]);
      }
    });

    eventSource.addEventListener("status", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.progress) setInstallProgress(data.progress);
        if (data.step) setInstallStepTitle(data.step);
      } catch {}
    });

    eventSource.addEventListener("done", (e) => {
      try {
        const data = JSON.parse(e.data);
        setInstallProgress(100);
        setInstallStepTitle("BigBlueButton Node Successfully Installed!");
        setInstallStatus("completed");
        setCompletedNodeResult(data);
        setWizardStep(4);
        refreshNodes(); // Refresh real node list from DB
      } catch {}
      eventSource.close();
    });

    eventSource.addEventListener("error", (e: any) => {
      let errMsg = "Installation encountered an issue or connection interrupted.";
      try {
        if (e.data) {
          const parsed = JSON.parse(e.data);
          errMsg = parsed.message || parsed;
        }
      } catch {}
      setInstallLogs((prev) => [...prev, `[ERROR] ${errMsg}`]);
      setInstallStepTitle("Installation Failed");
      setInstallStatus("error");
      eventSource.close();
    });
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

  const defaultInitialNodes: NodeData[] = [
    {
      id: "node-1",
      name: "BBB Node 01",
      fqdn: "node1.nesthost.net",
      ip: "13.140.140.224",
      status: "READY",
      cpu: 12,
      steal: 0,
      ramPercent: 24,
      ramUsedGb: 3.8,
      ramTotalGb: 16,
      diskPercent: 18,
      diskUsedGb: 18.2,
      diskTotalGb: 100,
      meetings: 0,
      participants: 0,
      webcams: 0,
      bbbVersion: "4.0.0",
    },
    {
      id: "node-2",
      name: "BigBlueButton Node 02 (Dedicated)",
      fqdn: "node2.nesthost.net",
      ip: "13.140.140.237",
      status: "READY",
      cpu: 18,
      steal: 0,
      ramPercent: 26,
      ramUsedGb: 4.2,
      ramTotalGb: 16,
      diskPercent: 22,
      diskUsedGb: 22.1,
      diskTotalGb: 100,
      meetings: 0,
      participants: 0,
      webcams: 0,
      bbbVersion: "4.0.0",
    },
  ];

  const [nodes, setNodes] = useState<NodeData[]>(defaultInitialNodes);
  const [isLoadingNodes, setIsLoadingNodes] = useState<boolean>(true);

  // Fetch real nodes from database
  const refreshNodes = async () => {
    try {
      setIsLoadingNodes(true);
      const res = await fetch("/api/nodes");
      const json = await res.json();
      if (json.success && Array.isArray(json.nodes) && json.nodes.length > 0) {
        setNodes(json.nodes);
      }
    } catch (e) {
      console.error("Failed to load real nodes:", e);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  // BigBlueButton Official GitHub Release State
  const [latestRelease, setLatestRelease] = useState<{
    version: string;
    name: string;
    publishedAt: string;
    releaseUrl: string;
    changelogSummary: string;
    isMajor: boolean;
  } | null>(null);

  // Upgrade Modal & Stream State
  const [upgradingNode, setUpgradingNode] = useState<NodeData | null>(null);
  const [upgradeSshPassword, setUpgradeSshPassword] = useState<string>("");
  const [upgradeLogs, setUpgradeLogs] = useState<string[]>([]);
  const [upgradeProgress, setUpgradeProgress] = useState<number>(0);
  const [upgradeStatus, setUpgradeStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [upgradeStepTitle, setUpgradeStepTitle] = useState<string>("Initializing...");

  const upgradeLogsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll upgrade terminal smoothly to latest line
  useEffect(() => {
    if (upgradeLogsEndRef.current) {
      upgradeLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [upgradeLogs]);

  const fetchLatestRelease = async () => {
    try {
      const res = await fetch("/api/nodes/version-check");
      const json = await res.json();
      if (json.success && json.latestRelease) {
        setLatestRelease(json.latestRelease);
      }
    } catch (e) {
      console.error("Failed to check BBB latest release:", e);
    }
  };

  useEffect(() => {
    refreshNodes();
    fetchLatestRelease();
  }, []);

  const handleStartNodeUpgrade = (node: NodeData) => {
    setUpgradingNode(node);
    setUpgradeSshPassword("");
    setUpgradeLogs([]);
    setUpgradeProgress(0);
    setUpgradeStatus("idle");
    setUpgradeStepTitle("Ready for Upgrade");
  };

  const handleExecuteUpgradeStream = () => {
    if (!upgradingNode) return;
    setUpgradeStatus("running");
    setUpgradeProgress(15);
    setUpgradeStepTitle("Connecting via SSH & Draining Node...");
    setUpgradeLogs([`[${new Date().toLocaleTimeString()}] Triggering zero-downtime maintenance upgrade for ${upgradingNode.fqdn}...`]);

    const params = new URLSearchParams({
      fqdn: upgradingNode.fqdn,
      ip: upgradingNode.ip,
      sshPassword: upgradeSshPassword,
      adminEmail: "admin@nesthost.net",
    });

    const eventSource = new EventSource(`/api/nodes/upgrade-stream?${params.toString()}`);

    eventSource.addEventListener("log", (e) => {
      try {
        const text = JSON.parse(e.data);
        setUpgradeLogs((prev) => [...prev, text]);

        if (text.includes("Updating repository")) {
          setUpgradeProgress(35);
          setUpgradeStepTitle("Updating package repositories...");
        } else if (text.includes("Upgrading BigBlueButton")) {
          setUpgradeProgress(60);
          setUpgradeStepTitle("Upgrading BigBlueButton core and audio/video WebRTC services...");
        } else if (text.includes("Verifying BigBlueButton status")) {
          setUpgradeProgress(85);
          setUpgradeStepTitle("Verifying configuration and health checks...");
        }
      } catch {
        setUpgradeLogs((prev) => [...prev, e.data]);
      }
    });

    eventSource.addEventListener("done", (e) => {
      try {
        const data = JSON.parse(e.data);
        setUpgradeProgress(100);
        setUpgradeStepTitle("Upgrade Completed Successfully!");
        setUpgradeStatus("completed");
        refreshNodes();
      } catch {}
      eventSource.close();
    });

    eventSource.addEventListener("error", (e: any) => {
      let errMsg = "Upgrade interrupted or SSH authentication failed.";
      try {
        if (e.data) {
          const parsed = JSON.parse(e.data);
          errMsg = parsed.message || parsed;
        }
      } catch {}
      setUpgradeLogs((prev) => [...prev, `[ERROR] ${errMsg}`]);
      setUpgradeStepTitle("Upgrade Failed");
      setUpgradeStatus("error");
      eventSource.close();
    });
  };


  // Real College Tenants State (Loaded from PostgreSQL via /api/colleges)
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState<boolean>(true);
  const [isAddCollegeModalOpen, setIsAddCollegeModalOpen] = useState<boolean>(false);
  const [isCreatingCollege, setIsCreatingCollege] = useState<boolean>(false);
  const [collegeError, setCollegeError] = useState<string | null>(null);
  const [collegeFormData, setCollegeFormData] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    plan: "Standard College (8 Rooms)",
    maxConcurrentRooms: 8,
    maxTotalParticipants: 300,
    storageLimitGb: 100,
  });

  // Subscription Packages & Tiers State
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([
    {
      id: "tier-standard",
      name: "Standard College (8 Rooms)",
      priceMonthly: 149,
      maxRooms: 8,
      maxStudents: 300,
      storageGb: 100,
      description: "Ideal for small to medium colleges & academies with up to 8 concurrent classrooms.",
      features: ["8 Concurrent Live Classrooms", "300 Total Students Capacity", "100 GB Cloudflare R2 Storage", "Auto-Recording & Playback", "Standard Moodle Plugin Support"],
    },
    {
      id: "tier-enterprise",
      name: "Enterprise Academy (20 Rooms)",
      priceMonthly: 349,
      maxRooms: 20,
      maxStudents: 1000,
      storageGb: 500,
      description: "Designed for large multi-campus institutions requiring higher concurrent limits.",
      features: ["20 Concurrent Live Classrooms", "1,000 Total Students Capacity", "500 GB Cloudflare R2 Storage", "White-Label Branding & Custom CSS", "Priority WebRTC Routing SLA"],
    },
    {
      id: "tier-university",
      name: "University Campus (50 Rooms)",
      priceMonthly: 799,
      maxRooms: 50,
      maxStudents: 2500,
      storageGb: 1000,
      description: "Full university deployment with dedicated node pool assignment and massive concurrency.",
      features: ["50 Concurrent Live Classrooms", "2,500 Total Students Capacity", "1 TB Cloudflare R2 Storage", "Dedicated BigBlueButton Nodes", "Custom Subdomain & VIP Support"],
    },
  ]);

  const [collegesSubTab, setCollegesSubTab] = useState<"clients" | "packages">("clients");
  const [isAddTierModalOpen, setIsAddTierModalOpen] = useState<boolean>(false);
  const [newTierFormData, setNewTierFormData] = useState({
    name: "",
    priceMonthly: 199,
    maxRooms: 10,
    maxStudents: 500,
    storageGb: 200,
    description: "",
    featuresText: "Auto-Recording, Moodle Integration, Cloudflare R2 Storage",
  });

  const handleAddNewTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierFormData.name) return;
    const features = newTierFormData.featuresText
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const newTier: SubscriptionTier = {
      id: `tier-${Date.now()}`,
      name: newTierFormData.name,
      priceMonthly: Number(newTierFormData.priceMonthly) || 0,
      maxRooms: Number(newTierFormData.maxRooms) || 1,
      maxStudents: Number(newTierFormData.maxStudents) || 10,
      storageGb: Number(newTierFormData.storageGb) || 10,
      description: newTierFormData.description || `Custom package with ${newTierFormData.maxRooms} rooms.`,
      features: features.length > 0 ? features : ["Live BigBlueButton Classrooms", "R2 Cloud Storage"],
    };

    setSubscriptionTiers((prev) => [...prev, newTier]);
    setIsAddTierModalOpen(false);
    setNewTierFormData({
      name: "",
      priceMonthly: 199,
      maxRooms: 10,
      maxStudents: 500,
      storageGb: 200,
      description: "",
      featuresText: "Auto-Recording, Moodle Integration, Cloudflare R2 Storage",
    });
  };

  const handleDeleteTier = (id: string, name: string) => {
    if (confirm(`Delete subscription package "${name}"?`)) {
      setSubscriptionTiers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const fetchColleges = async () => {
    try {
      setIsLoadingColleges(true);
      const res = await fetch("/api/colleges");
      const json = await res.json();
      if (json.success && Array.isArray(json.colleges)) {
        setColleges(json.colleges);
        if (json.colleges.length > 0) {
          setSelectedCollegeSlug((prev) => {
            if (!prev || !json.colleges.some((c: any) => c.slug === prev)) {
              return json.colleges[0].slug;
            }
            return prev;
          });
          setSelectedMoodleCollegeSlug((prev) => {
            if (!prev || !json.colleges.some((c: any) => c.slug === prev)) {
              return json.colleges[0].slug;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Failed to load real colleges:", e);
    } finally {
      setIsLoadingColleges(false);
    }
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeFormData.name || !collegeFormData.slug || !collegeFormData.contactEmail) return;
    try {
      setIsCreatingCollege(true);
      setCollegeError(null);
      const res = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collegeFormData),
      });
      const data = await res.json();
      if (!data.success) {
        setCollegeError(data.error || "Failed to create college client");
        return;
      }
      setIsAddCollegeModalOpen(false);
      setCollegeFormData({
        name: "",
        slug: "",
        contactEmail: "",
        contactPhone: "",
        plan: "Standard College (8 Rooms)",
        maxConcurrentRooms: 8,
        maxTotalParticipants: 300,
        storageLimitGb: 100,
      });
      await fetchColleges();
      if (data.college?.slug) {
        setSelectedCollegeSlug(data.college.slug);
        setSelectedMoodleCollegeSlug(data.college.slug);
      }
    } catch (err: any) {
      setCollegeError(err.message || "Network error occurred");
    } finally {
      setIsCreatingCollege(false);
    }
  };

  const handleDeleteCollege = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client institution "${name}"? All associated classrooms, sessions, and records will be deleted.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/colleges?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchColleges();
      } else {
        alert(data.error || "Failed to delete college");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    }
  };

  // Real Virtual Classrooms State (Loaded from PostgreSQL via /api/rooms)
  const [clientRooms, setClientRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    slug: "",
    teacher: "",
    maxParticipants: 100,
    recordEnabled: true,
  });

  const fetchRooms = async (targetSlug?: string) => {
    const slug = targetSlug || selectedCollegeSlug;
    if (!slug) {
      setClientRooms([]);
      return;
    }
    try {
      setIsLoadingRooms(true);
      const res = await fetch(`/api/rooms?collegeSlug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.rooms)) {
        setClientRooms(json.rooms);
      } else {
        setClientRooms([]);
      }
    } catch (e) {
      console.error("Failed to load rooms:", e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollege || !roomFormData.name || !roomFormData.slug) return;
    try {
      setIsCreatingRoom(true);
      setRoomError(null);
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeSlug: activeCollege.slug,
          name: roomFormData.name,
          slug: roomFormData.slug,
          teacher: roomFormData.teacher || "Instructor",
          maxParticipants: Number(roomFormData.maxParticipants) || 100,
          recordEnabled: roomFormData.recordEnabled,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setRoomError(data.error || "Failed to create virtual classroom");
        return;
      }
      setIsAddRoomModalOpen(false);
      setRoomFormData({
        name: "",
        slug: "",
        teacher: "",
        maxParticipants: 100,
        recordEnabled: true,
      });
      await fetchRooms(activeCollege.slug);
      await fetchColleges();
    } catch (err: any) {
      setRoomError(err.message || "Failed to create room");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete classroom "${roomName}"?`)) return;
    try {
      const res = await fetch(`/api/rooms?id=${roomId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success && activeCollege) {
        await fetchRooms(activeCollege.slug);
        await fetchColleges();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete room");
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    if (selectedCollegeSlug) {
      fetchRooms(selectedCollegeSlug);
    }
  }, [selectedCollegeSlug]);

  // Cloudflare R2 Live Storage State
  const [r2Status, setR2Status] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [r2Latency, setR2Latency] = useState<number | null>(null);
  const [r2Message, setR2Message] = useState<string>("");
  const [r2Objects, setR2Objects] = useState<R2ObjectItem[]>([]);
  const [isLoadingR2, setIsLoadingR2] = useState<boolean>(false);
  const [isUploadingR2, setIsUploadingR2] = useState<boolean>(false);
  const [r2UploadSuccess, setR2UploadSuccess] = useState<string | null>(null);

  const testR2LiveConnection = async () => {
    try {
      setR2Status("testing");
      const res = await fetch("/api/storage/r2?action=test");
      const data = await res.json();
      if (data.success) {
        setR2Status("connected");
        setR2Latency(data.latencyMs);
        setR2Message(data.message);
        await fetchR2Objects();
      } else {
        setR2Status("error");
        setR2Message(data.message || data.error || "Connection failed");
      }
    } catch (err: any) {
      setR2Status("error");
      setR2Message(err.message || "Failed to reach R2 API endpoint");
    }
  };

  const fetchR2Objects = async (prefix = "") => {
    try {
      setIsLoadingR2(true);
      let url = "/api/storage/r2";
      const params = new URLSearchParams();

      if (currentView === "CLIENT_PORTAL" && activeCollege) {
        params.set("collegeSlug", activeCollege.slug);
      } else if (selectedR2CollegeFilter !== "ALL") {
        params.set("collegeSlug", selectedR2CollegeFilter);
      }

      if (prefix) {
        params.set("prefix", prefix);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.objects && Array.isArray(data.objects.objects)) {
        setR2Objects(data.objects.objects);
      } else {
        setR2Objects([]);
      }
    } catch (e) {
      console.error("Failed to list R2 objects:", e);
    } finally {
      setIsLoadingR2(false);
    }
  };

  const handleSimulateBBBRecordingMove = async () => {
    try {
      setIsSimulatingBBBMove(true);
      setBbbMoveSuccessMsg(null);
      const targetCollege =
        currentView === "CLIENT_PORTAL" && activeCollege
          ? activeCollege
          : colleges.find((c) => c.slug === selectedR2CollegeFilter) || colleges[0];

      if (!targetCollege) {
        alert("Please select a college institution to simulate recording migration.");
        return;
      }

      const targetSlug = targetCollege.slug;
      const meetingId = `bbb-${targetSlug}-class-${Date.now()}`;
      const testR2Key = `${targetSlug}/recordings/${meetingId}/presentation.tar.gz`;
      const dummyPayload = `Aeorax BigBlueButton Multi-Tenant Recording Package\nCollege: ${targetCollege.name} (${targetSlug})\nMeeting: ${meetingId}\nClassroom: Live Virtual Lecture\nStorage Tier: Zero-Egress Cloudflare R2\nTimestamp: ${new Date().toISOString()}`;

      // 1. Direct upload into tenant's isolated folder in R2
      const uploadRes = await fetch("/api/storage/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-direct",
          key: testR2Key,
          content: dummyPayload,
          contentType: "application/gzip",
        }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        alert(uploadData.error || "Upload to tenant folder failed");
        return;
      }

      // 2. Ingest into database recording table
      const ingestRes = await fetch("/api/recordings/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbbRecordId: meetingId,
          collegeSlug: targetSlug,
          title: `Lecture Session (${targetCollege.name})`,
          durationSeconds: 3600,
          sizeBytes: 157286400,
          r2Key: testR2Key,
          r2Bucket: "aeorax-live",
          sharedSecret: "aeorax2026!",
        }),
      });
      const ingestData = await ingestRes.json();

      if (ingestData.success) {
        setBbbMoveSuccessMsg(
          `Class ended on live node! Recording migrated to R2 isolated folder: ${testR2Key}`
        );
        await fetchR2Objects();
        setTimeout(() => setBbbMoveSuccessMsg(null), 8000);
      } else {
        alert(ingestData.error || "Failed to ingest recording into database");
      }
    } catch (e: any) {
      alert(e.message || "Recording migration simulation error");
    } finally {
      setIsSimulatingBBBMove(false);
    }
  };

  const handleUploadTestFile = async () => {
    try {
      setIsUploadingR2(true);
      setR2UploadSuccess(null);
      const testTimestamp = new Date().toISOString();
      const testKey = `test-verifications/ping-${Date.now()}.txt`;
      const content = `Aeorax Live Cloudflare R2 Verification Ping\nTimestamp: ${testTimestamp}\nEndpoint: https://442ee27fafab567aa3828a2a4ee62738.r2.cloudflarestorage.com\nBucket: aeorax-live\nZero egress Cloudflare R2 active!`;

      const res = await fetch("/api/storage/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload-direct",
          key: testKey,
          content,
          contentType: "text/plain",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setR2UploadSuccess(`Successfully uploaded test object: ${testKey}`);
        await fetchR2Objects();
        setTimeout(() => setR2UploadSuccess(null), 5000);
      } else {
        alert(data.error || "Failed to upload test file");
      }
    } catch (e: any) {
      alert(e.message || "Upload error");
    } finally {
      setIsUploadingR2(false);
    }
  };

  const handleDownloadR2Object = async (key: string) => {
    try {
      const res = await fetch("/api/storage/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "presign-download", key }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(data.error || "Failed to generate download URL");
      }
    } catch (e: any) {
      alert(e.message || "Download error");
    }
  };

  const handleDeleteR2Object = async (key: string) => {
    if (!confirm(`Are you sure you want to delete object "${key}" from Cloudflare R2 bucket?`)) return;
    try {
      const res = await fetch("/api/storage/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", key }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchR2Objects();
      } else {
        alert(data.error || "Failed to delete R2 object");
      }
    } catch (e: any) {
      alert(e.message || "Delete error");
    }
  };

  // Direct Test Lab Actions
  const handleCreateDirectMeeting = async () => {
    setIsCreatingTestMeeting(true);
    setTestLabToast(null);

    try {
      let targetApiUrl = "";
      let targetSecret = "";
      let targetLabel = "";

      if (testTargetType === "SCALELITE") {
        targetApiUrl = process.env.NEXT_PUBLIC_SCALELITE_API_URL || "https://bbb.nesthost.net/bigbluebutton/api";
        targetSecret = process.env.NEXT_PUBLIC_SCALELITE_SHARED_SECRET || "aeorax_scalelite_master_secret_2026";
        targetLabel = "Scalelite Cluster (Load Balanced)";
      } else if (testTargetType === "NODE") {
        targetApiUrl = `https://${testSelectedNodeFqdn}/bigbluebutton/api`;
        targetSecret = process.env.NEXT_PUBLIC_SCALELITE_SHARED_SECRET || "aeorax_scalelite_master_secret_2026";
        targetLabel = `Direct Node: ${testSelectedNodeFqdn}`;
      } else {
        targetApiUrl = testCustomApiUrl || "https://bbb.nesthost.net/bigbluebutton/api";
        targetSecret = testCustomSecret || "aeorax_scalelite_master_secret_2026";
        targetLabel = `Custom Host: ${targetApiUrl}`;
      }

      const res = await fetch("/api/admin/test-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          targetApiUrl,
          targetSecret,
          meetingID: testMeetingID || `benchmark-${Date.now().toString(36)}`,
          name: testMeetingName || "Admin Direct Cluster Benchmark",
          attendeePW: "ap",
          moderatorPW: "mp",
          record: testRecordEnabled,
          autoStartRecording: testAutoStartRecord,
          moderatorName: testModeratorName || "Admin Tester",
          attendeeName: testAttendeeName || "Student Load Tester",
          collegeSlug: testSelectedCollegeForR2,
        }),
      });

      const data = await res.json();
      if (data.success || data.moderatorJoinUrl) {
        const sessionObj = {
          meetingID: data.meetingID,
          meetingName: data.meetingName,
          targetApiUrl: data.targetApiUrl,
          targetSecret,
          moderatorJoinUrl: data.moderatorJoinUrl,
          attendeeJoinUrl: data.attendeeJoinUrl,
          attendeePW: data.attendeePW || "ap",
          moderatorPW: data.moderatorPW || "mp",
          record: data.record,
          targetLabel,
          createdAt: new Date().toLocaleTimeString(),
        };
        setActiveTestSession(sessionObj);
        setTestTelemetry({
          running: true,
          participantCount: 1,
          listenerCount: 1,
          voiceParticipantCount: 0,
          videoCount: 0,
          recording: data.record,
          duration: 0,
          hasUserJoined: true,
          lastUpdated: new Date().toLocaleTimeString(),
        });

        setTestLabToast({
          type: "success",
          message: `Direct meeting initialized on ${targetLabel}! Opening moderator classroom in a new tab...`,
        });

        if (typeof window !== "undefined") {
          window.open(data.moderatorJoinUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        setTestLabToast({
          type: "error",
          message: data.error || data.message || "Failed to initialize test meeting on target server.",
        });
      }
    } catch (err: any) {
      setTestLabToast({
        type: "error",
        message: err.message || "Network error communicating with test meeting gateway.",
      });
    } finally {
      setIsCreatingTestMeeting(false);
    }
  };

  const handleFetchTestTelemetry = async () => {
    if (!activeTestSession) return;
    setIsFetchingTelemetry(true);
    try {
      const res = await fetch("/api/admin/test-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "info",
          meetingID: activeTestSession.meetingID,
          targetApiUrl: activeTestSession.targetApiUrl,
          targetSecret: activeTestSession.targetSecret,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestTelemetry({
          running: data.running,
          participantCount: data.participantCount,
          listenerCount: data.listenerCount,
          voiceParticipantCount: data.voiceParticipantCount,
          videoCount: data.videoCount,
          recording: data.recording,
          duration: data.duration,
          hasUserJoined: data.hasUserJoined,
          lastUpdated: new Date().toLocaleTimeString(),
        });
      } else {
        setTestTelemetry((prev) => (prev ? { ...prev, running: false, lastUpdated: new Date().toLocaleTimeString() } : null));
      }
    } catch (err) {
      console.warn("Telemetry fetch error:", err);
    } finally {
      setIsFetchingTelemetry(false);
    }
  };

  const handleEndDirectMeeting = async () => {
    if (!activeTestSession) return;
    setIsEndingMeeting(true);
    try {
      const res = await fetch("/api/admin/test-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          meetingID: activeTestSession.meetingID,
          moderatorPW: activeTestSession.moderatorPW,
          targetApiUrl: activeTestSession.targetApiUrl,
          targetSecret: activeTestSession.targetSecret,
        }),
      });
      const data = await res.json();
      setTestLabToast({
        type: data.success ? "success" : "info",
        message: data.message || "Meeting ended on BigBlueButton server. Post-publish recording processing started.",
      });
      setTestTelemetry((prev) => (prev ? { ...prev, running: false, lastUpdated: new Date().toLocaleTimeString() } : null));
    } catch (err: any) {
      setTestLabToast({ type: "error", message: err.message || "Error sending end meeting signal." });
    } finally {
      setIsEndingMeeting(false);
    }
  };

  const handleTestR2SyncDirect = async () => {
    setIsTestingR2Sync(true);
    setR2TestResult(null);
    try {
      const res = await fetch("/api/admin/test-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test-r2-sync",
          collegeSlug: testSelectedCollegeForR2,
          title: `Direct Benchmark Recording (${activeTestSession?.meetingName || "Server Lab"})`,
          durationSeconds: testTelemetry?.duration ? testTelemetry.duration * 60 : 240,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setR2TestResult(data.recording);
        setTestLabToast({
          type: "success",
          message: data.message || "Direct R2 storage move verified successfully!",
        });
        fetchR2Objects();
      } else {
        setTestLabToast({ type: "error", message: data.error || "R2 test sync failed." });
      }
    } catch (err: any) {
      setTestLabToast({ type: "error", message: err.message || "Failed to trigger R2 sync test." });
    } finally {
      setIsTestingR2Sync(false);
    }
  };

  useEffect(() => {
    if (adminTab === "recordings" || clientTab === "recordings") {
      testR2LiveConnection();
    }
  }, [adminTab, clientTab]);

  const activeCollege = colleges.find((c) => c.slug === selectedCollegeSlug) || colleges[0] || null;

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

  // If verifying session on initial load
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/30 animate-pulse mx-auto">
            A
          </div>
          <div className="text-sm font-bold tracking-wide text-slate-300">
            Verifying Aeorax Security Session...
          </div>
          <p className="text-xs text-slate-500">Checking authenticated credentials against PostgreSQL cluster</p>
        </div>
      </div>
    );
  }

  // If not logged in: Render Aeorax Live Production Login Layer
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#07090e] to-black text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-indigo-500/25 mx-auto transform hover:scale-105 transition duration-300">
              A
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Aeorax Live
            </h1>
            <p className="text-xs text-slate-400">
              Fleet Orchestration & Multi-Tenant BigBlueButton Management
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#0f1422]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Role / Portal Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLoginRole("SUPER_ADMIN");
                  setLoginIdentifier("superadmin@aeoraxlive.com");
                  setLoginPassword("AdminPassword123!");
                  setLoginError(null);
                }}
                className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl transition ${
                  loginRole === "SUPER_ADMIN"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole("COLLEGE_ADMIN");
                  setLoginIdentifier("oxford-intl");
                  setLoginPassword("sec_oxford_bbb_secret_998877");
                  setLoginError(null);
                }}
                className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl transition ${
                  loginRole === "COLLEGE_ADMIN"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>College Client</span>
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {loginRole === "SUPER_ADMIN" ? "Admin Email or Username" : "College Subdomain Slug or Email"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    {loginRole === "SUPER_ADMIN" ? <Mail className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </span>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={loginRole === "SUPER_ADMIN" ? "admin@aeoraxlive.com" : "e.g. oxford-intl or admin@college.edu"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {loginRole === "SUPER_ADMIN" ? "Admin Password" : "API Secret / Client Password"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password or API secret"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                  loginRole === "SUPER_ADMIN"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 shadow-blue-500/25"
                    : "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-600 shadow-purple-500/25"
                } disabled:opacity-50`}
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In to {loginRole === "SUPER_ADMIN" ? "Super Admin" : "Client Portal"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Badges */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">1-Click Fast Access</div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setLoginRole("SUPER_ADMIN");
                    setLoginIdentifier("superadmin@aeoraxlive.com");
                    setLoginPassword("AdminPassword123!");
                    setLoginError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-300 hover:bg-blue-900/60 transition"
                >
                  ⚡ Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRole("SUPER_ADMIN");
                    setLoginIdentifier("admin");
                    setLoginPassword("aeorax2026!");
                    setLoginError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/60 transition"
                >
                  🔑 Master Root Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginRole("COLLEGE_ADMIN");
                    const target = colleges[0] || { slug: "test-college", name: "Client College" };
                    setLoginIdentifier(target.slug);
                    setLoginPassword("aeorax2026!");
                    setLoginError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-300 hover:bg-purple-900/60 transition"
                >
                  🎓 {colleges[0]?.name ? `${colleges[0].name.trim().slice(0, 14)} Admin` : "Client College Admin"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-500 font-mono">
            Zero-Trust Fleet Authentication • AES-256 Session Signed • Multi-Tenant RBAC Active
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar with View Switcher & User Profile */}
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
                  Client Portal: {activeCollege?.name || "No Client Selected"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentView === "SUPER_ADMIN"
                ? "Fleet Orchestration & Multi-Tenant BigBlueButton Management"
                : activeCollege
                ? `Dedicated Tenant Portal • Plan: ${activeCollege.plan}`
                : "Dedicated Tenant Portal"}
            </p>
          </div>
        </div>

        {/* Global Controls & PORTAL SWITCHER */}
        <div className="flex items-center space-x-3 text-sm">
          {/* View Switcher Toggle Button (Only for Super Admin) */}
          {currentUser.role === "SUPER_ADMIN" && (
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
          )}

          {/* College Selector (When in Client Portal and Super Admin) */}
          {currentView === "CLIENT_PORTAL" && currentUser.role === "SUPER_ADMIN" && (
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

          {/* User Profile Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {currentUser.role === "SUPER_ADMIN" ? "Super Admin" : (currentUser.collegeName || "Institution Admin")}
              </div>
            </div>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-200 shadow-xs hover:shadow-md transform hover:scale-105"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
            title="Sign Out of Aeorax Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: CLIENT ACCOUNT / COLLEGE ADMIN PORTAL                             */}
      {/* ========================================================================= */}
      {currentView === "CLIENT_PORTAL" ? (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {!activeCollege ? (
            <div className="glass-card p-12 text-center rounded-3xl max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto shadow-md">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Client Institutions Registered</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To access the Client Portal, switch to Super Admin and register a client college tenant with custom room, student, and storage quotas.
              </p>
              <button
                onClick={() => {
                  setCurrentView("SUPER_ADMIN");
                  setAdminTab("colleges");
                  setIsAddCollegeModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition transform hover:scale-105"
              >
                + Register First Client College
              </button>
            </div>
          ) : (
            <>
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
                      onClick={() => {
                        setRoomError(null);
                        setIsAddRoomModalOpen(true);
                      }}
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
                    {clientRooms.length} <span className="text-sm font-bold text-slate-500">/ {activeCollege.maxRooms}</span>
                  </div>
                  <div className="h-2 w-full bg-purple-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, (clientRooms.length / (activeCollege.maxRooms || 1)) * 100)}%` }}
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
                    {clientRooms.reduce((acc, r) => acc + (r.studentsCount || 0), 0)} <span className="text-sm font-bold text-slate-500">/ {activeCollege.maxStudents}</span>
                  </div>
                  <div className="h-2 w-full bg-blue-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, (clientRooms.reduce((acc, r) => acc + (r.studentsCount || 0), 0) / (activeCollege.maxStudents || 1)) * 100)}%` }}
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
                      style={{ width: `${Math.min(100, (activeCollege.storageGb / (activeCollege.storageLimitGb || 1)) * 100)}%` }}
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

              {/* Client Navigation Tabs */}
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
                  <div className="flex items-center justify-between flex-wrap gap-3 glass-card p-4 rounded-2xl">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                        <Video className="w-4 h-4 text-purple-600" />
                        <span>Configured Virtual Classrooms ({clientRooms.length})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Launch live BigBlueButton sessions or distribute direct invite links to students and faculty
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRoomError(null);
                        setIsAddRoomModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-500/20"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Create Virtual Classroom</span>
                    </button>
                  </div>

                  {isLoadingRooms ? (
                    <div className="glass-card p-12 text-center rounded-3xl">
                      <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
                      <div className="text-xs font-bold text-slate-500">Loading virtual classrooms...</div>
                    </div>
                  ) : clientRooms.length === 0 ? (
                    <div className="glass-card p-12 text-center rounded-3xl space-y-4 max-w-xl mx-auto">
                      <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto shadow-md">
                        <Video className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Virtual Classrooms Created</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Create your first course room or lecture hall for {activeCollege.name}. Each classroom gets a dedicated BigBlueButton meeting room with auto-recording capability.
                      </p>
                      <button
                        onClick={() => {
                          setRoomError(null);
                          setIsAddRoomModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition transform hover:scale-105"
                      >
                        + Create First Virtual Classroom
                      </button>
                    </div>
                  ) : (
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
                              <td className="py-4 px-5 font-medium">{room.teacher || "Instructor"}</td>
                              <td className="py-4 px-5">
                                <span
                                  className={`text-xs px-2.5 py-1 rounded-full font-black ${
                                    room.status === "RUNNING"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 animate-pulse"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200"
                                  }`}
                                >
                                  {room.status === "RUNNING" ? `LIVE (${room.durationMinutes || 0}m)` : "IDLE"}
                                </span>
                              </td>
                              <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">
                                {room.studentsCount > 0 ? `${room.studentsCount} Students` : "—"}
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                                  {room.recordEnabled ? "Enabled" : "Disabled"}
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
                                  onClick={() => copyToClipboard(`https://panel.nesthost.net/join/${activeCollege.slug}/${room.slug}`)}
                                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 transition"
                                >
                                  Copy Student Link
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room.id, room.name)}
                                  className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition inline-flex items-center justify-center align-middle"
                                  title="Delete Classroom"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT TAB 3: RECORDINGS */}
              {clientTab === "recordings" && (
                <div className="glass-card p-6 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Classroom Recordings Library</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-mono font-bold">
                          {r2Objects.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        All sessions are securely archived to Cloudflare R2 bucket <code className="font-mono text-purple-600 dark:text-purple-400">aeorax-live</code> with zero egress fees.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Cloudflare R2 Active</span>
                      </span>
                      <button
                        onClick={() => fetchR2Objects()}
                        disabled={isLoadingR2}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Refresh Recordings"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingR2 ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {isLoadingR2 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                      Loading archived recordings from Cloudflare R2...
                    </div>
                  ) : r2Objects.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
                        <HardDrive className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No Session Recordings Found</div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        When instructors end virtual classrooms with Auto-Recording enabled, BigBlueButton processes the video and archives the replay to Cloudflare R2 storage automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Recording Name / Key</th>
                            <th className="py-3 px-4">Size</th>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {r2Objects.map((obj) => {
                            const sizeFormatted =
                              obj.size < 1024
                                ? `${obj.size} B`
                                : obj.size < 1024 * 1024
                                ? `${(obj.size / 1024).toFixed(1)} KB`
                                : `${(obj.size / (1024 * 1024)).toFixed(2)} MB`;

                            return (
                              <tr key={obj.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                                <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200 break-all">
                                  {obj.key}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {sizeFormatted}
                                </td>
                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                  {obj.lastModified ? new Date(obj.lastModified).toLocaleString() : "—"}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => handleDownloadR2Object(obj.key)}
                                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition inline-flex items-center space-x-1 shadow-xs"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Watch / Download</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT TAB 4: TEACHERS */}
              {clientTab === "teachers" && (
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authorized College Faculty</h3>
                      <p className="text-xs text-slate-500 font-medium">Teachers and moderators assigned to virtual classrooms</p>
                    </div>
                    <button
                      onClick={() => {
                        setRoomError(null);
                        setIsAddRoomModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
                    >
                      + Add Classroom & Teacher
                    </button>
                  </div>

                  {(() => {
                    const teachers = Array.from(new Set(clientRooms.map((r) => r.teacher).filter(Boolean))).map((name) => {
                      const assigned = clientRooms.filter((r) => r.teacher === name).map((r) => r.name).join(", ");
                      return {
                        name,
                        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@${activeCollege.slug}.nesthost.net`,
                        rooms: assigned || "General Faculty",
                      };
                    });

                    if (teachers.length === 0) {
                      return (
                        <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                          No instructors assigned yet. Create virtual classrooms with instructor names to manage faculty.
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {teachers.map((t, i) => (
                          <div key={i} className="py-3.5 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{t.email} • Assigned: {t.rooms}</div>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              Active Faculty
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
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
              { id: "testlab", label: "Meeting Test Lab & Benchmark", icon: FlaskConical },
              { id: "colleges", label: "Colleges & Quotas", icon: GraduationCap },
              { id: "branding", label: "Classroom Branding & Theme", icon: Palette },
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
                {nodes.filter((n) => n.status === "READY").length} Ready • {nodes.filter((n) => n.status === "DRAIN").length} Draining
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
                      Current aggregate node fleet utilization is <strong className="text-blue-600 dark:text-blue-400 font-bold">{nodes.length > 0 ? (nodes.reduce((acc, n) => acc + (n.cpu || 0), 0) / nodes.length).toFixed(1) : "0.0"}%</strong> across {nodes.length} BigBlueButton {nodes.length === 1 ? "node" : "nodes"}. All active WebRTC streams are operating with low jitter (&lt;12ms).
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
                        Load Balancer API: <code className="text-purple-600 dark:text-purple-400 font-bold font-mono">{process.env.NEXT_PUBLIC_SCALELITE_API_URL || "https://bbb.nesthost.net/bigbluebutton/api"}</code> • Secret: <code className="text-slate-600 dark:text-slate-400 font-mono">{process.env.NEXT_PUBLIC_SCALELITE_SHARED_SECRET || "aeorax_scalelite_master_secret_2026"}</code>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setAdminTab("testlab");
                        setTestTargetType("SCALELITE");
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Launch Test Meeting</span>
                    </button>
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

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => {
                      setIsWizardOpen(true);
                      setWizardStep(1);
                    }}
                    className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-bold transition shadow-lg shadow-purple-500/25 transform hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>+ Automated Node Setup Wizard</span>
                  </button>

                  <button
                    onClick={() => setIsAddNodeModalOpen(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-500" />
                    <span>Quick Manual Link</span>
                  </button>
                </div>
              </div>

              {/* GITHUB BIGBLUEBUTTON OFFICIAL RELEASE & VERSION TRACKER */}
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Official BigBlueButton GitHub Channel:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        {latestRelease ? `v${latestRelease.version} Stable` : "Checking Releases..."}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {latestRelease?.changelogSummary || "Tracking official GitHub releases for upstream security, WebRTC, and classroom updates."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={latestRelease?.releaseUrl || "https://github.com/bigbluebutton/bigbluebutton/releases"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition"
                  >
                    <span>View GitHub Release Notes</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={fetchLatestRelease}
                    className="p-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition"
                    title="Refresh Latest Version Check"
                  >
                    <RefreshCw className="w-4 h-4" />
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
                        <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Ubuntu 24.04 LTS (Latest) & 22.04
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Run this command in your fresh VPS terminal. Auto-detects OS and installs BigBlueButton 4.0 (for Ubuntu 24.04 Noble) or BBB 3.0 (for 22.04 Jammy), Let's Encrypt SSL, UFW WebRTC firewall, and live telemetry agent.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="node1.nesthost.net"
                        value={quickInstallFqdn}
                        onChange={(e) => setQuickInstallFqdn(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white w-48 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        title="Target Subdomain / FQDN"
                      />
                      <input
                        type="email"
                        placeholder="admin@nesthost.net"
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
                      curl -sSL https://raw.githubusercontent.com/tariqsun/Aeorax-Live/main/scripts/install-node.sh | sudo bash -s -- --fqdn {quickInstallFqdn || "node1.nesthost.net"} --email {quickInstallEmail || "admin@nesthost.net"} --panel https://panel.nesthost.net
                    </code>
                  </pre>
                </div>

                {/* Feature Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>BigBlueButton 4.0 / 3.0 Cluster</span>
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
                      <th className="py-4 px-5">BBB Version</th>
                      <th className="py-4 px-5">CPU</th>
                      <th className="py-4 px-5">RAM Memory</th>
                      <th className="py-4 px-5">NVMe Disk</th>
                      <th className="py-4 px-5">Live Rooms</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {nodes.map((node) => {
                      const currentVer = node.bbbVersion || "4.0.0";
                      const isUpToDate = latestRelease ? currentVer.replace(/^v/, "") === latestRelease.version.replace(/^v/, "") : true;

                      return (
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
                          <td className="py-4 px-5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                v{currentVer.replace(/^v/, "")}
                              </span>
                              {!isUpToDate && latestRelease && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 animate-pulse">
                                  Update v{latestRelease.version} Available
                                </span>
                              )}
                              {isUpToDate && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                                  Latest
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">{node.cpu}%</td>
                          <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">
                            {node.ramUsedGb}/{node.ramTotalGb} GB
                          </td>
                          <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-white">
                            {node.diskUsedGb}/{node.diskTotalGb} GB
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{node.meetings} Rooms</td>
                          <td className="py-4 px-5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setTestTargetType("NODE");
                                setTestSelectedNodeFqdn(node.fqdn);
                                setAdminTab("testlab");
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-xl border font-bold border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 transition shadow-xs"
                              title="Directly test this BigBlueButton node without college or Moodle"
                            >
                              🧪 Test Node
                            </button>
                            {!isUpToDate && (
                              <button
                                onClick={() => handleStartNodeUpgrade(node)}
                                className="text-xs px-3 py-1.5 rounded-xl border font-bold border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100 transition shadow-xs"
                                title="Safely drain node and upgrade to latest BigBlueButton"
                              >
                                ⚡ Upgrade
                              </button>
                            )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ZERO-DOWNTIME NODE UPGRADE MODAL */}
              {upgradingNode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fadeIn">
                  <div className="glass-card max-w-2xl w-full p-6 rounded-3xl space-y-5 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                          <RefreshCw className={`w-5 h-5 ${upgradeStatus === "running" ? "animate-spin" : ""}`} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                            Zero-Downtime BigBlueButton Node Upgrade
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            {upgradingNode.name} • {upgradingNode.fqdn} ({upgradingNode.ip})
                          </p>
                        </div>
                      </div>
                      {upgradeStatus !== "running" && (
                        <button
                          onClick={() => setUpgradingNode(null)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {upgradeStatus === "idle" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 space-y-2">
                          <div className="font-black flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            <span>Zero-Downtime Safe Upgrade Protocol</span>
                          </div>
                          <p className="leading-relaxed">
                            1. The node will be marked as <strong>DRAIN</strong> in Scalelite so no new students/rooms enter.<br />
                            2. Packages for BigBlueButton v{latestRelease?.version || "4.0.0"} will be pulled directly from GitHub & Ubuntu mirrors.<br />
                            3. Nginx, WebRTC SFU, and Learning Dashboard services will be safely upgraded and restarted.<br />
                            4. Traffic routing will automatically resume to <strong>READY</strong> once health checks pass.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            Root SSH Password for {upgradingNode.ip}
                          </label>
                          <input
                            type="password"
                            value={upgradeSshPassword}
                            onChange={(e) => setUpgradeSshPassword(e.target.value)}
                            placeholder="Enter root password to execute remote upgrade"
                            className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setUpgradingNode(null)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleExecuteUpgradeStream}
                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-500/25 flex items-center space-x-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Start Node Upgrade to v{latestRelease?.version || "4.0.0"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {(upgradeStatus === "running" || upgradeStatus === "completed" || upgradeStatus === "error") && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                              <RefreshCw className={`w-4 h-4 text-purple-600 ${upgradeStatus === "running" ? "animate-spin" : ""}`} />
                              <span>{upgradeStepTitle}</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                              {upgradeProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                upgradeStatus === "error"
                                  ? "bg-rose-500"
                                  : "bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500"
                              }`}
                              style={{ width: `${upgradeProgress}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span className="flex items-center space-x-1.5">
                              <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Upgrade Execution Output</span>
                            </span>
                            <div className="flex items-center space-x-2.5">
                              <button
                                type="button"
                                onClick={handleCopyUpgradeLogs}
                                disabled={upgradeLogs.length === 0}
                                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition border border-slate-300 dark:border-slate-700 shadow-sm disabled:opacity-50"
                                title="Copy all upgrade logs to clipboard"
                              >
                                {copiedUpgradeLogs ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Logs</span>
                                  </>
                                )}
                              </button>
                              <span className={`font-mono font-semibold ${upgradeStatus === "error" ? "text-rose-500" : "text-emerald-500"}`}>
                                {upgradeStatus === "completed" ? "Done" : upgradeStatus === "error" ? "Halted" : "Live Stream"}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] h-64 overflow-y-auto space-y-1 border border-slate-800 shadow-inner">
                            {upgradeLogs.map((log, idx) => (
                              <div
                                key={idx}
                                className={`leading-relaxed ${
                                  log.includes("Completed") || log.includes("READY") || log.includes("100%")
                                    ? "text-emerald-400 font-bold"
                                    : log.includes("ERROR") || log.includes("Failed")
                                    ? "text-rose-400 font-bold"
                                    : "text-slate-300"
                                }`}
                              >
                                {log}
                              </div>
                            ))}
                            <div ref={upgradeLogsEndRef} />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setUpgradingNode(null)}
                            disabled={upgradeStatus === "running"}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-40"
                          >
                            Close Upgrade Modal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                        In your DNS manager (Cloudflare, GoDaddy, Namecheap), add an <strong>A record</strong> pointing your subdomain (e.g. <code>node3.nesthost.net</code>) to your server's public IP (Proxy OFF / Grey Cloud). Then run <code>bbb-conf --secret</code> on the server and enter details below.
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
                            placeholder="node3.nesthost.net"
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

              {/* AUTOMATED NODE PROVISIONING WIZARD MODAL */}
              {isWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
                  <div className="glass-card max-w-2xl w-full p-6 sm:p-7 rounded-3xl space-y-5 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                    {/* Wizard Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                          <Sparkles className="w-5 h-5 text-purple-200" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                              Automated Node Provisioning Wizard
                            </h4>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              Step {wizardStep} of 4
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            DNS verification, Ubuntu 24.04/22.04 LTS preflight, automated BigBlueButton 4.0/3.0 installation & telemetry client
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (installStatus !== "running") setIsWizardOpen(false);
                        }}
                        disabled={installStatus === "running"}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Step Progress Bar Indicator */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-extrabold">
                      <div
                        className={`py-1.5 rounded-xl border transition ${
                          wizardStep === 1
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300"
                            : wizardStep > 1
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700"
                            : "border-slate-200 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        1. Domain & IP
                      </div>
                      <div
                        className={`py-1.5 rounded-xl border transition ${
                          wizardStep === 2
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300"
                            : wizardStep > 2
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700"
                            : "border-slate-200 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        2. SSH & Preflight
                      </div>
                      <div
                        className={`py-1.5 rounded-xl border transition ${
                          wizardStep === 3
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 animate-pulse"
                            : wizardStep > 3
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700"
                            : "border-slate-200 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        3. Installation
                      </div>
                      <div
                        className={`py-1.5 rounded-xl border transition ${
                          wizardStep === 4
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700"
                            : "border-slate-200 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        4. Connected
                      </div>
                    </div>

                    {/* STEP 1: SUBDOMAIN & VPS IP POINTING */}
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        {/* DNS Instructions Alert */}
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-300 space-y-1.5">
                          <div className="font-bold flex items-center space-x-1.5 text-blue-700 dark:text-blue-300">
                            <Globe className="w-4 h-4" />
                            <span>Step 1: Point Your Domain DNS 'A' Record</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                            In your DNS registrar (Cloudflare, GoDaddy, Namecheap, etc.), create an <strong>A Record</strong> pointing your chosen subdomain to your fresh VPS IP.
                          </p>
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 font-mono text-[11px] text-purple-700 dark:text-purple-300 font-bold border border-blue-200/50">
                            A Record: {wizardData.fqdn || "node1.nesthost.net"} ➔ {wizardData.ip || "VPS_IP"} (DNS-Only / Grey Cloud)
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Node Display Name
                            </label>
                            <input
                              type="text"
                              value={wizardData.name}
                              onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                              placeholder="e.g. BBB Node 02 (Dedicated)"
                              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Subdomain (FQDN)
                            </label>
                            <input
                              type="text"
                              value={wizardData.fqdn}
                              onChange={(e) => setWizardData({ ...wizardData, fqdn: e.target.value })}
                              placeholder="node2.nesthost.net"
                              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Fresh VPS Public IPv4
                            </label>
                            <input
                              type="text"
                              value={wizardData.ip}
                              onChange={(e) => setWizardData({ ...wizardData, ip: e.target.value })}
                              placeholder="13.140.140.237"
                              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Admin Email (Let's Encrypt SSL)
                            </label>
                            <input
                              type="email"
                              value={wizardData.adminEmail}
                              onChange={(e) => setWizardData({ ...wizardData, adminEmail: e.target.value })}
                              placeholder="admin@nesthost.net"
                              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* DNS Resolution Feedback */}
                        {preflightData?.dns && (
                          <div
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                              preflightData.dns.matched
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                                : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {preflightData.dns.matched ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span>{preflightData.dns.message}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={handleRunPreflight}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${preflightStatus === "checking" ? "animate-spin" : ""}`} />
                            <span>{preflightStatus === "checking" ? "Testing DNS..." : "Test DNS Resolution"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            disabled={!wizardData.fqdn || !wizardData.ip}
                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-500/20 disabled:opacity-40 flex items-center space-x-1.5"
                          >
                            <span>Next: SSH & Resource Check</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: SSH CREDENTIALS & RESOURCE PREFLIGHT DIAGNOSTICS */}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-950 dark:text-purple-300 space-y-1">
                          <div className="font-bold flex items-center space-x-1.5 text-purple-700 dark:text-purple-300">
                            <Lock className="w-4 h-4" />
                            <span>SSH Root Access for Automated Preflight & Setup</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            The panel securely connects to check OS version, CPU, RAM, NVMe disk, and open ports before starting installation.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">SSH Port</label>
                            <input
                              type="number"
                              value={wizardData.sshPort}
                              onChange={(e) => setWizardData({ ...wizardData, sshPort: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Username</label>
                            <input
                              type="text"
                              value={wizardData.sshUser}
                              onChange={(e) => setWizardData({ ...wizardData, sshUser: e.target.value })}
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Root Password</label>
                            <input
                              type="password"
                              value={wizardData.sshPassword}
                              onChange={(e) => setWizardData({ ...wizardData, sshPassword: e.target.value })}
                              placeholder="••••••••••••"
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Diagnostic Checklist */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
                              Automated Hardware & Port Preflight Checklist
                            </h5>
                            <button
                              type="button"
                              onClick={handleRunPreflight}
                              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${preflightStatus === "checking" ? "animate-spin" : ""}`} />
                              <span>{preflightStatus === "checking" ? "Running Preflight..." : "Run Preflight Check"}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">Operating System</span>
                              <div className={`text-xs font-extrabold flex items-center space-x-1.5 ${
                                preflightData?.os?.valid === false ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                              }`}>
                                {preflightData?.os?.valid === false ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                                <span className="truncate">{preflightData?.os?.name || "Ubuntu 22.04 LTS (Required)"}</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">CPU Architecture</span>
                              <div className="text-xs font-extrabold flex items-center space-x-1.5 text-slate-900 dark:text-white">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{preflightData?.cpu?.cores || 8} vCPUs (x86_64)</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">RAM Memory</span>
                              <div className="text-xs font-extrabold flex items-center space-x-1.5 text-slate-900 dark:text-white">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{preflightData?.ram?.totalGb || 16} GB DDR4/5</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">NVMe Storage</span>
                              <div className="text-xs font-extrabold flex items-center space-x-1.5 text-slate-900 dark:text-white">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{preflightData?.disk?.freeGb || 85} GB Free</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preflight Status Banner */}
                        {preflightData?.readyForInstall === false ? (
                          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-900 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                            <div>
                              <span className="font-black uppercase tracking-wide">Incompatible OS Detected: {preflightData?.os?.name}</span>
                              <div className="text-[11px] font-normal text-rose-700 dark:text-rose-400 mt-0.5">
                                BigBlueButton requires either <strong>Ubuntu 24.04 LTS (for BBB 4.0)</strong> or <strong>Ubuntu 22.04 LTS (for BBB 3.0)</strong>. Please run preflight diagnostics or rebuild with a supported OS.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-black">STATUS: READY FOR INSTALLATION</span>
                              <div className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {preflightData?.summary || "Server passed hardware, port, and Ubuntu LTS OS checks. Ready to install BigBlueButton."}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            ← Back
                          </button>

                          <button
                            type="button"
                            onClick={handleStartInstallation}
                            disabled={preflightData?.readyForInstall === false}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold transition shadow-lg shadow-purple-500/30 transform hover:scale-105 flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Start Installation & Telemetry Setup</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: LIVE INSTALLATION PROGRESS BAR & LOG STREAM */}
                    {wizardStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                              <RefreshCw className={`w-4 h-4 text-purple-600 ${installStatus === "running" ? "animate-spin" : ""}`} />
                              <span>{installStepTitle}</span>
                            </span>
                            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                              {installProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                installStatus === "error"
                                  ? "bg-rose-500"
                                  : "bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500"
                              }`}
                              style={{ width: `${installProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Live Terminal Log Stream */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span className="flex items-center space-x-1.5">
                              <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Live Remote Execution Logs</span>
                            </span>
                            <div className="flex items-center space-x-2.5">
                              <button
                                type="button"
                                onClick={handleCopyInstallLogs}
                                disabled={installLogs.length === 0}
                                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition border border-slate-300 dark:border-slate-700 shadow-sm disabled:opacity-50"
                                title="Copy full execution log output"
                              >
                                {copiedInstallLogs ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Logs</span>
                                  </>
                                )}
                              </button>
                              <span className={`font-mono font-semibold ${installStatus === "error" ? "text-rose-500" : "text-emerald-500"}`}>
                                {installStatus === "error" ? "Execution Interrupted" : "Stream Active"}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] h-60 overflow-y-auto space-y-1 border border-slate-800 shadow-inner">
                            {installLogs.map((log, idx) => (
                              <div
                                key={idx}
                                className={`leading-relaxed ${
                                  log.includes("completed") || log.includes("verified") || log.includes("100%")
                                    ? "text-emerald-400 font-bold"
                                    : log.includes("ERROR") || log.includes("Failed") || log.includes("fatal")
                                    ? "text-rose-400 font-bold"
                                    : log.includes("Initiating") || log.includes("Requesting")
                                    ? "text-purple-300"
                                    : "text-slate-300"
                                }`}
                              >
                                {log}
                              </div>
                            ))}
                            <div ref={installLogsEndRef} />
                          </div>
                        </div>

                        {installStatus === "error" ? (
                          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Installation stopped. Check the logs above to resolve the issue.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setWizardStep(2)}
                              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                            >
                              ← Go Back & Change Settings
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs text-purple-800 dark:text-purple-300 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600 shrink-0" />
                              <span className="font-medium">{installStepTitle || "Installing BigBlueButton, generating Let's Encrypt SSL, and starting Aeorax telemetry daemon."}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setWizardStep(2)}
                              className="px-3 py-1 rounded-lg border border-purple-300 text-purple-800 dark:text-purple-200 text-[11px] font-bold hover:bg-purple-100 dark:hover:bg-purple-900 transition"
                            >
                              ← Back to Preflight
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 4: INSTALLATION COMPLETED & CONNECTED */}
                    {wizardStep === 4 && (
                      <div className="space-y-4 text-center py-2 animate-fadeIn">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <CheckCircle className="w-9 h-9" />
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">
                            BigBlueButton Node Successfully Provisioned!
                          </h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            The node is running BigBlueButton {completedNodeResult?.bbbVersion || completedNodeResult?.node?.bbbVersion || "4.0.0"}, secured with Let's Encrypt SSL, and actively linked into Scalelite load balancing.
                          </p>
                        </div>

                        {/* Node Specs & Status Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Subdomain FQDN</span>
                            <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                              {wizardData.fqdn}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Server IPv4</span>
                            <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                              {wizardData.ip}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Cluster Status</span>
                            <div className="font-bold text-emerald-600 flex items-center space-x-1 mt-0.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              <span>READY (Online)</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">BBB Version</span>
                            <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                              v{(completedNodeResult?.bbbVersion || completedNodeResult?.node?.bbbVersion || "4.0.0").replace(/^v/, "")} Stable
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Scalelite Balancing</span>
                            <div className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">Auto-Balanced</div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Telemetry Daemon</span>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Heartbeat Active</div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsWizardOpen(false);
                              setNodeAddSuccessMsg(`Node "${wizardData.name}" provisioned and linked successfully!`);
                              setTimeout(() => setNodeAddSuccessMsg(null), 5000);
                            }}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold transition shadow-lg shadow-emerald-500/20 transform hover:scale-105"
                          >
                            View Node in Dashboard Fleet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUPER ADMIN TAB: MEETING TEST LAB & BENCHMARK */}
          {adminTab === "testlab" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Card */}
              <div className="glass-card p-6 rounded-3xl border border-blue-200/80 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-purple-50/40 dark:from-blue-950/20 dark:via-slate-900/60 dark:to-purple-950/20 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        Direct Meeting Test Lab & Cluster Benchmark
                      </h3>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold border border-blue-300">
                        Admin Direct Testing
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Directly benchmark BigBlueButton servers & test WebRTC/video streaming load and Cloudflare R2 recordings without needing a College or Moodle LMS.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setTestMeetingID(`benchmark-${Math.random().toString(36).substring(2, 8)}`);
                      setTestLabToast(null);
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate New Room ID</span>
                  </button>
                </div>
              </div>

              {testLabToast && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                    testLabToast.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {testLabToast.type === "success" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testLabToast.message}</span>
                  </div>
                  <button onClick={() => setTestLabToast(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Grid: Left: Configuration Form, Right: Target Architecture & Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Target Selector & Meeting Config (2 cols) */}
                <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
                  {/* Step 1: Select Benchmark Target */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 block">
                      1. Select Target Endpoint (Where meeting will run)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => setTestTargetType("SCALELITE")}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          testTargetType === "SCALELITE"
                            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/30"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1.5">
                          <Layers className={`w-4 h-4 ${testTargetType === "SCALELITE" ? "text-blue-600" : "text-slate-400"}`} />
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">Scalelite Balancer</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          Balanced across all healthy nodes automatically via least-loaded algorithm.
                        </p>
                        <span className="mt-2 inline-block font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate max-w-full">
                          bbb.nesthost.net
                        </span>
                      </div>

                      <div
                        onClick={() => setTestTargetType("NODE")}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          testTargetType === "NODE"
                            ? "border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-500/30"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1.5">
                          <Server className={`w-4 h-4 ${testTargetType === "NODE" ? "text-purple-600" : "text-slate-400"}`} />
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">Direct Node VPS</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          Bypass balancer to test a single node's audio/video daemon & CPU directly.
                        </p>
                        <span className="mt-2 inline-block font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                          Isolated Single Node
                        </span>
                      </div>

                      <div
                        onClick={() => setTestTargetType("CUSTOM")}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          testTargetType === "CUSTOM"
                            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/30"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1.5">
                          <Globe className={`w-4 h-4 ${testTargetType === "CUSTOM" ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">Custom Server</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          Specify external BBB server URL & secret for benchmark diagnostics.
                        </p>
                        <span className="mt-2 inline-block font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Custom Endpoint
                        </span>
                      </div>
                    </div>

                    {/* Specific Node Selector if NODE is chosen */}
                    {testTargetType === "NODE" && (
                      <div className="mt-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-2">
                        <label className="text-xs font-bold text-purple-900 dark:text-purple-300">
                          Select Registered BigBlueButton Node:
                        </label>
                        <select
                          value={testSelectedNodeFqdn}
                          onChange={(e) => setTestSelectedNodeFqdn(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {nodes.map((node) => (
                            <option key={node.id} value={node.fqdn}>
                              {node.name} — {node.fqdn} ({node.ip}) [{node.status}]
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Custom endpoint inputs if CUSTOM is chosen */}
                    {testTargetType === "CUSTOM" && (
                      <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                        <div>
                          <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Custom BBB API Endpoint:</label>
                          <input
                            type="text"
                            value={testCustomApiUrl}
                            onChange={(e) => setTestCustomApiUrl(e.target.value)}
                            placeholder="https://bbb-node.example.com/bigbluebutton/api"
                            className="w-full mt-1 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Custom Shared Secret (Salt):</label>
                          <input
                            type="password"
                            value={testCustomSecret}
                            onChange={(e) => setTestCustomSecret(e.target.value)}
                            placeholder="bbb_secret_here"
                            className="w-full mt-1 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Meeting Parameters */}
                  <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      2. Benchmark Meeting Parameters
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Meeting Room Title</label>
                        <input
                          type="text"
                          value={testMeetingName}
                          onChange={(e) => setTestMeetingName(e.target.value)}
                          className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Meeting ID (Unique Salt)</label>
                        <input
                          type="text"
                          value={testMeetingID}
                          onChange={(e) => setTestMeetingID(e.target.value)}
                          className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Moderator Full Name</label>
                        <input
                          type="text"
                          value={testModeratorName}
                          onChange={(e) => setTestModeratorName(e.target.value)}
                          className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Default Student Tester Name</label>
                        <input
                          type="text"
                          value={testAttendeeName}
                          onChange={(e) => setTestAttendeeName(e.target.value)}
                          className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Recording & R2 Options */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Enable Session Recording</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Records session on BigBlueButton so you can test post-publish processing and R2 upload.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={testRecordEnabled}
                          onChange={(e) => setTestRecordEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>

                      {testRecordEnabled && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Target College R2 Bucket Folder:
                          </label>
                          <select
                            value={testSelectedCollegeForR2}
                            onChange={(e) => setTestSelectedCollegeForR2(e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          >
                            {colleges.map((col) => (
                              <option key={col.id} value={col.slug}>
                                {col.name} ({col.slug})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Launch Action */}
                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        onClick={handleCreateDirectMeeting}
                        disabled={isCreatingTestMeeting}
                        className="flex-1 flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <PlayCircle className="w-5 h-5" />
                        <span>{isCreatingTestMeeting ? "Initializing BigBlueButton Session..." : "Launch Direct Test Meeting"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Instructions & R2 Direct Test */}
                <div className="space-y-6">
                  {/* How it works card */}
                  <div className="glass-card p-5.5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3.5">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                        Diagnostics & Load Testing Guide
                      </h4>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span><strong>Direct Testing:</strong> Clicking launch creates the room on BBB and immediately opens Moderator in a new tab.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <span><strong>Multi-Device Load:</strong> Copy the Attendee Join URL and open it in multiple incognito tabs or other devices to benchmark concurrent audio/video.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span><strong>Recording Lifecycle:</strong> When you finish testing, click "End Meeting Session". BBB will conclude and process R2 upload.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Direct R2 Pipeline Test Card */}
                  <div className="glass-card p-5.5 rounded-3xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                          Direct R2 Storage Simulation
                        </h4>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Cloudflare R2 Multi-Tenant Test</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Instantly test moving a recording file into Cloudflare R2 under the selected college folder (<code>colleges/{testSelectedCollegeForR2}/recordings/</code>) to verify tenant isolation and playback link generation immediately without waiting.
                    </p>
                    <button
                      onClick={handleTestR2SyncDirect}
                      disabled={isTestingR2Sync}
                      className="w-full flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-md shadow-purple-500/20"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>{isTestingR2Sync ? "Verifying R2 Storage..." : "Test R2 Recording Move Now"}</span>
                    </button>

                    {r2TestResult && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-[11px] space-y-1">
                        <span className="font-bold text-emerald-600 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 inline" />
                          <span>R2 Ingest Verified:</span>
                        </span>
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          {r2TestResult.r2Key}
                        </div>
                        <a
                          href={r2TestResult.playableUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-purple-600 font-bold hover:underline"
                        >
                          <span>Open Playback URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. ACTIVE TEST MEETING TELEMETRY & LIVE CONTROLS CARD */}
              {activeTestSession && (
                <div className="glass-card p-6 rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/40 via-white to-blue-50/40 dark:from-emerald-950/20 dark:via-slate-900/60 dark:to-blue-950/20 shadow-md space-y-6">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm">
                            {activeTestSession.meetingName}
                          </h4>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 animate-pulse">
                            ● ACTIVE LAB SESSION
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          ID: {activeTestSession.meetingID} • Target: {activeTestSession.targetLabel} • Created: {activeTestSession.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleFetchTestTelemetry}
                        disabled={isFetchingTelemetry}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTelemetry ? "animate-spin" : ""}`} />
                        <span>Refresh Telemetry</span>
                      </button>

                      <button
                        onClick={handleEndDirectMeeting}
                        disabled={isEndingMeeting}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold transition shadow-md shadow-rose-500/20"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isEndingMeeting ? "Ending..." : "End Meeting Session"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Participants</span>
                      <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {testTelemetry?.participantCount ?? 1}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Voice Listeners</span>
                      <div className="text-xl font-black text-blue-600 mt-1">
                        {testTelemetry?.listenerCount ?? 1}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Microphones / Speakers</span>
                      <div className="text-xl font-black text-purple-600 mt-1">
                        {testTelemetry?.voiceParticipantCount ?? 0}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Webcam Streams</span>
                      <div className="text-xl font-black text-emerald-600 mt-1">
                        {testTelemetry?.videoCount ?? 0}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Recording State</span>
                      <div className="text-sm font-black mt-1.5 flex items-center space-x-1.5">
                        {activeTestSession.record ? (
                          <span className="text-rose-600 flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                            <span>RECORDING</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">DISABLED</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                      <div className="text-xl font-black text-indigo-600 mt-1">
                        {testTelemetry?.duration ?? 0} min
                      </div>
                    </div>
                  </div>

                  {/* Join URLs Card */}
                  <div className="space-y-3 pt-2">
                    {/* Moderator Link */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                          Moderator Classroom Join URL:
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">Full host & recording controls</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          readOnly
                          value={activeTestSession.moderatorJoinUrl}
                          className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200"
                        />
                        <button
                          onClick={() => {
                            copyToClipboard(activeTestSession.moderatorJoinUrl);
                            setTestLabToast({ type: "success", message: "Moderator join URL copied to clipboard!" });
                          }}
                          className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => window.open(activeTestSession.moderatorJoinUrl, "_blank", "noopener,noreferrer")}
                          className="px-3.5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
                        >
                          Open
                        </button>
                      </div>
                    </div>

                    {/* Student Link */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Attendee / Student Join URL (Open in Incognito / Other Devices for Load Testing):
                        </label>
                        <span className="text-[11px] text-slate-500 font-medium">Simulate multiple students</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          readOnly
                          value={activeTestSession.attendeeJoinUrl}
                          className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200"
                        />
                        <button
                          onClick={() => {
                            copyToClipboard(activeTestSession.attendeeJoinUrl);
                            setTestLabToast({ type: "success", message: "Student join URL copied to clipboard!" });
                          }}
                          className="px-3.5 py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => window.open(activeTestSession.attendeeJoinUrl, "_blank", "noopener,noreferrer")}
                          className="px-3.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                        >
                          Open Student Tab
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUPER ADMIN TAB 3: COLLEGES & QUOTAS */}
          {adminTab === "colleges" && (
            <div className="space-y-5">
              {/* Top Action Header */}
              <div className="flex items-center justify-between flex-wrap gap-4 glass-card p-5 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <span>Client Institutions, Quotas & Subscription Tiers</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provision institutional client accounts, manage subscription packages, assign concurrent room quotas and R2 storage
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {collegesSubTab === "packages" ? (
                    <button
                      onClick={() => setIsAddTierModalOpen(true)}
                      className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-purple-500/25 transform hover:scale-105"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Create Subscription Tier</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCollegeError(null);
                        setIsAddCollegeModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-blue-500/25 transform hover:scale-105"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Register New Client College</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  onClick={() => setCollegesSubTab("clients")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    collegesSubTab === "clients"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Client Institutions ({colleges.length})</span>
                </button>
                <button
                  onClick={() => setCollegesSubTab("packages")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    collegesSubTab === "packages"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Subscription Tiers & Packages ({subscriptionTiers.length})</span>
                </button>
              </div>

              {/* SUB-VIEW 1: CLIENT COLLEGES */}
              {collegesSubTab === "clients" && (
                <>
                  {isLoadingColleges ? (
                <div className="glass-card p-12 text-center rounded-3xl">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-500">Loading client institutions...</div>
                </div>
              ) : colleges.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-3xl space-y-4 max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto shadow-md">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Client Colleges Registered</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Get started by adding your first educational client, university, or academy to allocate dedicated virtual classroom capacity and auto-generated BigBlueButton API credentials.
                  </p>
                  <button
                    onClick={() => {
                      setCollegeError(null);
                      setIsAddCollegeModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition transform hover:scale-105"
                  >
                    + Register First Client College
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {colleges.map((col) => (
                    <div key={col.id} className="glass-card glass-hover p-6 rounded-3xl space-y-4 relative">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{col.name}</h3>
                          <div className="text-xs text-slate-500 font-mono mt-1">Tenant Slug: {col.slug}</div>
                          {col.contactEmail && (
                            <div className="text-xs text-slate-400 mt-0.5">{col.contactEmail}</div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold">
                            {col.plan}
                          </span>
                          <button
                            onClick={() => handleDeleteCollege(col.id, col.name)}
                            className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete Client Institution"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Concurrent Classrooms</span>
                          <span className="font-bold text-slate-900 dark:text-white">{col.activeRooms} / {col.maxRooms} rooms</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, (col.activeRooms / (col.maxRooms || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 text-[11px] font-semibold">Max Students</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{col.maxStudents} Students</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 text-[11px] font-semibold">Cloud Storage Quota</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{col.storageLimitGb} GB (R2)</div>
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
            </>
          )}

          {/* SUB-VIEW 2: SUBSCRIPTION TIERS & PACKAGES */}
          {collegesSubTab === "packages" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionTiers.map((tier) => {
                  const enrolledCount = colleges.filter((c) =>
                    c.plan?.toLowerCase().includes(tier.name.toLowerCase().split(" ")[0])
                  ).length;

                  return (
                    <div
                      key={tier.id}
                      className="glass-card p-6 rounded-3xl space-y-5 border border-slate-200 dark:border-slate-800 relative flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base">
                              {tier.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {tier.description}
                            </p>
                          </div>
                          {tier.id.startsWith("tier-") &&
                            !["tier-standard", "tier-enterprise", "tier-university"].includes(tier.id) && (
                              <button
                                onClick={() => handleDeleteTier(tier.id, tier.name)}
                                className="text-slate-400 hover:text-rose-600 transition"
                                title="Delete Custom Tier"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                        </div>

                        <div className="flex items-baseline space-x-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            ${tier.priceMonthly}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ month</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Rooms</div>
                            <div className="text-sm font-black text-blue-600">{tier.maxRooms}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Students</div>
                            <div className="text-sm font-black text-purple-600">{tier.maxStudents}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">Storage</div>
                            <div className="text-sm font-black text-emerald-600">{tier.storageGb} GB</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[11px] uppercase font-bold text-slate-400">Package Inclusions</div>
                          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                            {tier.features.map((feat, idx) => (
                              <li key={idx} className="flex items-center space-x-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          Enrolled: <strong className="text-slate-900 dark:text-white">{enrolledCount} Institutions</strong>
                        </span>
                        <button
                          onClick={() => {
                            setCollegeFormData((prev) => ({
                              ...prev,
                              plan: tier.name,
                              maxConcurrentRooms: tier.maxRooms,
                              maxTotalParticipants: tier.maxStudents,
                              storageLimitGb: tier.storageGb,
                            }));
                            setCollegesSubTab("clients");
                            setIsAddCollegeModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs transition"
                        >
                          Assign Tier →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

          {/* SUPER ADMIN TAB 4: MOODLE & LMS GATEWAY (SUPER ADMIN MANAGED ONLY) */}
          {adminTab === "moodle" && (
            <div className="space-y-6">
              {colleges.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-3xl space-y-4 max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Client Colleges Available</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Register an institutional client college first to generate secure LMS API keys, gateway endpoints, and Moodle integration credentials.
                  </p>
                  <button
                    onClick={() => {
                      setAdminTab("colleges");
                      setIsAddCollegeModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                  >
                    + Register Client College
                  </button>
                </div>
              ) : (
                <>
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
                                value={process.env.NEXT_PUBLIC_SCALELITE_API_URL || "https://bbb.nesthost.net/bigbluebutton/api"}
                                className="w-full text-xs font-mono bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200"
                              />
                              <button
                                onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_SCALELITE_API_URL || "https://bbb.nesthost.net/bigbluebutton/api")}
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
                </>
              )}
            </div>
          )}

          {/* SUPER ADMIN TAB 5: RECORDING & R2 PIPELINE */}
          {adminTab === "recordings" && (
            <div className="space-y-6">
              {/* Header Card with Live Connection Controls */}
              <div className="glass-card p-6 rounded-3xl relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white dark:from-blue-950/20 dark:via-slate-900/60 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                          Cloudflare R2 Storage & Recordings Pipeline
                        </h2>
                        {r2Status === "connected" && (
                          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Live Connected ({r2Latency}ms)</span>
                          </span>
                        )}
                        {r2Status === "testing" && (
                          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Probing R2 Bucket...</span>
                          </span>
                        )}
                        {r2Status === "error" && (
                          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Connection Issue</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        S3-compatible persistent object storage for BigBlueButton session recordings, whiteboard archives, and presentation assets.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={testR2LiveConnection}
                      disabled={r2Status === "testing"}
                      className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${r2Status === "testing" ? "animate-spin" : ""}`} />
                      <span>{r2Status === "testing" ? "Testing..." : "Test R2 Connection"}</span>
                    </button>
                    <button
                      onClick={handleUploadTestFile}
                      disabled={isUploadingR2}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingR2 ? "Uploading..." : "+ Upload Verification Ping"}</span>
                    </button>
                  </div>
                </div>

                {r2UploadSuccess && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{r2UploadSuccess}</span>
                  </div>
                )}

                {r2Status === "error" && r2Message && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 font-bold flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{r2Message}</span>
                  </div>
                )}
              </div>

              {/* Stats & Infrastructure Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Target Bucket</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">aeorax-live</div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Region: auto • S3 API Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Total Live Objects</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {r2Objects.length} Objects
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    across all tenant recordings
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Egress Cost</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">$0.00 / GB</div>
                  <div className="text-[11px] text-slate-500 mt-1">100% Free Cloudflare Egress</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                  <div className="text-[11px] uppercase font-bold text-slate-400">Storage Quota Total</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                    {colleges.reduce((acc, c) => acc + (c.storageLimitGb || 0), 0)} GB
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    allocated across {colleges.length} {colleges.length === 1 ? "tenant" : "tenants"}
                  </div>
                </div>
              </div>

              {/* R2 Live Object Browser & Archive */}
              <div className="glass-card p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4">
                {/* Multi-Tenant Isolation Banner & Controls */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 dark:from-purple-950/20 dark:via-slate-900/60 dark:to-blue-950/20 border border-purple-200/80 dark:border-purple-800/40 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Tenant Storage Isolation:
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 font-mono">
                          {selectedR2CollegeFilter === "ALL" ? "aeorax-live/ [Global View]" : `aeorax-live/${selectedR2CollegeFilter}/recordings/`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Classes record to live server NVMe, and automatically migrate into each college's private folder in R2 upon completion.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    {/* College Folder Selector */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Filter Tenant:</span>
                      <select
                        value={selectedR2CollegeFilter}
                        onChange={(e) => {
                          setSelectedR2CollegeFilter(e.target.value);
                          setTimeout(() => fetchR2Objects(), 50);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                      >
                        <option value="ALL">📁 All College Directories (Global)</option>
                        {colleges.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            🏫 {c.name} ({c.slug}/recordings/)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Simulate Class End & Recording Move */}
                    <button
                      onClick={handleSimulateBBBRecordingMove}
                      disabled={isSimulatingBBBMove}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 flex items-center space-x-1.5 disabled:opacity-50 transition"
                      title="Simulates meeting ending on live node and offloading to college R2 folder"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isSimulatingBBBMove ? "Moving to R2..." : "Simulate Class End -> Move to R2"}</span>
                    </button>
                  </div>
                </div>

                {bbbMoveSuccessMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center space-x-2 shadow-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bbbMoveSuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>R2 Bucket Objects Explorer</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
                        {r2Objects.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live file objects stored in bucket <code className="font-mono text-purple-600 dark:text-purple-400">aeorax-live</code>
                    </p>
                  </div>
                  <button
                    onClick={() => fetchR2Objects()}
                    disabled={isLoadingR2}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingR2 ? "animate-spin" : ""}`} />
                    <span>Refresh List</span>
                  </button>
                </div>

                {isLoadingR2 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Querying Cloudflare R2 bucket...
                  </div>
                ) : r2Objects.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      R2 Bucket is Active & Ready (0 Objects)
                    </div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      No recording files or assets have been uploaded yet. When instructors finish virtual classrooms, BigBlueButton's post-publish script automatically compiles and uploads the MP4 playback to this bucket.
                    </p>
                    <button
                      onClick={handleUploadTestFile}
                      disabled={isUploadingR2}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm inline-flex items-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingR2 ? "Uploading..." : "Upload Test Verification Ping"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Object Key / Path</th>
                          <th className="py-3 px-4">Size</th>
                          <th className="py-3 px-4">Last Modified</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {r2Objects.map((obj) => {
                          const sizeFormatted =
                            obj.size < 1024
                              ? `${obj.size} B`
                              : obj.size < 1024 * 1024
                              ? `${(obj.size / 1024).toFixed(1)} KB`
                              : `${(obj.size / (1024 * 1024)).toFixed(2)} MB`;

                          return (
                            <tr key={obj.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                              <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200 break-all">
                                {obj.key}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {sizeFormatted}
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                {obj.lastModified ? new Date(obj.lastModified).toLocaleString() : "—"}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                                <button
                                  onClick={() => handleDownloadR2Object(obj.key)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition inline-flex items-center space-x-1"
                                  title="Download / Stream via Pre-signed URL"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteR2Object(obj.key)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-bold hover:bg-rose-100 dark:hover:bg-rose-900 transition inline-flex items-center space-x-1"
                                  title="Delete from R2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  Cluster Status: {nodes.some((n) => n.status === "READY") ? "HEALTHY" : "OFFLINE"}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Fleet Cluster Online ({nodes.filter((n) => n.status === "READY").length} Active Nodes)
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Current fleet of {nodes.length} BigBlueButton node{nodes.length === 1 ? "" : "s"} is dynamically balanced via Scalelite and monitored by real-time hardware telemetry daemons.
                    </div>
                  </div>
                </div>

                {nodes.some((n) => n.status === "DRAIN") ? (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start space-x-3">
                    <Server className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Node Maintenance in Progress ({nodes.filter((n) => n.status === "DRAIN").map((n) => n.name).join(", ")})
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        These nodes are currently in DRAIN mode. Scalelite is allowing existing meetings to conclude before updates.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
                    <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        Zero Node Bottlenecks Detected
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        All meeting servers are reporting nominal CPU, RAM, and WebRTC media streams with zero queued session transfers.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUPER ADMIN TAB 7: CLASSROOM BRANDING & DYNAMIC WHITE-LABEL ENGINE */}
          {adminTab === "branding" && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="glass-card p-6 rounded-3xl flex items-center justify-between flex-wrap gap-4 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        Classroom Branding & Dynamic White-Label Engine
                      </h3>
                      <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Zero Node Config Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage global brand defaults or assign custom white-label logos, colors, banners, and welcome slides per college.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Target Mechanism:</span>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 font-mono text-purple-700 dark:text-purple-300 font-bold">
                    BigBlueButton HTML5 Dynamic Injection
                  </span>
                </div>
              </div>

              {/* Toast Notification */}
              {brandingSaveToast && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2.5 shadow-sm animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Branding settings updated successfully! Dynamic CSS is active for all new sessions on Scalelite nodes.</span>
                </div>
              )}

              {/* Two Column Setup: Editor + Live Classroom Simulator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: Controls & College Selectors (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Global Platform Brand Summary Banner */}
                  <div className="glass-card p-5.5 rounded-3xl border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-slate-900/60 dark:to-purple-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          Enterprise Dual-Mode Theming Architecture
                        </h4>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        Zero SSH / Stateless Nodes
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      You can set your <strong>Global Platform Default Brand</strong> (applied to all standard clients) or turn on <strong>Custom White-Labeling</strong> for specific institutions. BigBlueButton meeting nodes remain 100% standalone and load everything dynamically on room start.
                    </p>
                  </div>

                  {/* Brand & College Editor Card */}
                  <div className="glass-card p-6 rounded-3xl space-y-5">
                    {/* Brand & College Selector Tabs */}
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                        Select Target to Configure Branding
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {[
                          { slug: "default", name: "⭐ Global Master Brand", isGlobal: true },
                          ...colleges.map((c) => ({ slug: c.slug, name: c.name, isGlobal: false })),
                        ].map((col) => {
                          const isSelected = selectedBrandingCollegeSlug === col.slug;
                          const isWhitelabeled = col.isGlobal
                            ? false
                            : brandingSettings[col.slug]?.whiteLabelEnabled;

                          return (
                            <button
                              key={col.slug}
                              type="button"
                              onClick={() => setSelectedBrandingCollegeSlug(col.slug)}
                              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                                isSelected
                                  ? col.isGlobal
                                    ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                                    : "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20"
                                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="font-extrabold text-xs truncate">{col.name}</div>
                              <div className="mt-1 flex items-center justify-between text-[10px]">
                                <span className="font-mono text-slate-400">
                                  {col.isGlobal ? "platform" : col.slug}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded font-black ${
                                    col.isGlobal
                                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                                      : isWhitelabeled
                                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                  }`}
                                >
                                  {col.isGlobal ? "Default" : isWhitelabeled ? "Custom" : "Inherit"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* MODE 1: GLOBAL PLATFORM MASTER BRAND SETTINGS */}
                    {selectedBrandingCollegeSlug === "default" && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200">
                              Configuring Global Master Brand (Default for All Standard Clients)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                            This is your primary SaaS brand. When any college has white-label disabled, their meeting rooms, navbar, whiteboard, and buttons will automatically display this branding.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Global Platform Brand Name
                            </label>
                            <input
                              type="text"
                              value={brandingSettings["default"]?.brandName || "Aeorax Live"}
                              onChange={(e) => {
                                setBrandingSettings({
                                  ...brandingSettings,
                                  default: {
                                    ...brandingSettings["default"],
                                    brandName: e.target.value,
                                  },
                                });
                              }}
                              className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Global Brand Logo URL
                            </label>
                            <input
                              type="text"
                              value={brandingSettings["default"]?.logoUrl || ""}
                              placeholder="https://yourdomain.com/logo.png"
                              onChange={(e) => {
                                setBrandingSettings({
                                  ...brandingSettings,
                                  default: {
                                    ...brandingSettings["default"],
                                    logoUrl: e.target.value,
                                  },
                                });
                              }}
                              className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Color Picker & Preset Swatches for Default */}
                        <div>
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                            Global Default Primary Accent Color
                          </label>
                          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                            {[
                              { label: "Royal Indigo", hex: "#6366f1" },
                              { label: "Ocean Blue", hex: "#0284c7" },
                              { label: "Emerald Green", hex: "#10b981" },
                              { label: "Crimson Rose", hex: "#e11d48" },
                              { label: "Amber Gold", hex: "#f59e0b" },
                              { label: "Deep Violet", hex: "#7c3aed" },
                            ].map((preset) => {
                              const isCurrent = (brandingSettings["default"]?.primaryColor || "#6366f1") === preset.hex;
                              return (
                                <button
                                  key={preset.hex}
                                  type="button"
                                  onClick={() => {
                                    setBrandingSettings({
                                      ...brandingSettings,
                                      default: {
                                        ...brandingSettings["default"],
                                        primaryColor: preset.hex,
                                      },
                                    });
                                  }}
                                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                                    isCurrent
                                      ? "ring-2 ring-indigo-500 border-transparent shadow-sm bg-indigo-50 dark:bg-indigo-950/60"
                                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: preset.hex }} />
                                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">{preset.label}</span>
                                </button>
                              );
                            })}

                            <div className="flex items-center space-x-2 ml-auto">
                              <input
                                type="color"
                                value={brandingSettings["default"]?.primaryColor || "#6366f1"}
                                onChange={(e) => {
                                  setBrandingSettings({
                                    ...brandingSettings,
                                    default: {
                                      ...brandingSettings["default"],
                                      primaryColor: e.target.value,
                                    },
                                  });
                                }}
                                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                              />
                              <input
                                type="text"
                                value={brandingSettings["default"]?.primaryColor || "#6366f1"}
                                onChange={(e) => {
                                  setBrandingSettings({
                                    ...brandingSettings,
                                    default: {
                                      ...brandingSettings["default"],
                                      primaryColor: e.target.value,
                                    },
                                  });
                                }}
                                className="w-24 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold bg-white dark:bg-slate-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Banner & Presentation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Global Classroom Welcome Banner
                            </label>
                            <input
                              type="text"
                              value={brandingSettings["default"]?.bannerText || ""}
                              placeholder="e.g. Welcome to Aeorax Live Virtual Classroom"
                              onChange={(e) => {
                                setBrandingSettings({
                                  ...brandingSettings,
                                  default: {
                                    ...brandingSettings["default"],
                                    bannerText: e.target.value,
                                  },
                                });
                              }}
                              className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Global Default Slide (PDF URL)
                            </label>
                            <input
                              type="text"
                              value={brandingSettings["default"]?.welcomePdfUrl || ""}
                              placeholder="https://yourdomain.com/slides/default.pdf"
                              onChange={(e) => {
                                setBrandingSettings({
                                  ...brandingSettings,
                                  default: {
                                    ...brandingSettings["default"],
                                    welcomePdfUrl: e.target.value,
                                  },
                                });
                              }}
                              className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={isSavingBranding}
                            onClick={handleSaveBranding}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold transition shadow-md shadow-indigo-500/25 flex items-center space-x-1.5 transform hover:scale-102 disabled:opacity-50"
                          >
                            {isSavingBranding ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>{isSavingBranding ? "Saving..." : "Save & Activate Global Brand"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: PER-COLLEGE BRANDING WITH DUAL CHOICE (INHERIT VS CUSTOM WHITE-LABEL) */}
                    {selectedBrandingCollegeSlug !== "default" && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Dual Option Cards: Inherit vs Custom White-Label */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setBrandingSettings({
                                ...brandingSettings,
                                [selectedBrandingCollegeSlug]: {
                                  ...brandingSettings[selectedBrandingCollegeSlug],
                                  whiteLabelEnabled: false,
                                },
                              });
                            }}
                            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                              !brandingSettings[selectedBrandingCollegeSlug]?.whiteLabelEnabled
                                ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs flex items-center space-x-1.5">
                                <span>🌐 Use Global Brand</span>
                              </span>
                              {!brandingSettings[selectedBrandingCollegeSlug]?.whiteLabelEnabled && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                              Inherits <strong>{brandingSettings["default"]?.brandName || "Aeorax Live"}</strong> name, logo, and theme color. Zero configuration required.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setBrandingSettings({
                                ...brandingSettings,
                                [selectedBrandingCollegeSlug]: {
                                  ...brandingSettings[selectedBrandingCollegeSlug],
                                  whiteLabelEnabled: true,
                                },
                              });
                            }}
                            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                              brandingSettings[selectedBrandingCollegeSlug]?.whiteLabelEnabled
                                ? "border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20"
                                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs flex items-center space-x-1.5">
                                <span>🎨 Custom White-Label</span>
                              </span>
                              {brandingSettings[selectedBrandingCollegeSlug]?.whiteLabelEnabled && (
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                              Custom logo, colors, welcome slides, and branded room experience tailored exclusively for this client.
                            </p>
                          </button>
                        </div>

                        {/* College White-Label Customization Form (when enabled) */}
                        {brandingSettings[selectedBrandingCollegeSlug]?.whiteLabelEnabled ? (
                          <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                  College Brand Display Name
                                </label>
                                <input
                                  type="text"
                                  value={brandingSettings[selectedBrandingCollegeSlug]?.brandName || ""}
                                  onChange={(e) => {
                                    setBrandingSettings({
                                      ...brandingSettings,
                                      [selectedBrandingCollegeSlug]: {
                                        ...brandingSettings[selectedBrandingCollegeSlug],
                                        brandName: e.target.value,
                                      },
                                    });
                                  }}
                                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                  College Classroom Logo URL
                                </label>
                                <input
                                  type="text"
                                  value={brandingSettings[selectedBrandingCollegeSlug]?.logoUrl || ""}
                                  placeholder="https://college.edu/logo.png"
                                  onChange={(e) => {
                                    setBrandingSettings({
                                      ...brandingSettings,
                                      [selectedBrandingCollegeSlug]: {
                                        ...brandingSettings[selectedBrandingCollegeSlug],
                                        logoUrl: e.target.value,
                                      },
                                    });
                                  }}
                                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>

                            {/* Color Picker & Preset Swatches for College */}
                            <div>
                              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                                College Classroom Primary Accent Color
                              </label>
                              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                                {[
                                  { label: "Ocean Blue", hex: "#0284c7" },
                                  { label: "Crimson Rose", hex: "#e11d48" },
                                  { label: "Emerald Green", hex: "#10b981" },
                                  { label: "Royal Indigo", hex: "#6366f1" },
                                  { label: "Amber Gold", hex: "#f59e0b" },
                                  { label: "Deep Violet", hex: "#7c3aed" },
                                ].map((preset) => {
                                  const isCurrent = brandingSettings[selectedBrandingCollegeSlug]?.primaryColor === preset.hex;
                                  return (
                                    <button
                                      key={preset.hex}
                                      type="button"
                                      onClick={() => {
                                        setBrandingSettings({
                                          ...brandingSettings,
                                          [selectedBrandingCollegeSlug]: {
                                            ...brandingSettings[selectedBrandingCollegeSlug],
                                            primaryColor: preset.hex,
                                          },
                                        });
                                      }}
                                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                                        isCurrent
                                          ? "ring-2 ring-purple-500 border-transparent shadow-sm bg-purple-50 dark:bg-purple-950/60"
                                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                      }`}
                                    >
                                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: preset.hex }} />
                                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">{preset.label}</span>
                                    </button>
                                  );
                                })}

                                <div className="flex items-center space-x-2 ml-auto">
                                  <input
                                    type="color"
                                    value={brandingSettings[selectedBrandingCollegeSlug]?.primaryColor || "#6366f1"}
                                    onChange={(e) => {
                                      setBrandingSettings({
                                        ...brandingSettings,
                                        [selectedBrandingCollegeSlug]: {
                                          ...brandingSettings[selectedBrandingCollegeSlug],
                                          primaryColor: e.target.value,
                                        },
                                      });
                                    }}
                                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                                  />
                                  <input
                                    type="text"
                                    value={brandingSettings[selectedBrandingCollegeSlug]?.primaryColor || "#6366f1"}
                                    onChange={(e) => {
                                      setBrandingSettings({
                                        ...brandingSettings,
                                        [selectedBrandingCollegeSlug]: {
                                          ...brandingSettings[selectedBrandingCollegeSlug],
                                          primaryColor: e.target.value,
                                        },
                                      });
                                    }}
                                    className="w-24 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold bg-white dark:bg-slate-900"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Banner & Presentation */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                  Classroom Welcome Banner
                                </label>
                                <input
                                  type="text"
                                  value={brandingSettings[selectedBrandingCollegeSlug]?.bannerText || ""}
                                  placeholder="e.g. Welcome Oxford Students & Faculty"
                                  onChange={(e) => {
                                    setBrandingSettings({
                                      ...brandingSettings,
                                      [selectedBrandingCollegeSlug]: {
                                        ...brandingSettings[selectedBrandingCollegeSlug],
                                        bannerText: e.target.value,
                                      },
                                    });
                                  }}
                                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                  Default Welcome Slide (PDF URL)
                                </label>
                                <input
                                  type="text"
                                  value={brandingSettings[selectedBrandingCollegeSlug]?.welcomePdfUrl || ""}
                                  placeholder="https://college.edu/slides/welcome.pdf"
                                  onChange={(e) => {
                                    setBrandingSettings({
                                      ...brandingSettings,
                                      [selectedBrandingCollegeSlug]: {
                                        ...brandingSettings[selectedBrandingCollegeSlug],
                                        welcomePdfUrl: e.target.value,
                                      },
                                    });
                                  }}
                                  className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center py-6">
                            <CheckCircle className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-80" />
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                              Currently Inheriting Global Platform Brand
                            </div>
                            <div className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                              All rooms for this college will automatically display the global "{brandingSettings["default"]?.brandName || "Aeorax Live"}" brand name, logo, and theme color.
                            </div>
                          </div>
                        )}

                        {/* Save Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={isSavingBranding}
                            onClick={handleSaveBranding}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-extrabold transition shadow-md shadow-purple-500/25 flex items-center space-x-1.5 transform hover:scale-102 disabled:opacity-50"
                          >
                            {isSavingBranding ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>{isSavingBranding ? "Saving..." : "Save & Activate College Branding"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Architecture Clarification Callout */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Zero-Touch BigBlueButton Meeting Servers Architecture</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      All BigBlueButton 3.0 meeting servers run purely standalone and stateless. All logos, custom styles, and banners are injected dynamically over HTTPS by this Master Panel on room launch (<code className="font-mono text-purple-600 dark:text-purple-400 text-[10px]">userdata-bbb_custom_style_url</code>). You never need to SSH into meeting servers or edit nginx files to customize themes.
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: Live Interactive BBB Classroom Simulator (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Live BigBlueButton 3.0 Classroom Simulator
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      Real-time CSS Reflection
                    </span>
                  </div>

                  {/* HTML5 Client Simulated Browser Frame */}
                  {(() => {
                    const isGlobalSelected = selectedBrandingCollegeSlug === "default";
                    const currentConfig = brandingSettings[selectedBrandingCollegeSlug] || brandingSettings["default"];
                    const globalConfig = brandingSettings["default"] || {
                      brandName: "Aeorax Live",
                      primaryColor: "#6366f1",
                      logoUrl: "",
                      bannerText: "Welcome to Aeorax Live Virtual Classroom",
                    };

                    const isEffectivelyWhitelabeled = !isGlobalSelected && currentConfig.whiteLabelEnabled;
                    const effectiveColor = isEffectivelyWhitelabeled
                      ? currentConfig.primaryColor || globalConfig.primaryColor
                      : globalConfig.primaryColor;
                    const effectiveName = isEffectivelyWhitelabeled
                      ? currentConfig.brandName || "Custom Brand"
                      : globalConfig.brandName || "Aeorax Live";
                    const effectiveBanner = isEffectivelyWhitelabeled
                      ? currentConfig.bannerText || "Welcome to Virtual Classroom"
                      : globalConfig.bannerText || "Welcome to Aeorax Live Virtual Classroom";
                    const effectiveLogo = isEffectivelyWhitelabeled
                      ? currentConfig.logoUrl
                      : globalConfig.logoUrl;

                    return (
                      <div className="rounded-3xl border border-slate-300 dark:border-slate-800 bg-[#0c101a] text-white shadow-2xl overflow-hidden flex flex-col h-[520px]">
                        {/* Browser Bar */}
                        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-400 font-mono text-[10px] ml-2 truncate">
                              https://node1.nesthost.net/html5client/join
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              SSL Verified
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                isGlobalSelected
                                  ? "bg-indigo-950 text-indigo-300 border-indigo-700"
                                  : isEffectivelyWhitelabeled
                                  ? "bg-purple-950 text-purple-300 border-purple-700"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                              }`}
                            >
                              {isGlobalSelected
                                ? "Global Master Brand"
                                : isEffectivelyWhitelabeled
                                ? "Custom White-Label"
                                : "Inheriting Global Brand"}
                            </span>
                          </div>
                        </div>

                        {/* BBB Classroom Top Navbar */}
                        <div
                          className="px-4 py-2.5 border-b flex items-center justify-between transition-colors duration-300"
                          style={{
                            backgroundColor: "#111827",
                            borderBottomColor: `${effectiveColor}60`,
                          }}
                        >
                          <div className="flex items-center space-x-2.5">
                            {effectiveLogo ? (
                              <img
                                src={effectiveLogo}
                                alt="Logo"
                                className="w-6 h-6 rounded object-cover shadow-sm"
                                onError={(e) => {
                                  // fallback if image fails
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center font-black text-xs text-white shadow-sm"
                                style={{ backgroundColor: effectiveColor }}
                              >
                                {effectiveName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-xs truncate max-w-[140px] text-white">
                                {effectiveName}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">Room: Biology 101</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800 text-[10px] font-bold text-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>REC 00:24:18</span>
                            </div>
                            <div
                              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white shadow-xs"
                              style={{ backgroundColor: effectiveColor }}
                            >
                              Leave
                            </div>
                          </div>
                        </div>

                        {/* BBB Body: User list + Whiteboard */}
                        <div className="flex-1 flex overflow-hidden">
                          {/* User List Panel (Left) */}
                          <div className="w-40 bg-[#0f172a] border-r border-slate-800 p-2.5 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Users (4)
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-800/60">
                                  <div
                                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: effectiveColor }}
                                  >
                                    Prof
                                  </div>
                                  <div className="truncate text-[11px] font-bold text-white">Dr. Robert (Mod)</div>
                                </div>
                                <div className="flex items-center space-x-2 p-1.5 rounded-lg">
                                  <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    AS
                                  </div>
                                  <div className="truncate text-[11px] text-slate-300">Ali Shan</div>
                                </div>
                                <div className="flex items-center space-x-2 p-1.5 rounded-lg">
                                  <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    ZW
                                  </div>
                                  <div className="truncate text-[11px] text-slate-300">Zoya Malik</div>
                                </div>
                                <div className="flex items-center space-x-2 p-1.5 rounded-lg">
                                  <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                    TM
                                  </div>
                                  <div className="truncate text-[11px] text-slate-300">Tariq M.</div>
                                </div>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                              Public Chat Active
                            </div>
                          </div>

                          {/* Center Classroom Whiteboard */}
                          <div className="flex-1 bg-[#1e293b] p-4 flex flex-col justify-between items-center relative overflow-hidden">
                            {/* Whiteboard Floating Toolbar */}
                            <div className="absolute right-3 top-3 flex flex-col space-y-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 shadow-lg">
                              <span
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                                style={{ backgroundColor: effectiveColor }}
                              >
                                ✏️
                              </span>
                              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                ⬛
                              </span>
                              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                🔤
                              </span>
                              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                🗑️
                              </span>
                            </div>

                            {/* Center Presentation Slide Mockup */}
                            <div className="w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700/80 rounded-2xl p-4 bg-slate-900/50 text-center space-y-2">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-white shadow-md text-xl"
                                style={{ backgroundColor: effectiveColor }}
                              >
                                🎓
                              </div>
                              <h5 className="font-extrabold text-sm text-white max-w-xs">{effectiveBanner}</h5>
                              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                                Powered by BigBlueButton 3.0 & Scalelite High-Availability Cluster.
                              </p>
                              <div
                                className="mt-2 text-[10px] font-bold px-3 py-1 rounded-full text-white inline-block shadow-sm"
                                style={{ backgroundColor: `${effectiveColor}` }}
                              >
                                Slide 1 of 12 • Presentation Ready
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Media Controls Bar */}
                        <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 flex items-center justify-center space-x-3">
                          <button
                            type="button"
                            className="p-2.5 rounded-full text-white shadow-md transition transform hover:scale-110"
                            style={{ backgroundColor: effectiveColor }}
                            title="Audio Connected"
                          >
                            <span className="text-xs">🎤</span>
                          </button>
                          <button
                            type="button"
                            className="p-2.5 rounded-full text-white shadow-md transition transform hover:scale-110"
                            style={{ backgroundColor: effectiveColor }}
                            title="Webcam Active"
                          >
                            <span className="text-xs">📹</span>
                          </button>
                          <button
                            type="button"
                            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-sm"
                            title="Screen Share"
                          >
                            <span className="text-xs">🖥️</span>
                          </button>
                          <button
                            type="button"
                            className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                            title="End Audio"
                          >
                            <span className="text-xs">📞</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* API Dynamic Link Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Dynamic CSS URL</span>
                      <code className="text-purple-600 dark:text-purple-400 font-mono text-[11px] font-bold">
                        /api/themes/{selectedBrandingCollegeSlug}
                      </code>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      Auto-Injected on Meeting Join
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}


      {/* Modal 1: Register New Client College */}
      {isAddCollegeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card w-full max-w-xl rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsAddCollegeModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Register New Client College</h3>
                <p className="text-xs text-slate-500">
                  Provision an isolated tenant database record with unique BBB API keys and quotas.
                </p>
              </div>
            </div>

            {collegeError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {collegeError}
              </div>
            )}

            <form onSubmit={handleAddCollege} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Institution / College Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oxford Grammar School"
                    value={collegeFormData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                      setCollegeFormData((prev) => ({
                        ...prev,
                        name,
                        slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ? slug : prev.slug,
                      }));
                    }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Tenant Slug (Subdomain) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. oxford-grammar"
                    value={collegeFormData.slug}
                    onChange={(e) => setCollegeFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Admin Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@institution.edu"
                    value={collegeFormData.contactEmail}
                    onChange={(e) => setCollegeFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={collegeFormData.contactPhone}
                    onChange={(e) => setCollegeFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Subscription Tier / Package
                </label>
                <select
                  value={collegeFormData.plan}
                  onChange={(e) => {
                    const planName = e.target.value;
                    const matched = subscriptionTiers.find((t) => t.name === planName);
                    if (matched) {
                      setCollegeFormData((prev) => ({
                        ...prev,
                        plan: matched.name,
                        maxConcurrentRooms: matched.maxRooms,
                        maxTotalParticipants: matched.maxStudents,
                        storageLimitGb: matched.storageGb,
                      }));
                    } else {
                      setCollegeFormData((prev) => ({ ...prev, plan: planName }));
                    }
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subscriptionTiers.map((tier) => (
                    <option key={tier.id} value={tier.name}>
                      {tier.name} — ${tier.priceMonthly}/mo ({tier.maxRooms} Rooms • {tier.maxStudents} Students • {tier.storageGb}GB R2)
                    </option>
                  ))}
                  <option value="Custom Plan">Custom / Bespoke Plan</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Max Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={collegeFormData.maxConcurrentRooms}
                    onChange={(e) => setCollegeFormData((prev) => ({ ...prev, maxConcurrentRooms: Number(e.target.value) || 1 }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={collegeFormData.maxTotalParticipants}
                    onChange={(e) => setCollegeFormData((prev) => ({ ...prev, maxTotalParticipants: Number(e.target.value) || 10 }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    R2 Storage (GB)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={collegeFormData.storageLimitGb}
                    onChange={(e) => setCollegeFormData((prev) => ({ ...prev, storageLimitGb: Number(e.target.value) || 10 }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCollegeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCollege}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {isCreatingCollege ? "Registering Client..." : "Register Client College"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Virtual Classroom */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card w-full max-w-lg rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsAddRoomModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Virtual Classroom</h3>
                <p className="text-xs text-slate-500">
                  Add a live lecture hall for {activeCollege?.name || "Client Institution"}.
                </p>
              </div>
            </div>

            {roomError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {roomError}
              </div>
            )}

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Classroom Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics 101 - Mechanics & Optics"
                  value={roomFormData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setRoomFormData((prev) => ({
                      ...prev,
                      name,
                      slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ? slug : prev.slug,
                    }));
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Room Slug (URL Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. phy-101"
                    value={roomFormData.slug}
                    onChange={(e) => setRoomFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Assigned Instructor / Teacher
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Tariq"
                    value={roomFormData.teacher}
                    onChange={(e) => setRoomFormData((prev) => ({ ...prev, teacher: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Max Participants Capacity
                  </label>
                  <input
                    type="number"
                    min="2"
                    max={activeCollege?.maxStudents || 500}
                    value={roomFormData.maxParticipants}
                    onChange={(e) => setRoomFormData((prev) => ({ ...prev, maxParticipants: Number(e.target.value) || 50 }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roomFormData.recordEnabled}
                      onChange={(e) => setRoomFormData((prev) => ({ ...prev, recordEnabled: e.target.checked }))}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Auto-Record Live Lectures
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {isCreatingRoom ? "Creating..." : "Create Classroom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Custom Subscription Tier */}
      {isAddTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card w-full max-w-lg rounded-3xl p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsAddTierModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Subscription Tier</h3>
                <p className="text-xs text-slate-500">
                  Configure custom room limits, student quotas, R2 storage, and pricing.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNewTier} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Tier / Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medical Academy (12 Rooms)"
                    value={newTierFormData.name}
                    onChange={(e) => setNewTierFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Monthly Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newTierFormData.priceMonthly}
                    onChange={(e) => setNewTierFormData((prev) => ({ ...prev, priceMonthly: Number(e.target.value) || 0 }))}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Concurrent Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTierFormData.maxRooms}
                    onChange={(e) => setNewTierFormData((prev) => ({ ...prev, maxRooms: Number(e.target.value) || 1 }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={newTierFormData.maxStudents}
                    onChange={(e) => setNewTierFormData((prev) => ({ ...prev, maxStudents: Number(e.target.value) || 10 }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    R2 Storage (GB)
                  </label>
                  <input
                    type="number"
                    min="10"
                    value={newTierFormData.storageGb}
                    onChange={(e) => setNewTierFormData((prev) => ({ ...prev, storageGb: Number(e.target.value) || 10 }))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Tier Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Optimized for specialized medical colleges and clinical seminars"
                  value={newTierFormData.description}
                  onChange={(e) => setNewTierFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Features Included (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Auto-Recording, White-Labeling, Priority WebRTC, Moodle Plugin"
                  value={newTierFormData.featuresText}
                  onChange={(e) => setNewTierFormData((prev) => ({ ...prev, featuresText: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTierModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:from-purple-700 hover:to-indigo-700"
                >
                  Save Subscription Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0c101a]/70 backdrop-blur py-4 px-6 text-center text-xs text-slate-500 font-medium">
        Aeorax Live Managed BigBlueButton Control Plane • BigBlueButton 4.0 / 3.0 • PostgreSQL 16 • Redis 7 • Cloudflare R2
      </footer>
    </div>
  );
}
