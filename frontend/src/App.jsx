import { Download } from "lucide-react";
import { downloadReport } from "./utils/downloadReport";
import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  ScanSearch,
  History,
  LogOut,
  Menu,
  X,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
  FileText,
  BrainCircuit,
  Lightbulb,
  ChevronRight,
  Clock,
  Server,
  User,
  ArrowLeft
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("sentinelai_token") || ""
  );
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [report, setReport] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);


  // sentinel-dashboard-v2
  const overviewMetrics = (() => {
    const now = new Date();

    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (6 - index)
      );

      return {
        key: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0
      };
    });

    let critical = 0;
    let errors = 0;
    let warnings = 0;

    for (const incident of incidents) {
      const text = String(incident.logs || "");

      if (/\bCRITICAL\b|\bFATAL\b/i.test(text)) critical++;
      if (/\bERROR\b|\bException\b/i.test(text)) errors++;
      if (/\bWARN(?:ING)?\b/i.test(text)) warnings++;

      if (incident.created_at) {
        const date = new Date(incident.created_at);

        if (!Number.isNaN(date.getTime())) {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

          const item = days.find(d => d.key === key);
          if (item) item.count++;
        }
      }
    }

    return { critical, errors, warnings, days };
  })();

  const recentFiltered = incidents
    .filter(incident =>
      `Incident #${incident.id} ${incident.logs || ""}`
        .toLowerCase()
        .includes(overviewSearch.trim().toLowerCase())
    )
    .slice(0, 5);

  const logout = useCallback(() => {
    sessionStorage.removeItem("sentinelai_token");
    setToken("");
    setUser(null);
    setIncidents([]);
    setReport(null);
    setSelectedIncident(null);
    setActivePage("overview");
    setSidebarOpen(false);
  }, []);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers
        }
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Request failed. Please try again."
        );
      }

      return data;
    },
    [token, logout]
  );

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setCheckingAuth(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    apiRequest("/incidents")
      .then((data) => {
        if (!cancelled) setIncidents(data.incidents || []);
      })
      .catch((error) => {
        if (!cancelled) setHistoryError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [token, apiRequest]);


  // sentinel-dashboard-v3
  const refreshOverview = async () => {
    setOverviewRefreshing(true);
    setHistoryError("");

    try {
      const data = await apiRequest("/incidents");
      setIncidents(data.incidents || []);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setOverviewRefreshing(false);
    }
  };

  const incidentSeverity = (logs) => {
    const text = String(logs || "");

    if (/\b(CRITICAL|FATAL)\b/i.test(text)) return "Critical";
    if (/\bERROR\b|Exception/i.test(text)) return "Error";
    if (/\bWARN(ING)?\b/i.test(text)) return "Warning";

    return "Other";
  };

  const severityDistribution = [
    { label: "Critical", color: "#ef4444" },
    { label: "Error", color: "#f97316" },
    { label: "Warning", color: "#facc15" },
    { label: "Other", color: "#38bdf8" }
  ].map(item => ({
    ...item,
    count: incidents.filter(
      incident => incidentSeverity(incident.logs) === item.label
    ).length
  }));

  const donutGradient = (() => {
    if (!incidents.length) return "#1e293b";

    let position = 0;

    return `conic-gradient(${severityDistribution.map(item => {
      const start = position;
      position += (item.count / incidents.length) * 100;
      return `${item.color} ${start}% ${position}%`;
    }).join(", ")})`;
  })();

  const loadIncidents = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await apiRequest("/incidents");
      setIncidents(data.incidents || []);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";

      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Please check your details."
        );
      }

      if (isLogin) {
        sessionStorage.setItem("sentinelai_token", data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        setCheckingAuth(false);
        setForm({ name: "", email: "", password: "" });
      } else {
        setIsLogin(true);
        setAuthSuccess("Account created! Please sign in.");
        setForm({
          name: "",
          email: form.email,
          password: ""
        });
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const analyzeLogs = async (event) => {
    event.preventDefault();

    if (!logs.trim()) {
      setAnalyzeError("Please enter production logs.");
      return;
    }

    setAnalyzing(true);
    setAnalyzeError("");
    setReport(null);

    try {
      const data = await apiRequest("/analyze", {
        method: "POST",
        body: JSON.stringify({ logs: logs.trim() })
      });

      setReport(data);
      setActivePage("report");
      await loadIncidents();
    } catch (error) {
      setAnalyzeError(error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const openIncident = async (id) => {
    setDetailLoading(true);
    setHistoryError("");
    setSelectedIncident(null);
    setActivePage("details");
    setSidebarOpen(false);

    try {
      const data = await apiRequest(`/incidents/${id}`);
      setSelectedIncident(data);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const formatDate = (value) => {
    if (!value) return "Unknown date";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  };

  const MarkdownSection = ({ title, icon: Icon, content }) => (
    <section className="report-section">
      <div className="section-heading">
        <Icon size={21} />
        <h3>{title}</h3>
      </div>
      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content || "No information available."}
        </ReactMarkdown>
      </div>
    </section>
  );

  const ReportView = ({ data, isSaved }) => (
    <div className="report-content">
      <button
        type="button"
        className="secondary-button"
        style={{ alignSelf: "flex-start" }}
        onClick={() => downloadReport(data)}
      >
        Download PDF Report
      </button>
      <div className="report-banner">
        <div className="report-banner-icon">
          <CheckCircle2 size={26} />
        </div>
        <div>
          <h3>Investigation Report</h3>
          <p>
            {isSaved
              ? `Saved incident #${data.id}`
              : `Analysis complete — Incident #${data.incident_id}`}
          </p>
        </div>
      </div>

      {data.logs && (
        <section className="report-section">
          <div className="section-heading">
            <FileText size={21} />
            <h3>Original Logs</h3>
          </div>
          <pre className="logs-preview">{data.logs}</pre>
        </section>
      )}

      <MarkdownSection
        title="Log Analysis"
        icon={ScanSearch}
        content={data.log_analysis}
      />

      <MarkdownSection
        title="Root Cause Analysis"
        icon={BrainCircuit}
        content={data.root_cause}
      />

      <MarkdownSection
        title="Recommended Solutions"
        icon={Lightbulb}
        content={data.solution}
      />

      {Array.isArray(data.rag_sources) &&
        data.rag_sources.length > 0 && (
          <section className="report-section">
            <div className="section-heading">
              <FileText size={21} />
              <h3>Knowledge Base References</h3>
            </div>

            <div className="markdown-content">
              <p>
                Technical documentation retrieved by
                SentinelAI during this investigation:
              </p>

              <ul>
                {data.rag_sources.map((source, index) => (
                  <li key={`${source}-${index}`}>
                    <strong>{source}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
    </div>
  );

  if (checkingAuth && token && !user) {
    return (
      <div className="auth-page">
        <LoaderCircle className="spin" size={36} />
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand">
            <ShieldCheck size={38} />
            <h1>SentinelAI</h1>
          </div>

          <p className="subtitle">
            AI-Powered Production Incident Investigation
          </p>

          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>

          <p className="description">
            {isLogin
              ? "Sign in to access your investigation dashboard."
              : "Create your account to start investigating incidents."}
          </p>

          {authError && (
            <div className="message error-message">{authError}</div>
          )}

          {authSuccess && (
            <div className="message success-message">{authSuccess}</div>
          )}

          <form onSubmit={handleAuth}>
            {!isLogin && (
              <div className="input-group">
                <User size={19} />
                <input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <User size={19} />
              <input
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div className="input-group">
              <ShieldCheck size={19} />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                minLength={isLogin ? undefined : 8}
                required
              />
            </div>

            <button
              className="auth-button"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
              <ArrowRight size={19} />
            </button>
          </form>

          <p className="switch-auth">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError("");
                setAuthSuccess("");
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <ShieldCheck size={31} />
          <span>SentinelAI</span>
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="nav-menu">
          <button
            className={activePage === "overview" ? "active" : ""}
            onClick={() => navigate("overview")}
          >
            <LayoutDashboard size={19} />
            Overview
          </button>

          <button
            className={activePage === "analyze" ? "active" : ""}
            onClick={() => navigate("analyze")}
          >
            <ScanSearch size={19} />
            AI Log Analyzer
          </button>

          <button
            className={activePage === "history" ? "active" : ""}
            onClick={() => {
              navigate("history");
              loadIncidents();
            }}
          >
            <History size={19} />
            Incident History
          </button>

          {report && (
            <button
              className={activePage === "report" ? "active" : ""}
              onClick={() => navigate("report")}
            >
              <FileText size={19} />
              Latest Report
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={23} />
          </button>

          <div className="breadcrumb">
            <ShieldCheck size={19} />
            <span>Workspace</span>
            <ChevronRight size={16} />
            <strong>
              {activePage === "overview" && "Overview"}
              {activePage === "analyze" && "AI Log Analyzer"}
              {activePage === "history" && "Incident History"}
              {activePage === "report" && "Investigation Report"}
              {activePage === "details" && "Incident Details"}
            </strong>
          </div>

          <div className="system-status">
            <span className="status-dot" />
            AI System Ready
          </div>
        </header>

        <div className="page-container">
          {activePage === "overview" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">SENTINELAI WORKSPACE</p>
                  <h1>Welcome back, {user.name?.split(" ")[0]} 👋</h1>
                  <p>
                    Monitor incidents and investigate production
                    issues using AI.
                  </p>
                </div>
                <div className="v3-heading-actions">
                  <button
                    className="secondary-button"
                    onClick={refreshOverview}
                    disabled={overviewRefreshing}
                  >
                    <RefreshCw
                      size={17}
                      className={overviewRefreshing ? "spin" : ""}
                    />
                    Refresh
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => navigate("analyze")}
                  >
                    <ScanSearch size={18} />
                    New Investigation
                  </button>
                </div>
              </div>


              <div className="stats-grid dashboard-v2-stats">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <Activity size={23} />
                  </div>
                  <span>Total Investigations</span>
                  <strong>{incidents.length}</strong>
                  <small>Saved in your workspace</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon red">
                    <AlertTriangle size={23} />
                  </div>
                  <span>Critical Log Incidents</span>
                  <strong>{overviewMetrics.critical}</strong>
                  <small>Logs containing CRITICAL or FATAL</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    <ScanSearch size={23} />
                  </div>
                  <span>Error Log Incidents</span>
                  <strong>{overviewMetrics.errors}</strong>
                  <small>Logs containing ERROR or Exception</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon amber">
                    <AlertTriangle size={23} />
                  </div>
                  <span>Warning Log Incidents</span>
                  <strong>{overviewMetrics.warnings}</strong>
                  <small>Logs containing WARN or WARNING</small>
                </div>
              </div>

              <div className="panel dashboard-v2-trend">
                <div className="panel-heading">
                  <h2>Investigation Activity</h2>
                  <span className="dashboard-v2-caption">
                    Last 7 days · Saved investigations
                  </span>
                </div>

                <div className="dashboard-v2-chart">
                  {overviewMetrics.days.map(day => (
                    <div className="dashboard-v2-day" key={day.key}>
                      <span className="dashboard-v2-count">
                        {day.count}
                      </span>

                      <div className="dashboard-v2-track">
                        <div
                          className="dashboard-v2-bar"
                          style={{
                            height: `${
                              day.count === 0
                                ? 0
                                : Math.max(
                                    9,
                                    (day.count /
                                      Math.max(
                                        1,
                                        ...overviewMetrics.days.map(d => d.count)
                                      )) * 100
                                  )
                            }%`
                          }}
                        />
                      </div>

                      <span className="dashboard-v2-caption">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>


              <div className="v3-analytics-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <h2>Severity Distribution</h2>
                    <span className="dashboard-v2-caption">
                      Highest log severity per incident
                    </span>
                  </div>

                  <div className="v3-severity-layout">
                    <div
                      className="v3-donut"
                      style={{ background: donutGradient }}
                    >
                      <div className="v3-donut-center">
                        <strong>{incidents.length}</strong>
                        <small>Incidents</small>
                      </div>
                    </div>

                    <div className="v3-legend">
                      {severityDistribution.map(item => (
                        <div className="v3-legend-row" key={item.label}>
                          <span
                            className="v3-legend-dot"
                            style={{ background: item.color }}
                          />
                          <span>{item.label}</span>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <h2>AI Investigation Pipeline</h2>
                    <span className="small-badge">3 AI Agents</span>
                  </div>

                  <div className="v3-pipeline">
                    <div className="v3-agent">
                      <div className="v3-agent-icon">01</div>
                      <div>
                        <strong>Log Analyzer</strong>
                        <p>Extracts errors, warnings and patterns</p>
                      </div>
                    </div>

                    <div className="v3-pipeline-line" />

                    <div className="v3-agent">
                      <div className="v3-agent-icon">02</div>
                      <div>
                        <strong>Root Cause Analyzer</strong>
                        <p>Investigates potential causes using RAG</p>
                      </div>
                    </div>

                    <div className="v3-pipeline-line" />

                    <div className="v3-agent">
                      <div className="v3-agent-icon">03</div>
                      <div>
                        <strong>Solution Recommender</strong>
                        <p>Suggests fixes and prevention steps</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <h2>Recent Investigations</h2>
                    <button
                      className="text-button"
                      onClick={() => {
                        navigate("history");
                        loadIncidents();
                      }}
                    >
                      View all <ArrowRight size={16} />
                    </button>
                  </div>

                  {historyError && (
                    <p className="error-text">{historyError}</p>
                  )}


                  <input
                    className="dashboard-v2-search"
                    type="search"
                    placeholder="Search incident ID or production logs..."
                    value={overviewSearch}
                    onChange={event => setOverviewSearch(event.target.value)}
                  />

                  {incidents.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={35} />
                      <h3>No investigations yet</h3>
                      <p>Start your first AI investigation.</p>
                      <button
                        className="secondary-button"
                        onClick={() => navigate("analyze")}
                      >
                        Start Investigation
                      </button>
                    </div>
                  ) : recentFiltered.length === 0 ? (
                    <p className="dashboard-v2-caption">
                      No matching incidents found.
                    </p>
                  ) : (
                    <div className="v3-table-wrap">
                      <table className="v3-table">
                        <thead>
                          <tr>
                            <th>Incident</th>
                            <th>Severity</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentFiltered.map(incident => {
                            const severity = incidentSeverity(incident.logs);

                            return (
                              <tr key={incident.id}>
                                <td>
                                  <strong>#{incident.id}</strong>
                                  <small className="v3-log-preview">
                                    {String(incident.logs || "").slice(0, 65)}
                                  </small>
                                </td>
                                <td>
                                  <span className={
                                    "v3-severity " + severity.toLowerCase()
                                  }>
                                    {severity}
                                  </span>
                                </td>
                                <td>{formatDate(incident.created_at)}</td>
                                <td>
                                  <button
                                    className="v3-view"
                                    onClick={() => openIncident(incident.id)}
                                  >
                                    View <ArrowRight size={14} />
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

                <div className="panel quick-panel">
                  <div className="panel-heading">
                    <h2>Quick Actions</h2>
                  </div>

                  <button
                    className="quick-action"
                    onClick={() => navigate("analyze")}
                  >
                    <ScanSearch size={23} />
                    <div>
                      <strong>Analyze Production Logs</strong>
                      <p>Find errors and root causes with AI.</p>
                    </div>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    className="quick-action"
                    onClick={() => {
                      navigate("history");
                      loadIncidents();
                    }}
                  >
                    <History size={23} />
                    <div>
                      <strong>Browse Incident History</strong>
                      <p>Review previous AI investigations.</p>
                    </div>
                    <ArrowRight size={18} />
                  </button>

                  <div className="technology-card">
                    <Server size={22} />
                    <div>
                      <strong>Powered by AI</strong>
                      <p>
                        Groq · LangGraph · RAG · ChromaDB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activePage === "analyze" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">AI INVESTIGATION</p>
                  <h1>AI Log Analyzer</h1>
                  <p>
                    Paste production logs and let AI investigate
                    the root cause.
                  </p>
                </div>
              </div>

              <div className="panel analyzer-panel">
                <div className="panel-heading">
                  <h2>Production Logs</h2>
                  <span className="small-badge">AI Powered</span>
                </div>

                <form onSubmit={analyzeLogs}>
                  <textarea
                    className="logs-input"
                    value={logs}
                    onChange={(e) => setLogs(e.target.value)}
                    placeholder={
                      "Paste your production logs here...\n\n" +
                      "ERROR Database connection timeout\n" +
                      "WARNING Connection pool exhausted\n" +
                      "ERROR API /orders returned HTTP 500"
                    }
                    rows={13}
                    required
                  />

                  <div className="analyzer-footer">
                    <span>{logs.length} characters</span>
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={analyzing || !logs.trim()}
                    >
                      {analyzing ? (
                        <>
                          <LoaderCircle size={18} className="spin" />
                          AI Investigating...
                        </>
                      ) : (
                        <>
                          <BrainCircuit size={18} />
                          Analyze Incident
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {analyzeError && (
                  <div className="message error-message">
                    {analyzeError}
                  </div>
                )}
              </div>

              <div className="info-panel">
                <Lightbulb size={21} />
                <p>
                  SentinelAI uses three AI agents to analyze logs,
                  identify the root cause and recommend solutions.
                  Investigations are saved to your account.
                </p>
              </div>
            </>
          )}

          {activePage === "report" && report && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">AI INVESTIGATION RESULT</p>
                  <h1>Analysis Complete</h1>
                  <p>
                    Your incident has been investigated and saved.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => navigate("analyze")}
                >
                  <ScanSearch size={18} />
                  New Analysis
                </button>
              </div>
              <ReportView data={report} isSaved={false} />
            </>
          )}

          {activePage === "history" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE</p>
                  <h1>Incident History</h1>
                  <p>
                    Review your saved AI investigations.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={loadIncidents}
                  disabled={historyLoading}
                >
                  <RefreshCw
                    size={17}
                    className={historyLoading ? "spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <h2>All Investigations</h2>
                  <span className="small-badge">
                    {incidents.length} total
                  </span>
                </div>

                {historyError && (
                  <p className="error-text">{historyError}</p>
                )}

                {historyLoading ? (
                  <div className="empty-state">
                    <LoaderCircle size={32} className="spin" />
                    <p>Loading investigations...</p>
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="empty-state">
                    <History size={36} />
                    <h3>No saved incidents</h3>
                    <p>
                      Your AI investigations will appear here.
                    </p>
                    <button
                      className="secondary-button"
                      onClick={() => navigate("analyze")}
                    >
                      Analyze Logs
                    </button>
                  </div>
                ) : (
                  <div className="incident-list">
                    {incidents.map((incident) => (
                      <button
                        key={incident.id}
                        className="incident-item"
                        onClick={() => openIncident(incident.id)}
                      >
                        <div className="incident-icon">
                          <AlertTriangle size={19} />
                        </div>
                        <div className="incident-info">
                          <strong>Incident #{incident.id}</strong>
                          <p>{incident.logs}</p>
                          <small>
                            <Clock size={13} />
                            {formatDate(incident.created_at)}
                          </small>
                        </div>
                        <ChevronRight size={19} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activePage === "details" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">SAVED INVESTIGATION</p>
                  <h1>Incident Details</h1>
                  <p>Complete AI investigation report.</p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => navigate("history")}
                >
                  <ArrowLeft size={17} />
                  Back to History
                </button>
              </div>

              {detailLoading ? (
                <div className="empty-state">
                  <LoaderCircle size={34} className="spin" />
                  <p>Loading incident report...</p>
                </div>
              ) : selectedIncident ? (
                <ReportView data={selectedIncident} isSaved />
              ) : (
                <div className="message error-message">
                  {historyError || "Incident not found."}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
