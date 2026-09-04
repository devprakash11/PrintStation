import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  QrCode,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { reportService } from '../../../services/reportService.js';
import '../../../styles/adminDashboard.css';
import '../../../styles/reports.css';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

function StatCard({ icon: Icon, label, value, detail, tone = 'accent' }) {
  return (
    <article className="reports-stat-card">
      <span className={`reports-stat-icon is-${tone}`}><Icon size={19} /></span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

export default function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError('');
        const response = await reportService.getOverview();
        if (!active) return;
        setOverview(response?.data ?? null);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load reports.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReport();
    return () => { active = false; };
  }, []);

  const jobs = overview?.printJobs ?? {};
  const printers = overview?.printers ?? {};
  const users = overview?.users ?? {};
  const qrCodes = overview?.qrCodes ?? {};

  const totalJobs = Number(jobs.total) || 0;
  const completedJobs = Number(jobs.completed) || 0;
  const failedJobs = Number(jobs.failed) || 0;
  const activeJobs = Number(jobs.active) || 0;
  const successRate = totalJobs ? Math.round((completedJobs / totalJobs) * 100) : 0;

  const statusMix = useMemo(() => [
    { label: 'Completed', value: completedJobs, className: '' },
    { label: 'Active', value: activeJobs, className: 'is-bw' },
    { label: 'Failed', value: failedJobs, className: 'is-a3' },
  ].map((item) => ({ ...item, percentage: totalJobs ? Math.round((item.value / totalJobs) * 100) : 0 })), [completedJobs, activeJobs, failedJobs, totalJobs]);

  const displayName = user?.name?.trim() || 'Admin';

  const handleNavigation = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="admin-dashboard reports-page">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true"><Printer size={18} /></div>
          <div className="admin-brand-copy"><strong>Admin Panel</strong><span>Management Console</span></div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button className="admin-new-job" type="button" onClick={() => handleNavigation('/print/upload')}><FileText size={18} />New Print Job</button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'Reports' ? 'is-active' : ''}`} onClick={() => handleNavigation(item.path)}>
                <Icon size={20} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button" onClick={() => handleNavigation('/admin/help')}><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar reports-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Reports</h1>
            <p>Monitor print activity and system performance.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><Users size={17} /></span><span>{displayName}</span></div>
          </div>
        </header>

        <section className="admin-content reports-content" aria-label="PrintStation reports">
          {error && <div className="admin-dashboard-error" role="alert"><CircleAlert size={16} />{error}</div>}

          <div className="reports-toolbar">
            <div>
              <span className="reports-eyebrow">SYSTEM ANALYTICS</span>
              <h2>Print activity overview</h2>
              <p>Live figures from the PrintStation API.</p>
            </div>
          </div>

          <div className="reports-stat-grid">
            <StatCard icon={FileText} tone="accent" label="Total Print Jobs" value={loading ? '—' : formatNumber(totalJobs)} detail={`${formatNumber(activeJobs)} active`} />
            <StatCard icon={CheckCircle2} tone="green" label="Completed Jobs" value={loading ? '—' : formatNumber(completedJobs)} detail={`${successRate}% completion rate`} />
            <StatCard icon={CircleAlert} tone="red" label="Failed Jobs" value={loading ? '—' : formatNumber(failedJobs)} detail={failedJobs ? 'Requires attention' : 'No failed jobs'} />
            <StatCard icon={Printer} tone="blue" label="Online Printers" value={loading ? '—' : `${formatNumber(printers.online)} / ${formatNumber(printers.total)}`} detail={`${formatNumber(users.total)} active users`} />
          </div>

          <div className="reports-grid">
            <section className="reports-card">
              <header className="reports-card-header">
                <div><h2>Job Status</h2><span>Current distribution of print jobs</span></div>
                <span className="reports-card-badge">{formatNumber(totalJobs)} total</span>
              </header>
              <div className="reports-mix-list">
                {statusMix.map((item) => (
                  <div key={item.label}>
                    <span><i className={item.className} />{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                    <em><b style={{ width: `${item.percentage}%` }} /></em>
                  </div>
                ))}
                {!totalJobs && <div className="reports-empty">No print-job data is available yet.</div>}
              </div>
            </section>

            <section className="reports-card">
              <header className="reports-card-header">
                <div><h2>System Summary</h2><span>Current resource counts</span></div>
              </header>
              <div className="reports-mix-list">
                <div><span><i />Active Users</span><strong>{formatNumber(users.total)}</strong><em><b style={{ width: '100%' }} /></em></div>
                <div><span><i className="is-a4" />Active QR Codes</span><strong>{formatNumber(qrCodes.total)}</strong><em><b style={{ width: '100%' }} /></em></div>
                <div><span><i className="is-a3" />Printers</span><strong>{formatNumber(printers.total)}</strong><em><b style={{ width: printers.total ? `${Math.round((Number(printers.online || 0) / Number(printers.total)) * 100)}%` : '0%' }} /></em></div>
              </div>
            </section>
          </div>

          <div className="reports-note"><BarChart3 size={15} /><span>Reports are generated from live database records; no demo or localStorage data is used.</span></div>
        </section>
      </main>
    </div>
  );
}
