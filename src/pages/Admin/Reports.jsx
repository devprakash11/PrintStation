import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  QrCode,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import '../../styles/adminDashboard.css';
import '../../styles/reports.css';

const SESSION_KEY = 'printstation_admin_session';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: Settings },
];

const REPORT_DATA = [
  { day: 'Mon', jobs: 84, pages: 312 },
  { day: 'Tue', jobs: 106, pages: 418 },
  { day: 'Wed', jobs: 92, pages: 367 },
  { day: 'Thu', jobs: 128, pages: 506 },
  { day: 'Fri', jobs: 116, pages: 452 },
  { day: 'Sat', jobs: 72, pages: 284 },
  { day: 'Sun', jobs: 54, pages: 196 },
];

const PRINTER_REPORT = [
  { printer: 'PRN-001', jobs: 248, pages: 982, success: '98.4%' },
  { printer: 'PRN-002', jobs: 221, pages: 864, success: '97.7%' },
  { printer: 'PRN-003', jobs: 196, pages: 744, success: '96.9%' },
  { printer: 'PRN-004', jobs: 174, pages: 691, success: '95.8%' },
  { printer: 'PRN-005', jobs: 158, pages: 622, success: '94.9%' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function Reports() {
  const [session] = useState(getSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('Last 7 Days');

  const displayName = useMemo(() => session?.name?.trim() || 'Admin', [session]);
  const maxJobs = Math.max(...REPORT_DATA.map((item) => item.jobs));
  const totalJobs = REPORT_DATA.reduce((sum, item) => sum + item.jobs, 0);
  const totalPages = REPORT_DATA.reduce((sum, item) => sum + item.pages, 0);

  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  const handleNavigation = (item) => {
    setMobileOpen(false);
    if (item.path) window.location.href = item.path;
  };

  const handleExport = () => {
    const rows = [
      ['Day', 'Print Jobs', 'Pages'],
      ...REPORT_DATA.map((item) => [item.day, item.jobs, item.pages]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'printstation-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-dashboard reports-page">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true"><Printer size={18} /></div>
          <div className="admin-brand-copy"><strong>Admin Panel</strong><span>Management Console</span></div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button className="admin-new-job" type="button" onClick={() => (window.location.href = '/print/upload')}>
          <FileText size={18} />New Print Job
        </button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === 'Reports';
            return (
              <button key={item.label} type="button" className={`admin-nav-item ${isActive ? 'is-active' : ''}`} onClick={() => handleNavigation(item)}>
                <Icon size={20} strokeWidth={1.9} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button"><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
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
            <p>Review print activity, usage trends, and printer performance.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><UserRound size={17} /></span><span>{displayName}</span></div>
            <label className="admin-date-filter"><CalendarDays size={19} /><select value={range} onChange={(event) => setRange(event.target.value)}><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option></select></label>
          </div>
        </header>

        <section className="admin-content reports-content" aria-label="Reports overview">
          <div className="reports-toolbar">
            <div>
              <span className="reports-eyebrow">ANALYTICS OVERVIEW</span>
              <h2>Print performance</h2>
              <p>Summary for {range.toLowerCase()} based on current demo data.</p>
            </div>
            <button className="reports-export-button" type="button" onClick={handleExport}><Download size={17} />Export CSV</button>
          </div>

          <div className="reports-stat-grid">
            <article className="reports-stat-card"><span className="reports-stat-icon"><FileText size={19} /></span><span>Print Jobs</span><strong>{totalJobs}</strong><small><TrendingUp size={13} /> 12.4% vs previous period</small></article>
            <article className="reports-stat-card"><span className="reports-stat-icon"><BarChart3 size={19} /></span><span>Pages Printed</span><strong>{totalPages.toLocaleString()}</strong><small><TrendingUp size={13} /> 8.7% vs previous period</small></article>
            <article className="reports-stat-card"><span className="reports-stat-icon"><Printer size={19} /></span><span>Printer Success</span><strong>97.1%</strong><small>Across active printers</small></article>
            <article className="reports-stat-card"><span className="reports-stat-icon"><Users size={19} /></span><span>Active Users</span><strong>86</strong><small>24 users printed today</small></article>
          </div>

          <div className="reports-grid">
            <section className="reports-card reports-chart-card">
              <header className="reports-card-header"><div><h2>Print jobs trend</h2><span>Jobs completed or processed by day</span></div><span className="reports-card-badge">{range}</span></header>
              <div className="reports-chart" aria-label="Print jobs bar chart">
                <div className="reports-chart-y"><span>{maxJobs}</span><span>{Math.round(maxJobs * .66)}</span><span>{Math.round(maxJobs * .33)}</span><span>0</span></div>
                <div className="reports-bars">
                  {REPORT_DATA.map((item) => (
                    <div className="reports-bar-column" key={item.day}>
                      <strong>{item.jobs}</strong>
                      <div className="reports-bar-track"><i style={{ height: `${(item.jobs / maxJobs) * 100}%` }} /></div>
                      <span>{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="reports-card reports-summary-card">
              <header className="reports-card-header"><div><h2>Usage mix</h2><span>Current print configuration split</span></div></header>
              <div className="reports-mix-list">
                <div><span><i className="is-color" />Color</span><strong>62%</strong><em><b style={{ width: '62%' }} /></em></div>
                <div><span><i className="is-bw" />B&amp;W</span><strong>38%</strong><em><b style={{ width: '38%' }} /></em></div>
                <div><span><i className="is-a4" />A4 paper</span><strong>78%</strong><em><b style={{ width: '78%' }} /></em></div>
                <div><span><i className="is-a3" />A3 paper</span><strong>22%</strong><em><b style={{ width: '22%' }} /></em></div>
              </div>
            </section>
          </div>

          <section className="reports-card reports-table-card">
            <header className="reports-card-header"><div><h2>Printer performance</h2><span>Top printers by print-job volume</span></div></header>
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead><tr><th>Printer ID</th><th>Print Jobs</th><th>Pages</th><th>Success Rate</th><th>Performance</th></tr></thead>
                <tbody>{PRINTER_REPORT.map((item) => <tr key={item.printer}><td><strong>{item.printer}</strong></td><td>{item.jobs}</td><td>{item.pages.toLocaleString()}</td><td><span className="reports-success">{item.success}</span></td><td><div className="reports-performance"><i style={{ width: `${parseFloat(item.success)}%` }} /></div></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <div className="reports-note"><BarChart3 size={16} /><span>Report values are currently demo data. Connect PrintStation's backend or printer service for live analytics.</span></div>
        </section>
      </main>
    </div>
  );
}
