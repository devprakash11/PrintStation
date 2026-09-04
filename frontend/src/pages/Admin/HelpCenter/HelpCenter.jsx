import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Printer,
  QrCode,
  Search,
  Settings,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import '../../../styles/adminDashboard.css';
import '../../../styles/helpCenter.css';

const SESSION_KEY = 'printstation_admin_session';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const FAQS = [
  {
    question: 'How do I add a printer?',
    answer: 'Open Printers from the sidebar, select Add Printer, and enter the printer name, model, connection details, and status. Save the printer to add it to the management list.',
  },
  {
    question: 'How do I generate a QR code?',
    answer: 'Open QR Codes and select Generate QR Code. Enter the printer details and create the code. You can then view, download, or remove the generated QR code.',
  },
  {
    question: 'Where can I check print jobs?',
    answer: 'Open Print Jobs to review submitted jobs, their printer, page count, copies, print mode, status, and submission time.',
  },
  {
    question: 'Can I change the default print settings?',
    answer: 'Yes. Open Settings to configure the default color mode, paper size, orientation, copies, notifications, and dashboard refresh behavior.',
  },
  {
    question: 'Why is a printer showing offline?',
    answer: 'Check the printer connection and status first. If the printer remains offline, verify the printer service or network connection before retrying the job.',
  },
  {
    question: 'Are reports connected to live printer data?',
    answer: 'The current admin interface uses frontend demo data for reports. Live analytics requires the PrintStation backend or printer service to be connected.',
  },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function HelpCenter() {
  const [session] = useState(getSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const displayName = useMemo(() => session?.name?.trim() || 'Admin', [session]);

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return FAQS;
    return FAQS.filter(({ question, answer }) => `${question} ${answer}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

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

  const toggleFaq = (index) => {
    setOpenFaq((current) => (current === index ? null : index));
  };

  return (
    <div className="admin-dashboard help-center-page">
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
              <button key={item.label} type="button" className="admin-nav-item" onClick={() => handleNavigation(item)}>
                <Icon size={20} strokeWidth={1.9} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item is-active" type="button" onClick={() => setMobileOpen(false)}>
            <CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span>
          </button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={1.9} /><span>Logout</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar help-center-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Help Center</h1>
            <p>Find answers and guidance for managing your PrintStation admin panel.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><Users size={17} /></span><span>{displayName}</span></div>
          </div>
        </header>

        <section className="admin-content help-center-content" aria-label="PrintStation Help Center">
          <section className="help-center-hero">
            <div className="help-center-hero-copy">
              <span className="help-center-eyebrow"><BookOpen size={14} /> PRINTSTATION SUPPORT</span>
              <h2>How can we help?</h2>
              <p>Search the most common admin tasks, printer workflows, and PrintStation settings.</p>
              <label className="help-center-search">
                <Search size={19} aria-hidden="true" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help articles..." aria-label="Search help articles" />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
              </label>
            </div>
          </section>

          <div className="help-center-topic-grid">
            <article className="help-topic-card"><span><Printer size={20} /></span><div><strong>Printer Management</strong><p>Add printers, update status, and troubleshoot connectivity.</p></div></article>
            <article className="help-topic-card"><span><QrCode size={20} /></span><div><strong>QR Codes</strong><p>Generate, view, download, and manage printer QR codes.</p></div></article>
            <article className="help-topic-card"><span><FileText size={20} /></span><div><strong>Print Jobs</strong><p>Understand job status, print options, and job history.</p></div></article>
            <article className="help-topic-card"><span><Settings size={20} /></span><div><strong>Settings</strong><p>Configure defaults, alerts, and dashboard behavior.</p></div></article>
          </div>

          <section className="help-faq-card">
            <header className="help-section-header">
              <div><span className="help-section-eyebrow">FREQUENTLY ASKED QUESTIONS</span><h2>Common questions</h2></div>
              <span className="help-result-count">{filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}</span>
            </header>

            <div className="help-faq-list">
              {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => {
                const index = FAQS.indexOf(faq);
                const isOpen = openFaq === index;
                return (
                  <article className={`help-faq-item ${isOpen ? 'is-open' : ''}`} key={faq.question}>
                    <button type="button" onClick={() => toggleFaq(index)} aria-expanded={isOpen}>
                      <span>{faq.question}</span><ChevronDown size={18} />
                    </button>
                    {isOpen && <p>{faq.answer}</p>}
                  </article>
                );
              }) : <div className="help-empty-state"><CircleHelp size={22} /><strong>No matching articles</strong><span>Try a different search term.</span></div>}
            </div>
          </section>

          <section className="help-contact-card">
            <span className="help-contact-icon"><Mail size={20} /></span>
            <div><span className="help-section-eyebrow">NEED MORE HELP?</span><h2>Contact PrintStation support</h2><p>For backend, printer-service, or deployment issues, connect your support workflow here.</p></div>
            <a href="mailto:support@printstation.local" className="help-contact-button">Contact Support</a>
          </section>
        </section>
      </main>
    </div>
  );
}
