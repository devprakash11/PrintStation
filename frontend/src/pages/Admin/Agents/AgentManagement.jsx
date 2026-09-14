import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Copy,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { agentService } from '../../../services/agentService.js';
import '../../../styles/adminDashboard.css';
import '../../../styles/agentManagement.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'Agents', icon: Monitor, path: '/admin/agents' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('printstation_admin_session') || 'null');
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function isOnline(agent) {
  return agent.status === 'online' && agent.is_active !== false;
}

function StatusBadge({ agent }) {
  const online = isOnline(agent);
  return (
    <span className={`agent-status ${online ? 'is-online' : 'is-offline'}`}>
      <i /> {online ? 'Online' : agent.is_active === false ? 'Disabled' : 'Offline'}
    </span>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className="agent-copy-button" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function AgentManagement() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const session = useMemo(getSession, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pairing, setPairing] = useState(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingCopied, setPairingCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const loadAgents = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true); else setLoading(true);
      setError('');
      const response = await agentService.getAll();
      setAgents(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.message || 'Could not load printer agents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  useEffect(() => {
    if (!secondsLeft) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (!pairing || secondsLeft > 0) return;
    setPairing((current) => current ? { ...current, expired: true } : current);
  }, [secondsLeft, pairing]);

  const onlineCount = agents.filter(isOnline).length;
  const activeCount = agents.filter((agent) => agent.is_active !== false).length;

  async function createPairingCode() {
    try {
      setPairingLoading(true);
      setError('');
      setPairingCopied(false);
      const response = await agentService.createPairingCode();
      const data = response?.data;
      setPairing({ code: data?.code || '', expiresInSeconds: data?.expiresInSeconds || 600, expired: false });
      setSecondsLeft(data?.expiresInSeconds || 600);
    } catch (err) {
      setError(err.message || 'Could not create pairing code.');
    } finally {
      setPairingLoading(false);
    }
  }

  async function copyPairingCode() {
    if (!pairing?.code || pairing.expired) return;
    try {
      await navigator.clipboard.writeText(pairing.code);
      setPairingCopied(true);
      window.setTimeout(() => setPairingCopied(false), 1600);
    } catch {
      setPairingCopied(false);
    }
  }

  async function toggleAgent(agent) {
    try {
      const response = await agentService.update(agent.id, { isActive: !agent.is_active });
      setAgents((current) => current.map((item) => item.id === agent.id ? { ...item, ...response.data } : item));
    } catch (err) {
      setError(err.message || 'Could not update the agent.');
    }
  }

  function handleLogout() {
    logout();
    navigate('/admin');
  }

  function navigateTo(path) {
    setMobileOpen(false);
    navigate(path);
  }

  if (!session) {
    navigate('/admin', { replace: true });
    return null;
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="admin-dashboard agent-management-page">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true"><Printer size={18} /></div>
          <div className="admin-brand-copy"><strong>Admin Panel</strong><span>Management Console</span></div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <button className="admin-new-job" type="button" onClick={() => navigateTo('/print/upload')}><Plus size={19} /> New Print Job</button>
        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => { const Icon = item.icon; return <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'Agents' ? 'is-active' : ''}`} onClick={() => navigateTo(item.path)}><Icon size={20} strokeWidth={1.9} /><span>{item.label}</span></button>; })}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button" onClick={() => navigateTo('/admin/help')}><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>
      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar agent-page-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Printer Agents</h1>
            <p>Pair Windows computers with PrintStation and monitor their printer connection.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><UserRound size={17} /></span><span>{session?.name?.trim() || 'Admin'}</span></div>
          </div>
        </header>

        <section className="admin-content agent-management-content">
          {error && <div className="agent-alert" role="alert"><Activity size={17} /> <span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}

          <div className="agent-overview-grid">
            <article className="agent-stat-card"><span className="agent-stat-icon"><Monitor size={20} /></span><div><span>Registered Agents</span><strong>{agents.length}</strong></div></article>
            <article className="agent-stat-card"><span className="agent-stat-icon is-online"><Wifi size={20} /></span><div><span>Online Now</span><strong>{onlineCount}</strong></div></article>
            <article className="agent-stat-card"><span className="agent-stat-icon is-active"><ShieldCheck size={20} /></span><div><span>Active Agents</span><strong>{activeCount}</strong></div></article>
          </div>

          <section className="agent-pairing-card">
            <div className="agent-pairing-copy">
              <span className="agent-eyebrow">01 / Pair a computer</span>
              <h2>Connect a PrintStation Agent</h2>
              <p>Generate a one-time code, then enter it in the PrintStation Agent running on the Windows computer that has the printer installed.</p>
              <div className="agent-steps">
                <span><b>1</b> Generate code</span><span><b>2</b> Enter code in Agent</span><span><b>3</b> Save credentials</span>
              </div>
            </div>
            <div className="agent-pairing-action">
              {pairing ? (
                <div className={`agent-code-panel ${pairing.expired ? 'is-expired' : ''}`}>
                  <div className="agent-code-head"><span>Pairing code</span><span>{pairing.expired ? 'Expired' : `${minutes}:${seconds}`}</span></div>
                  <strong className="agent-code">{pairing.code || '------'}</strong>
                  <button type="button" className="agent-copy-code" disabled={pairing.expired} onClick={copyPairingCode}><Copy size={16} /> {pairingCopied ? 'Copied' : 'Copy code'}</button>
                  <small>{pairing.expired ? 'Generate a new code to pair another computer.' : 'Valid for 10 minutes. It can be used once.'}</small>
                </div>
              ) : (
                <div className="agent-empty-code"><KeyRound size={24} /><span>No active pairing code</span><small>Codes expire automatically after 10 minutes.</small></div>
              )}
              <button type="button" className="agent-primary-button" onClick={createPairingCode} disabled={pairingLoading}><Plus size={17} /> {pairingLoading ? 'Generating...' : pairing ? 'Generate New Code' : 'Generate Pairing Code'}</button>
            </div>
          </section>

          {pairing && !pairing.expired && (
            <section className="agent-setup-card">
              <div className="agent-setup-icon"><Monitor size={21} /></div>
              <div><strong>Next step on the Windows computer</strong><p>Open the Agent project, put the pairing code into its setup flow, and complete pairing. The backend will generate the Agent ID and Agent Secret automatically.</p></div>
              <code>POST /api/v1/agents/pair</code>
            </section>
          )}

          <section className="agent-list-card">
            <div className="agent-list-header"><div><span className="agent-eyebrow">02 / Connected computers</span><h2>Registered Agents</h2></div><button type="button" className="agent-refresh-button" onClick={() => loadAgents(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'is-spinning' : ''} /> Refresh</button></div>
            {loading ? <div className="agent-list-empty"><RefreshCw size={22} className="is-spinning" /><span>Loading agents...</span></div> : !agents.length ? <div className="agent-list-empty"><Monitor size={26} /><strong>No agents paired yet</strong><span>Generate a pairing code above to connect your first Windows computer.</span></div> : (
              <div className="agent-table-wrap"><table className="agent-table"><thead><tr><th>Agent</th><th>Platform</th><th>Status</th><th>Last seen</th><th>Registered</th><th>Access</th></tr></thead><tbody>
                {agents.map((agent) => <tr key={agent.id}><td><div className="agent-name-cell"><span className="agent-machine-icon"><Monitor size={18} /></span><div><strong>{agent.name}</strong><code>{agent.id}</code></div></div></td><td>{agent.platform || 'windows'}{agent.version ? <small className="agent-version">v{agent.version}</small> : null}</td><td><StatusBadge agent={agent} /></td><td>{formatDate(agent.last_seen_at)}</td><td>{formatDate(agent.registered_at)}</td><td><button type="button" className={`agent-access-button ${agent.is_active === false ? 'is-disabled' : ''}`} onClick={() => toggleAgent(agent)}>{agent.is_active === false ? 'Enable' : 'Disable'}</button></td></tr>)}
              </tbody></table></div>
            )}
          </section>

          <section className="agent-security-note"><ShieldCheck size={18} /><div><strong>Credential security</strong><p>The Agent Secret is generated by the backend and stored hashed. It is returned only during pairing, so keep the value in the Agent's local <code>.env</code> and never commit it to Git.</p></div></section>
        </section>
      </main>
    </div>
  );
}
