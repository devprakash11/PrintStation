import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Printer,
  QrCode,
  Settings,
  UserRound,
  Users,
  X,
  Plus,
  CheckCircle2,
  CircleAlert,
  Clock3,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import '../../styles/adminDashboard.css';

const SESSION_KEY = 'printstation_admin_session';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer },
  { label: 'QR Codes', icon: QrCode },
  { label: 'Print Jobs', icon: FileText },
  { label: 'Users', icon: Users },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const ACTIVITIES = [
  { status: 'Completed', type: 'success', printer: 'PRN-001', document: 'Annual_Report_2023.pdf', time: '10:42 AM' },
  { status: 'Printing', type: 'warning', printer: 'PRN-005', document: 'Marketing_Brochure_V2.pdf', time: '10:38 AM' },
  { status: 'Completed', type: 'success', printer: 'PRN-002', document: 'Employee_Handbook.docx', time: '10:15 AM' },
  { status: 'Failed', type: 'danger', printer: 'PRN-012', document: 'Q3_Financials_Draft.xlsx', time: '09:55 AM' },
  { status: 'Queued', type: 'neutral', printer: 'PRN-001', document: 'Design_Assets_Pack.zip', time: '09:30 AM' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const [session] = useState(getSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('Last 7 Days');
  const [activeItem, setActiveItem] = useState('Dashboard');

  const displayName = useMemo(() => {
    const name = session?.name?.trim();
    return name || 'Admin';
  }, [session]);

  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  const handleNavigation = (item) => {
    setActiveItem(item.label);
    setMobileOpen(false);

    if (item.path) {
      window.location.href = item.path;
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true">
            <Printer size={18} />
          </div>
          <div className="admin-brand-copy">
            <strong>Admin Panel</strong>
            <span>Management Console</span>
          </div>
          <button
            className="admin-sidebar-close"
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <button
          className="admin-new-job"
          type="button"
          onClick={() => (window.location.href = '/print/upload')}
        >
          <Plus size={19} />
          New Print Job
        </button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <button
                key={item.label}
                type="button"
                className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <Icon size={20} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button">
            <CircleHelp size={20} strokeWidth={1.9} />
            <span>Help Center</span>
          </button>

          <button className="admin-nav-item" type="button" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={1.9} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="admin-sidebar-overlay"
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-toggle"
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Dashboard</h1>
            <p>Monitor printers, print jobs, and system activity.</p>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-user-chip">
              <span className="admin-user-avatar"><UserRound size={17} /></span>
              <span>{displayName}</span>
            </div>

            <label className="admin-date-filter">
              <CalendarDays size={19} />
              <select value={range} onChange={(event) => setRange(event.target.value)}>
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </label>
          </div>
        </header>

        <section className="admin-content" aria-label="Dashboard overview">
          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon is-blue"><Printer size={21} /></span>
                <span className="admin-stat-trend is-positive"><TrendingUp size={14} /> +2%</span>
              </div>
              <span className="admin-stat-label">Total Printers</span>
              <strong>24</strong>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon is-green"><CheckCircle2 size={21} /></span>
                <span className="admin-stat-trend is-positive"><TrendingUp size={14} /> +5%</span>
              </div>
              <span className="admin-stat-label">Online</span>
              <strong>18 <i className="admin-live-dot" /></strong>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon is-red"><CircleAlert size={21} /></span>
                <span className="admin-stat-trend is-negative"><TrendingDown size={14} /> -1%</span>
              </div>
              <span className="admin-stat-label">Offline</span>
              <strong>4 <i className="admin-offline-dot" /></strong>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-icon is-indigo"><FileText size={21} /></span>
                <span className="admin-stat-trend is-positive"><TrendingUp size={14} /> +12%</span>
              </div>
              <span className="admin-stat-label">Print Jobs Today</span>
              <strong>126</strong>
            </article>
          </div>

          <section className="admin-activity-card">
            <div className="admin-section-header">
              <div>
                <h2>Recent Activity</h2>
                <span>Latest printer and print-job activity</span>
              </div>
              <button type="button" onClick={() => setActiveItem('Print Jobs')}>
                View All <ChevronRight size={17} />
              </button>
            </div>

            <div className="admin-activity-table-wrap">
              <table className="admin-activity-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Printer ID</th>
                    <th>Document Name</th>
                    <th>Time</th>
                    <th aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {ACTIVITIES.map((activity) => (
                    <tr key={`${activity.printer}-${activity.document}`}>
                      <td>
                        <span className={`admin-status is-${activity.type}`}>
                          <i />
                          {activity.status}
                        </span>
                      </td>
                      <td>{activity.printer}</td>
                      <td className="admin-document-name">{activity.document}</td>
                      <td>{activity.time}</td>
                      <td>
                        <button className="admin-row-action" type="button" aria-label={`Open ${activity.document}`}>
                          <ChevronRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-activity-mobile-list">
              {ACTIVITIES.map((activity) => (
                <article key={`${activity.printer}-mobile-${activity.document}`}>
                  <div>
                    <span className={`admin-status is-${activity.type}`}>
                      <i />
                      {activity.status}
                    </span>
                    <strong>{activity.document}</strong>
                    <span>{activity.printer} · {activity.time}</span>
                  </div>
                  <ChevronRight size={18} />
                </article>
              ))}
            </div>
          </section>

          <div className="admin-dashboard-note">
            <Clock3 size={16} />
            <span>Dashboard data is currently demo data. Connect your printer/API service for live statistics.</span>
          </div>
        </section>
      </main>
    </div>
  );
}
