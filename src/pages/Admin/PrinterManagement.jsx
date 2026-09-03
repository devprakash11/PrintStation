import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  QrCode,
  Search,
  Settings,
  UserRound,
  Users,
  Wifi,
  X,
  Cable,
  Usb,
} from 'lucide-react';
import '../../styles/adminDashboard.css';
import '../../styles/printerManagement.css';

const SESSION_KEY = 'printstation_admin_session';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode },
  { label: 'Print Jobs', icon: FileText },
  { label: 'Users', icon: Users },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const INITIAL_PRINTERS = [
  { id: 'PRN-001', name: 'HP LaserJet Pro M404dn', model: 'M404dn', location: 'Computer Lab 1', connection: 'Wi-Fi', status: 'Online' },
  { id: 'PRN-002', name: 'Canon imageCLASS', model: 'MF445dw', location: 'Library Ground Floor', connection: 'Ethernet', status: 'Printing' },
  { id: 'PRN-003', name: 'Epson EcoTank', model: 'ET-4760', location: 'Staff Room B', connection: 'Wi-Fi', status: 'Offline' },
  { id: 'PRN-004', name: 'Brother HL', model: 'L2390DW', location: 'Reception', connection: 'USB', status: 'Online' },
  { id: 'PRN-005', name: 'HP Color LaserJet', model: 'M255dw', location: 'Design Lab', connection: 'Wi-Fi', status: 'Online' },
  { id: 'PRN-006', name: 'Canon PIXMA', model: 'G6020', location: 'Admin Office', connection: 'Ethernet', status: 'Online' },
  { id: 'PRN-007', name: 'Epson WorkForce', model: 'WF-4830', location: 'Accounts', connection: 'Wi-Fi', status: 'Offline' },
  { id: 'PRN-008', name: 'Brother MFC', model: 'MFC-L2710DW', location: 'Staff Room A', connection: 'Ethernet', status: 'Online' },
  { id: 'PRN-009', name: 'HP LaserJet', model: 'M404dn', location: 'Computer Lab 2', connection: 'Wi-Fi', status: 'Printing' },
  { id: 'PRN-010', name: 'Canon imageRUNNER', model: 'C3226i', location: 'Main Office', connection: 'Ethernet', status: 'Online' },
  { id: 'PRN-011', name: 'Epson EcoTank', model: 'L6270', location: 'Library First Floor', connection: 'USB', status: 'Offline' },
  { id: 'PRN-012', name: 'Brother HL', model: 'L2395DW', location: 'Reception', connection: 'Wi-Fi', status: 'Online' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function StatusBadge({ status }) {
  const type = status === 'Online' ? 'success' : status === 'Printing' ? 'warning' : 'danger';

  return (
    <span className={`printer-status-badge is-${type}`}>
      <i />
      {status}
    </span>
  );
}

function ConnectionType({ type }) {
  const Icon = type === 'Wi-Fi' ? Wifi : type === 'USB' ? Usb : Cable;
  return (
    <span className="printer-connection">
      <Icon size={16} />
      {type}
    </span>
  );
}

export default function PrinterManagement() {
  const [session] = useState(getSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('Last 7 Days');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [printers, setPrinters] = useState(INITIAL_PRINTERS);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [newPrinter, setNewPrinter] = useState({ name: '', model: '', location: '', connection: 'Wi-Fi' });

  const displayName = useMemo(() => session?.name?.trim() || 'Admin', [session]);

  const filteredPrinters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return printers.filter((printer) => {
      const matchesFilter = filter === 'All' || printer.status === filter;
      const matchesSearch = !query || [printer.name, printer.id, printer.model, printer.location, printer.connection]
        .some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, printers, search]);

  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(filteredPrinters.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePrinters = filteredPrinters.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleNavigation = (item) => {
    setMobileOpen(false);
    if (item.path) window.location.href = item.path;
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilter = () => {
    const next = filter === 'All' ? 'Online' : filter === 'Online' ? 'Printing' : filter === 'Printing' ? 'Offline' : 'All';
    setFilter(next);
    setPage(1);
  };

  const handleAddPrinter = (event) => {
    event.preventDefault();
    if (!newPrinter.name.trim() || !newPrinter.model.trim() || !newPrinter.location.trim()) return;

    const nextNumber = printers.length + 1;
    setPrinters((current) => [
      ...current,
      {
        id: `PRN-${String(nextNumber).padStart(3, '0')}`,
        name: newPrinter.name.trim(),
        model: newPrinter.model.trim(),
        location: newPrinter.location.trim(),
        connection: newPrinter.connection,
        status: 'Online',
      },
    ]);
    setNewPrinter({ name: '', model: '', location: '', connection: 'Wi-Fi' });
    setShowAddPrinter(false);
    setPage(Math.ceil((printers.length + 1) / pageSize));
  };

  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand-mark" aria-hidden="true"><Printer size={18} /></div>
          <div className="admin-brand-copy">
            <strong>Admin Panel</strong>
            <span>Management Console</span>
          </div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <button className="admin-new-job" type="button" onClick={() => (window.location.href = '/print/upload')}>
          <Plus size={19} />
          New Print Job
        </button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={`admin-nav-item ${item.label === 'Printers' ? 'is-active' : ''}`}
                onClick={() => handleNavigation(item)}
              >
                <Icon size={20} strokeWidth={1.9} />
                <span>{item.label}</span>
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
        <header className="admin-topbar printer-page-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>

          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Printer Management</h1>
            <p>Manage printers, QR codes, connection status, and printing access.</p>
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

        <section className="admin-content printer-management-content" aria-label="Printer management">
          <div className="printer-toolbar">
            <label className="printer-search">
              <Search size={19} aria-hidden="true" />
              <input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Search printers..." aria-label="Search printers" />
              {search && <button type="button" onClick={() => handleSearch('')} aria-label="Clear search"><X size={15} /></button>}
            </label>
            <button className={`printer-filter-button ${filter !== 'All' ? 'is-filtered' : ''}`} type="button" onClick={handleFilter}>
              <Filter size={17} />
              {filter === 'All' ? 'Filter' : filter}
            </button>
            <button className="printer-add-button" type="button" onClick={() => setShowAddPrinter(true)}>
              <Plus size={18} />
              Add Printer
            </button>
          </div>

          <section className="printer-table-card">
            <div className="printer-table-wrap">
              <table className="printer-table">
                <thead>
                  <tr>
                    <th>Printer</th>
                    <th>Printer ID</th>
                    <th>Model</th>
                    <th>Location</th>
                    <th>Connection</th>
                    <th>Status</th>
                    <th>QR</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePrinters.map((printer) => (
                    <tr key={printer.id}>
                      <td>
                        <div className="printer-name-cell">
                          <span className="printer-icon"><Printer size={19} /></span>
                          <strong>{printer.name}</strong>
                        </div>
                      </td>
                      <td><code>{printer.id}</code></td>
                      <td>{printer.model}</td>
                      <td>{printer.location}</td>
                      <td><ConnectionType type={printer.connection} /></td>
                      <td><StatusBadge status={printer.status} /></td>
                      <td><button className="printer-qr-link" type="button" onClick={() => setSelectedPrinter(printer)}><QrCode size={15} /> View QR</button></td>
                      <td><button className="printer-row-action" type="button" onClick={() => setSelectedPrinter(printer)} aria-label={`View ${printer.name}`}><ChevronRight size={17} /></button></td>
                    </tr>
                  ))}
                  {!visiblePrinters.length && (
                    <tr><td colSpan="8" className="printer-empty-state">No printers match your search or filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="printer-table-footer">
              <span>Showing {filteredPrinters.length ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredPrinters.length)} of {filteredPrinters.length} entries</span>
              <div className="printer-pagination" aria-label="Printer pagination">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page"><ChevronLeft size={17} /></button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button key={number} type="button" className={number === currentPage ? 'is-active' : ''} onClick={() => setPage(number)}>{number}</button>
                ))}
                <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next page"><ChevronRight size={17} /></button>
              </div>
            </div>
          </section>
        </section>
      </main>

      {showAddPrinter && (
        <div className="printer-modal-backdrop" role="presentation" onMouseDown={() => setShowAddPrinter(false)}>
          <section className="printer-modal" role="dialog" aria-modal="true" aria-labelledby="add-printer-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="printer-modal-header">
              <div><span className="printer-modal-icon"><Printer size={20} /></span><div><h2 id="add-printer-title">Add Printer</h2><p>Register a new PrintStation printer.</p></div></div>
              <button type="button" onClick={() => setShowAddPrinter(false)} aria-label="Close"><X size={19} /></button>
            </div>
            <form className="printer-form" onSubmit={handleAddPrinter}>
              <label><span>Printer Name</span><input required value={newPrinter.name} onChange={(event) => setNewPrinter({ ...newPrinter, name: event.target.value })} placeholder="e.g. HP LaserJet Pro" /></label>
              <label><span>Model</span><input required value={newPrinter.model} onChange={(event) => setNewPrinter({ ...newPrinter, model: event.target.value })} placeholder="e.g. M404dn" /></label>
              <label><span>Location</span><input required value={newPrinter.location} onChange={(event) => setNewPrinter({ ...newPrinter, location: event.target.value })} placeholder="e.g. Computer Lab 1" /></label>
              <label><span>Connection</span><select value={newPrinter.connection} onChange={(event) => setNewPrinter({ ...newPrinter, connection: event.target.value })}><option>Wi-Fi</option><option>Ethernet</option><option>USB</option></select></label>
              <div className="printer-form-actions"><button type="button" onClick={() => setShowAddPrinter(false)}>Cancel</button><button type="submit">Add Printer</button></div>
            </form>
          </section>
        </div>
      )}

      {selectedPrinter && (
        <div className="printer-modal-backdrop" role="presentation" onMouseDown={() => setSelectedPrinter(null)}>
          <section className="printer-qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="printer-qr-close" type="button" onClick={() => setSelectedPrinter(null)} aria-label="Close"><X size={19} /></button>
            <span className="printer-qr-symbol"><QrCode size={24} /></span>
            <h2 id="qr-title">{selectedPrinter.name}</h2>
            <p>{selectedPrinter.id} · {selectedPrinter.model}</p>
            <div className="printer-qr-placeholder" aria-label="QR code preview"><QrCode size={150} strokeWidth={1.25} /></div>
            <small>QR connection code for {selectedPrinter.location}</small>
          </section>
        </div>
      )}
    </div>
  );
}
