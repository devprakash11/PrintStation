import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  QrCode,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import '../../styles/adminDashboard.css';
import '../../styles/printJobs.css';

const SESSION_KEY = 'printstation_admin_session';
const PAGE_SIZE = 8;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: Users },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const PRINT_JOBS = [
  { id: 'JOB-2026-0148', document: 'Annual_Report_2023.pdf', printer: 'PRN-001', user: 'Admin', pages: 8, copies: 2, paper: 'A4', color: 'Color', status: 'Completed', date: '2026-09-04', time: '10:42 AM' },
  { id: 'JOB-2026-0147', document: 'Marketing_Brochure_V2.pdf', printer: 'PRN-005', user: 'Marketing', pages: 12, copies: 5, paper: 'A4', color: 'Color', status: 'Printing', date: '2026-09-04', time: '10:38 AM' },
  { id: 'JOB-2026-0146', document: 'Employee_Handbook.docx', printer: 'PRN-002', user: 'HR Admin', pages: 24, copies: 3, paper: 'A4', color: 'B&W', status: 'Completed', date: '2026-09-04', time: '10:15 AM' },
  { id: 'JOB-2026-0145', document: 'Q3_Financials_Draft.xlsx', printer: 'PRN-012', user: 'Finance', pages: 16, copies: 1, paper: 'A4', color: 'Color', status: 'Failed', date: '2026-09-04', time: '09:55 AM' },
  { id: 'JOB-2026-0144', document: 'Design_Assets_Pack.zip', printer: 'PRN-001', user: 'Design Team', pages: 6, copies: 1, paper: 'A3', color: 'Color', status: 'Queued', date: '2026-09-04', time: '09:30 AM' },
  { id: 'JOB-2026-0143', document: 'Student_Notice_September.pdf', printer: 'PRN-003', user: 'Office Admin', pages: 2, copies: 25, paper: 'A4', color: 'B&W', status: 'Completed', date: '2026-09-03', time: '04:18 PM' },
  { id: 'JOB-2026-0142', document: 'Event_Poster_Final.png', printer: 'PRN-004', user: 'Design Team', pages: 1, copies: 10, paper: 'A3', color: 'Color', status: 'Completed', date: '2026-09-03', time: '03:47 PM' },
  { id: 'JOB-2026-0141', document: 'Invoice_September.pdf', printer: 'PRN-002', user: 'Accounts', pages: 3, copies: 4, paper: 'A4', color: 'B&W', status: 'Completed', date: '2026-09-03', time: '02:26 PM' },
  { id: 'JOB-2026-0140', document: 'Training_Material.pdf', printer: 'PRN-005', user: 'Training', pages: 18, copies: 2, paper: 'A4', color: 'Color', status: 'Cancelled', date: '2026-09-03', time: '01:15 PM' },
  { id: 'JOB-2026-0139', document: 'Office_Forms.pdf', printer: 'PRN-001', user: 'Reception', pages: 5, copies: 10, paper: 'A4', color: 'B&W', status: 'Completed', date: '2026-09-03', time: '11:52 AM' },
  { id: 'JOB-2026-0138', document: 'Product_Catalog.pdf', printer: 'PRN-004', user: 'Sales', pages: 32, copies: 2, paper: 'A4', color: 'Color', status: 'Completed', date: '2026-09-02', time: '05:06 PM' },
  { id: 'JOB-2026-0137', document: 'Meeting_Agenda.pdf', printer: 'PRN-003', user: 'Management', pages: 4, copies: 8, paper: 'A4', color: 'B&W', status: 'Failed', date: '2026-09-02', time: '03:34 PM' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function getStatusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

export default function PrintJob() {
  const [session] = useState(getSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [dateRange, setDateRange] = useState('All Dates');
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);

  const displayName = session?.name?.trim() || 'Admin';

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PRINT_JOBS.filter((job) => {
      const matchesSearch = !query || [job.id, job.document, job.printer, job.user].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = status === 'All Status' || job.status === status;

      let matchesDate = true;
      if (dateRange !== 'All Dates') {
        const today = new Date('2026-09-04T00:00:00');
        const jobDate = new Date(`${job.date}T00:00:00`);
        const days = dateRange === 'Today' ? 0 : dateRange === 'Last 7 Days' ? 6 : 29;
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days);
        matchesDate = jobDate >= startDate && jobDate <= today;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [search, status, dateRange]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageJobs = filteredJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const firstEntry = filteredJobs.length ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const lastEntry = Math.min(safePage * PAGE_SIZE, filteredJobs.length);

  const handleNavigation = (item) => {
    setMobileOpen(false);
    if (item.path) window.location.href = item.path;
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('All Status');
    setDateRange('All Dates');
    setPage(1);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  return (
    <div className="admin-dashboard print-jobs-page">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true"><Printer size={18} /></div>
          <div className="admin-brand-copy"><strong>Admin Panel</strong><span>Management Console</span></div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button className="admin-new-job" type="button" onClick={() => (window.location.href = '/print/upload')}><Printer size={18} />New Print Job</button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'Print Jobs' ? 'is-active' : ''}`} onClick={() => handleNavigation(item)}><Icon size={20} strokeWidth={1.9} /><span>{item.label}</span></button>;
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button"><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar print-jobs-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Print Jobs</h1>
            <p>Track, filter, and manage all printing activity.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><UserRound size={17} /></span><span>{displayName}</span></div>
            <label className="admin-date-filter"><CalendarDays size={19} /><select value={dateRange} onChange={(event) => handleFilterChange(setDateRange, event.target.value)}><option>All Dates</option><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option></select></label>
          </div>
        </header>

        <section className="admin-content print-jobs-content" aria-label="Print jobs management">
          <div className="print-jobs-toolbar">
            <label className="print-jobs-search">
              <Search size={19} aria-hidden="true" />
              <input value={search} onChange={(event) => handleFilterChange(setSearch, event.target.value)} placeholder="Search jobs, documents, printers..." aria-label="Search print jobs" />
            </label>

            <label className="print-jobs-filter">
              <SlidersHorizontal size={18} aria-hidden="true" />
              <select value={status} onChange={(event) => handleFilterChange(setStatus, event.target.value)} aria-label="Filter by status">
                <option>All Status</option>
                <option>Completed</option>
                <option>Printing</option>
                <option>Queued</option>
                <option>Failed</option>
                <option>Cancelled</option>
              </select>
            </label>

            {(search || status !== 'All Status' || dateRange !== 'All Dates') && (
              <button className="print-jobs-clear" type="button" onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          <section className="print-jobs-card">
            <div className="print-jobs-card-header">
              <div>
                <h2>All Print Jobs</h2>
                <span>{filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found</span>
              </div>
              <div className="print-jobs-header-meta"><Clock3 size={16} /> Updated just now</div>
            </div>

            <div className="print-jobs-table-wrap">
              <table className="print-jobs-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Document</th>
                    <th>Printer</th>
                    <th>User</th>
                    <th>Pages</th>
                    <th>Copies</th>
                    <th>Settings</th>
                    <th>Status</th>
                    <th>Date &amp; Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageJobs.map((job) => (
                    <tr key={job.id}>
                      <td><span className="print-job-id">{job.id}</span></td>
                      <td><div className="print-job-document"><span className="print-job-file-icon"><FileText size={17} /></span><span title={job.document}>{job.document}</span></div></td>
                      <td>{job.printer}</td>
                      <td>{job.user}</td>
                      <td>{job.pages}</td>
                      <td>{job.copies}</td>
                      <td><span className="print-job-settings">{job.paper} · {job.color}</span></td>
                      <td><span className={`print-job-status is-${getStatusClass(job.status)}`}><i />{job.status}</span></td>
                      <td><span className="print-job-date">{job.date}<small>{job.time}</small></span></td>
                      <td><button className="print-job-action" type="button" onClick={() => setSelectedJob(job)} aria-label={`View ${job.id}`}><Eye size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!pageJobs.length && (
                <div className="print-jobs-empty"><FileText size={30} /><strong>No print jobs found</strong><span>Try changing your search or filters.</span><button type="button" onClick={clearFilters}>Reset filters</button></div>
              )}
            </div>

            <div className="print-jobs-mobile-list">
              {pageJobs.map((job) => (
                <article key={job.id} className="print-job-mobile-card">
                  <div className="print-job-mobile-top"><span className="print-job-id">{job.id}</span><span className={`print-job-status is-${getStatusClass(job.status)}`}><i />{job.status}</span></div>
                  <div className="print-job-document"><span className="print-job-file-icon"><FileText size={17} /></span><strong title={job.document}>{job.document}</strong></div>
                  <div className="print-job-mobile-grid"><span><small>Printer</small>{job.printer}</span><span><small>User</small>{job.user}</span><span><small>Pages</small>{job.pages}</span><span><small>Copies</small>{job.copies}</span></div>
                  <div className="print-job-mobile-footer"><span>{job.paper} · {job.color}</span><span>{job.date} · {job.time}</span><button type="button" onClick={() => setSelectedJob(job)}><Eye size={16} />View</button></div>
                </article>
              ))}
              {!pageJobs.length && <div className="print-jobs-empty"><FileText size={30} /><strong>No print jobs found</strong><span>Try changing your search or filters.</span><button type="button" onClick={clearFilters}>Reset filters</button></div>}
            </div>

            <footer className="print-jobs-pagination">
              <span>Showing <strong>{firstEntry}</strong> to <strong>{lastEntry}</strong> of <strong>{filteredJobs.length}</strong> jobs</span>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1} aria-label="Previous page"><ChevronLeft size={18} /></button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, safePage - 3), Math.min(pageCount, safePage + 2)).map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === safePage ? 'is-active' : ''} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
                <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount} aria-label="Next page"><ChevronRight size={18} /></button>
              </div>
            </footer>
          </section>
        </section>
      </main>

      {selectedJob && (
        <div className="print-job-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedJob(null)}>
          <section className="print-job-modal" role="dialog" aria-modal="true" aria-labelledby="print-job-modal-title">
            <header><div><span>Print Job Details</span><h2 id="print-job-modal-title">{selectedJob.id}</h2></div><button type="button" onClick={() => setSelectedJob(null)} aria-label="Close details"><X size={20} /></button></header>
            <div className="print-job-modal-document"><span className="print-job-file-icon"><FileText size={20} /></span><div><strong>{selectedJob.document}</strong><span>{selectedJob.pages} pages · {selectedJob.copies} copies</span></div></div>
            <dl className="print-job-details-grid"><div><dt>Status</dt><dd><span className={`print-job-status is-${getStatusClass(selectedJob.status)}`}><i />{selectedJob.status}</span></dd></div><div><dt>Printer</dt><dd>{selectedJob.printer}</dd></div><div><dt>User</dt><dd>{selectedJob.user}</dd></div><div><dt>Paper</dt><dd>{selectedJob.paper}</dd></div><div><dt>Color</dt><dd>{selectedJob.color}</dd></div><div><dt>Submitted</dt><dd>{selectedJob.date} · {selectedJob.time}</dd></div></dl>
            <footer><button type="button" className="print-job-secondary" onClick={() => setSelectedJob(null)}>Close</button><button type="button" className="print-job-primary" onClick={() => window.print()}><Download size={16} />Print Details</button></footer>
          </section>
        </div>
      )}
    </div>
  );
}
