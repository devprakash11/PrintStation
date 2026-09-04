import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  QrCode,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { printJobService } from '../../../services/printJobService.js';
import { reportService } from '../../../services/reportService.js';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const STATUS_TYPE = {
  completed: 'success',
  processing: 'warning',
  queued: 'neutral',
  failed: 'danger',
  cancelled: 'danger',
};

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon: Icon, tone, label, value, trend }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-top">
        <span className={`admin-stat-icon is-${tone}`}><Icon size={21} /></span>
        {trend != null && <span className="admin-stat-trend is-positive"><TrendingUp size={14} /> {trend}</span>}
      </div>
      <span className="admin-stat-label">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('Last 7 Days');
  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');
        const [overviewResponse, jobsResponse] = await Promise.all([
          reportService.getOverview(),
          printJobService.getAll(),
        ]);
        if (!active) return;
        setOverview(overviewResponse?.data ?? null);
        setJobs(Array.isArray(jobsResponse?.data) ? jobsResponse.data.slice(0, 5) : []);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  const displayName = useMemo(() => user?.name?.trim() || 'Admin', [user]);
  const totalPrinters = overview?.printers?.total ?? 0;
  const onlinePrinters = overview?.printers?.online ?? 0;
  const offlinePrinters = Math.max(0, totalPrinters - onlinePrinters);
  const printJobsToday = overview?.printJobs?.total ?? 0;

  const handleLogout = async () => {
    await logout();
    navigate('/admin', { replace: true });
  };

  const handleNavigation = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true"><Printer size={18} /></div>
          <div className="admin-brand-copy"><strong>Admin Panel</strong><span>Management Console</span></div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button className="admin-new-job" type="button" onClick={() => handleNavigation('/print/upload')}><Plus size={19} />New Print Job</button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'Dashboard' ? 'is-active' : ''}`} onClick={() => handleNavigation(item.path)}><Icon size={20} strokeWidth={1.9} /><span>{item.label}</span></button>;
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button" onClick={() => handleNavigation('/admin/help')}><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Dashboard</h1>
            <p>Monitor printers, print jobs, and system activity.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><UserRound size={17} /></span><span>{displayName}</span></div>
            <label className="admin-date-filter"><CalendarDays size={19} /><select value={range} onChange={(event) => setRange(event.target.value)}><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option></select></label>
          </div>
        </header>

        <section className="admin-content" aria-label="Dashboard overview">
          {error && <div className="admin-dashboard-error" role="alert"><CircleAlert size={16} />{error}</div>}

          <div className="admin-stat-grid">
            <StatCard icon={Printer} tone="blue" label="Total Printers" value={loading ? '—' : totalPrinters} />
            <StatCard icon={CheckCircle2} tone="green" label="Online" value={loading ? '—' : onlinePrinters} />
            <StatCard icon={CircleAlert} tone="red" label="Offline" value={loading ? '—' : offlinePrinters} />
            <StatCard icon={FileText} tone="indigo" label="Print Jobs" value={loading ? '—' : printJobsToday} />
          </div>

          <section className="admin-activity-card">
            <div className="admin-section-header"><div><h2>Recent Activity</h2><span>Latest printer and print-job activity</span></div><button type="button" onClick={() => handleNavigation('/admin/print-jobs')}>View All <ChevronRight size={17} /></button></div>
            <div className="admin-activity-table-wrap">
              <table className="admin-activity-table">
                <thead><tr><th>Status</th><th>Printer</th><th>Document / Job</th><th>Time</th><th aria-label="Action" /></tr></thead>
                <tbody>
                  {!loading && jobs.length === 0 && <tr><td colSpan="5" className="admin-table-empty">No print jobs have been created yet.</td></tr>}
                  {jobs.map((job) => <tr key={job.id}><td><span className={`admin-status is-${STATUS_TYPE[job.status] || 'neutral'}`}><i />{job.status}</span></td><td>{job.printer_name || 'Unassigned'}</td><td className="admin-document-name">{job.file_count ? `${job.file_count} file${job.file_count > 1 ? 's' : ''}` : `Job ${job.id?.slice(0, 8)}`}</td><td>{formatTime(job.created_at)}</td><td><button className="admin-row-action" type="button" onClick={() => handleNavigation('/admin/print-jobs')} aria-label="Open print jobs"><ChevronRight size={17} /></button></td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="admin-activity-mobile-list">
              {!loading && jobs.length === 0 && <div className="admin-table-empty">No print jobs have been created yet.</div>}
              {jobs.map((job) => <article key={`mobile-${job.id}`}><div><span className={`admin-status is-${STATUS_TYPE[job.status] || 'neutral'}`}><i />{job.status}</span><strong>{job.printer_name || 'Unassigned printer'}</strong><span>{job.file_count || 0} file(s) · {formatTime(job.created_at)}</span></div><ChevronRight size={18} /></article>)}
            </div>
          </section>

          <div className="admin-dashboard-note"><Clock3 size={16} /><span>Dashboard statistics are loaded from the PrintStation API.</span></div>
        </section>
      </main>
    </div>
  );
}
