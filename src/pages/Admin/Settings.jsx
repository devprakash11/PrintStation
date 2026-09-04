import { useMemo, useState } from 'react';
import {
  Bell,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  QrCode,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  X,
  BarChart3,
} from 'lucide-react';
import '../../styles/adminDashboard.css';
import '../../styles/settings.css';

const SESSION_KEY = 'printstation_admin_session';
const SETTINGS_KEY = 'printstation_admin_settings';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: SettingsIcon, path: '/admin/settings' },
];

const DEFAULT_SETTINGS = {
  defaultColor: 'color',
  defaultPaperSize: 'A4',
  defaultOrientation: 'portrait',
  defaultCopies: 1,
  autoRefresh: true,
  refreshInterval: '30',
  jobNotifications: true,
  printerAlerts: true,
};

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function getSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Settings() {
  const [session] = useState(getSession);
  const [settings, setSettings] = useState(getSettings);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const displayName = useMemo(() => session?.name?.trim() || 'Admin', [session]);

  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  const updateSetting = (key, value) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  const handleNavigation = (item) => {
    setMobileOpen(false);
    if (item.path) window.location.href = item.path;
  };

  return (
    <div className="admin-dashboard settings-page">
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
            return (
              <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'Settings' ? 'is-active' : ''}`} onClick={() => handleNavigation(item)}>
                <Icon size={20} strokeWidth={1.9} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button" onClick={() => handleNavigation({ label: 'Help Center', path: '/admin/help' })}><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar settings-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Settings</h1>
            <p>Manage print defaults, notifications, and admin preferences.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><Users size={17} /></span><span>{displayName}</span></div>
          </div>
        </header>

        <section className="admin-content settings-content" aria-label="PrintStation settings">
          <form className="settings-layout" onSubmit={handleSave}>
            <div className="settings-main-column">
              <section className="settings-card">
                <header className="settings-card-header">
                  <div className="settings-card-icon"><Printer size={19} /></div>
                  <div><h2>Print defaults</h2><p>Choose the defaults used when a new print job is created.</p></div>
                </header>

                <div className="settings-form-grid">
                  <div className="settings-field settings-field-full">
                    <label>Print color</label>
                    <div className="settings-segmented">
                      <button type="button" className={settings.defaultColor === 'color' ? 'is-active' : ''} onClick={() => updateSetting('defaultColor', 'color')}>Color</button>
                      <button type="button" className={settings.defaultColor === 'bw' ? 'is-active' : ''} onClick={() => updateSetting('defaultColor', 'bw')}>B&amp;W</button>
                    </div>
                  </div>

                  <label className="settings-field"><span>Paper size</span><select value={settings.defaultPaperSize} onChange={(event) => updateSetting('defaultPaperSize', event.target.value)}><option>A4</option><option>A3</option><option>A5</option><option>A6</option><option>Letter</option><option>Legal</option><option>Tabloid</option></select></label>

                  <label className="settings-field"><span>Orientation</span><select value={settings.defaultOrientation} onChange={(event) => updateSetting('defaultOrientation', event.target.value)}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>

                  <label className="settings-field"><span>Default copies</span><input type="number" min="1" max="99" value={settings.defaultCopies} onChange={(event) => updateSetting('defaultCopies', Math.max(1, Math.min(99, Number(event.target.value) || 1)))} /></label>
                </div>
              </section>

              <section className="settings-card">
                <header className="settings-card-header">
                  <div className="settings-card-icon"><Bell size={19} /></div>
                  <div><h2>Notifications</h2><p>Control the alerts shown to administrators.</p></div>
                </header>
                <div className="settings-toggle-list">
                  <label className="settings-toggle-row"><span><strong>Print job notifications</strong><small>Notify when a print job is completed or fails.</small></span><input type="checkbox" checked={settings.jobNotifications} onChange={(event) => updateSetting('jobNotifications', event.target.checked)} /><i /></label>
                  <label className="settings-toggle-row"><span><strong>Printer alerts</strong><small>Show alerts when printers go offline or report an issue.</small></span><input type="checkbox" checked={settings.printerAlerts} onChange={(event) => updateSetting('printerAlerts', event.target.checked)} /><i /></label>
                </div>
              </section>

              <section className="settings-card">
                <header className="settings-card-header">
                  <div className="settings-card-icon"><ShieldCheck size={19} /></div>
                  <div><h2>Dashboard behavior</h2><p>Configure how often admin data refreshes on the dashboard.</p></div>
                </header>
                <div className="settings-toggle-list">
                  <label className="settings-toggle-row"><span><strong>Auto refresh</strong><small>Automatically refresh dashboard information.</small></span><input type="checkbox" checked={settings.autoRefresh} onChange={(event) => updateSetting('autoRefresh', event.target.checked)} /><i /></label>
                </div>
                <label className={`settings-field settings-refresh-field ${!settings.autoRefresh ? 'is-disabled' : ''}`}><span>Refresh interval</span><select disabled={!settings.autoRefresh} value={settings.refreshInterval} onChange={(event) => updateSetting('refreshInterval', event.target.value)}><option value="15">Every 15 seconds</option><option value="30">Every 30 seconds</option><option value="60">Every 1 minute</option><option value="300">Every 5 minutes</option></select></label>
              </section>
            </div>

            <aside className="settings-side-column">
              <div className="settings-save-card">
                <div><span className="settings-save-icon"><Save size={18} /></span><h2>Save changes</h2><p>Your preferences are stored locally for this admin session.</p></div>
                <button className="settings-save-button" type="submit"><Save size={17} />Save Settings</button>
                {saved && <span className="settings-saved-message">Settings saved successfully.</span>}
              </div>
              <div className="settings-info-card"><span>PRINTSTATION</span><strong>Admin preferences</strong><p>These controls are frontend-only until a backend settings service is connected.</p></div>
            </aside>
          </form>
        </section>
      </main>
    </div>
  );
}