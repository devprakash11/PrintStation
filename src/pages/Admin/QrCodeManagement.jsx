import { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Download,
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
} from 'lucide-react';
import '../../styles/adminDashboard.css';
import '../../styles/qrCodeManagement.css';

const SESSION_KEY = 'printstation_admin_session';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText },
  { label: 'Users', icon: Users },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const PRINTERS = [
  { id: 'PRN-001', name: 'HP LaserJet Pro M404dn', model: 'M404dn', location: 'Computer Lab 1', status: 'Online' },
  { id: 'PRN-002', name: 'Canon imageCLASS', model: 'MF445dw', location: 'Library Ground Floor', status: 'Printing' },
  { id: 'PRN-003', name: 'Epson EcoTank', model: 'ET-4760', location: 'Staff Room B', status: 'Offline' },
  { id: 'PRN-004', name: 'Brother HL', model: 'L2390DW', location: 'Reception', status: 'Online' },
  { id: 'PRN-005', name: 'HP Color LaserJet', model: 'M255dw', location: 'Design Lab', status: 'Online' },
  { id: 'PRN-006', name: 'Canon PIXMA', model: 'G6020', location: 'Admin Office', status: 'Online' },
  { id: 'PRN-007', name: 'Epson WorkForce', model: 'WF-4830', location: 'Accounts', status: 'Offline' },
  { id: 'PRN-008', name: 'Brother MFC', model: 'MFC-L2710DW', location: 'Staff Room A', status: 'Online' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function hashText(value) {
  return [...value].reduce(
    (hash, character, index) => ((hash * 31 + character.charCodeAt(0) + index) >>> 0),
    2166136261,
  );
}

function buildQrMatrix(value) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  const setFinder = (startRow, startCol) => {
    for (let row = -1; row <= 7; row += 1) {
      for (let col = -1; col <= 7; col += 1) {
        const targetRow = startRow + row;
        const targetCol = startCol + col;
        if (targetRow < 0 || targetRow >= size || targetCol < 0 || targetCol >= size) continue;

        reserved[targetRow][targetCol] = true;
        matrix[targetRow][targetCol] =
          row >= 0 && row <= 6 &&
          col >= 0 && col <= 6 &&
          (row === 0 || row === 6 || col === 0 || col === 6 ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4));
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, 14);
  setFinder(14, 0);

  for (let index = 8; index < 13; index += 1) {
    reserved[6][index] = true;
    reserved[index][6] = true;
    matrix[6][index] = index % 2 === 0;
    matrix[index][6] = index % 2 === 0;
  }

  let seed = hashText(value);
  const nextBit = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed & 1;
  };

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!reserved[row][col]) matrix[row][col] = Boolean(nextBit());
    }
  }

  return matrix;
}

function QrVisual({ value, size = 156 }) {
  const matrix = useMemo(() => buildQrMatrix(value), [value]);
  const cellSize = size / 21;

  return (
    <svg
      className="qr-code-visual"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.flatMap((row, rowIndex) =>
        row.map(
          (cell, colIndex) =>
            cell && (
              <rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * cellSize}
                y={rowIndex * cellSize}
                width={cellSize + 0.2}
                height={cellSize + 0.2}
                fill="#171717"
              />
            ),
        ),
      )}
    </svg>
  );
}

function StatusBadge({ status }) {
  const type = status === 'Online' ? 'success' : status === 'Printing' ? 'warning' : 'danger';
  return <span className={`qr-status-badge is-${type}`}><i />{status}</span>;
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawQrLabel(context, printer) {
  const width = 700;
  const height = 900;
  const accent = '#e85d2a';
  const ink = '#171717';
  const muted = '#77736f';
  const paper = '#f8f7f5';
  const matrix = buildQrMatrix(`printstation://${printer.id}`);

  context.fillStyle = accent;
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.font = '700 44px Arial, sans-serif';
  context.fillText('PrintStation', width / 2, 82);

  drawRoundedRect(context, 48, 122, width - 96, 700, 34);
  context.fill();

  context.fillStyle = accent;
  context.font = '800 32px Arial, sans-serif';
  context.fillText('SCAN TO CONNECT', width / 2, 190);

  const qrSize = 430;
  const qrX = (width - qrSize) / 2;
  const qrY = 235;
  const cellSize = qrSize / 21;

  context.fillStyle = '#ffffff';
  context.fillRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36);
  context.fillStyle = '#171717';

  matrix.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (!cell) return;
      context.fillRect(
        qrX + colIndex * cellSize,
        qrY + rowIndex * cellSize,
        cellSize + 0.5,
        cellSize + 0.5,
      );
    });
  });

  context.fillStyle = paper;
  drawRoundedRect(context, 95, 700, width - 190, 88, 16);
  context.fill();

  context.textAlign = 'left';
  context.fillStyle = ink;
  context.font = '700 21px Arial, sans-serif';
  context.fillText(printer.name, 125, 735);
  context.fillStyle = muted;
  context.font = '500 17px Arial, sans-serif';
  context.fillText(`${printer.id}  ·  ${printer.location}`, 125, 764);

  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.font = '600 18px Arial, sans-serif';
  context.fillText('Scan → Connect → Upload → Print', width / 2, 858);
}

function downloadQrLabel(printer) {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 900;
  const context = canvas.getContext('2d');

  if (!context) return;

  drawQrLabel(context, printer);

  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${printer.id}-PrintStation-QR.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export default function QrCodeManagement() {
  const [session] = useState(getSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [range, setRange] = useState('Last 7 Days');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedPrinter, setSelectedPrinter] = useState(null);

  const displayName = useMemo(() => session?.name?.trim() || 'Admin', [session]);

  const filteredPrinters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return PRINTERS.filter((printer) => {
      const matchesFilter = filter === 'All' || printer.status === filter;
      const matchesSearch =
        !query ||
        [printer.name, printer.id, printer.model, printer.location].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const handleNavigation = (item) => {
    setMobileOpen(false);
    if (item.path) window.location.href = item.path;
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  const handleFilter = () => {
    const next = filter === 'All' ? 'Online' : filter === 'Online' ? 'Printing' : filter === 'Printing' ? 'Offline' : 'All';
    setFilter(next);
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
          <div className="admin-brand-copy"><strong>Admin Panel</strong><span>Management Console</span></div>
          <button className="admin-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        <button className="admin-new-job" type="button" onClick={() => (window.location.href = '/print/upload')}><Plus size={19} />New Print Job</button>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'QR Codes' ? 'is-active' : ''}`} onClick={() => handleNavigation(item)}><Icon size={20} strokeWidth={1.9} /><span>{item.label}</span></button>;
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button"><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar qr-page-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>QR Codes</h1>
            <p>Manage printer QR codes and make wireless printing access easy.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><UserRound size={17} /></span><span>{displayName}</span></div>
            <label className="admin-date-filter"><CalendarDays size={19} /><select value={range} onChange={(event) => setRange(event.target.value)}><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option></select></label>
          </div>
        </header>

        <section className="admin-content qr-management-content" aria-label="QR code management">
          <div className="qr-toolbar">
            <label className="qr-search"><Search size={19} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search printers or QR codes..." aria-label="Search QR codes" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</label>
            <button className={`qr-filter-button ${filter !== 'All' ? 'is-filtered' : ''}`} type="button" onClick={handleFilter}><Filter size={17} />Filter{filter !== 'All' && <span>{filter}</span>}</button>
            <button className="qr-generate-button" type="button" onClick={() => setSelectedPrinter(PRINTERS[0])}><Plus size={18} />Generate QR Code</button>
          </div>

          <div className="qr-summary-row">
            <div><QrCode size={18} /><span><strong>{filteredPrinters.length}</strong> QR codes</span></div>
            <span>Each code connects directly to its assigned printer.</span>
          </div>

          <div className="qr-card-grid">
            {filteredPrinters.map((printer) => (
              <article className="qr-printer-card" key={printer.id}>
                <div className="qr-card-header">
                  <div className="qr-printer-icon"><Printer size={19} /></div>
                  <div className="qr-printer-heading"><h2>{printer.name}</h2><span>{printer.id} · {printer.model}</span></div>
                  <StatusBadge status={printer.status} />
                </div>

                <div className="qr-preview-area"><div className="qr-preview-frame"><QrVisual value={`printstation://${printer.id}`} size={156} /></div></div>

                <div className="qr-card-meta">
                  <span><Wifi size={15} /> {printer.location}</span>
                  <span><CheckCircle2 size={15} /> Active QR</span>
                </div>

                <div className="qr-card-actions">
                  <button type="button" className="qr-view-button" onClick={() => setSelectedPrinter(printer)}>View QR</button>
                  <button type="button" className="qr-download-button" onClick={() => downloadQrLabel(printer)}><Download size={16} />Download</button>
                </div>
              </article>
            ))}
          </div>

          {!filteredPrinters.length && <div className="qr-empty-state"><QrCode size={30} /><h2>No QR codes found</h2><p>Try another printer name, ID, or status filter.</p></div>}
        </section>
      </main>

      {selectedPrinter && (
        <div className="qr-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedPrinter(null)}>
          <section className="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
            <button className="qr-modal-close" type="button" onClick={() => setSelectedPrinter(null)} aria-label="Close QR code preview"><X size={19} /></button>

            <div className="qr-label-preview">
              <div className="qr-label-brand">PrintStation</div>
              <div className="qr-label-card">
                <span className="qr-label-eyebrow">SCAN TO CONNECT</span>
                <div className="qr-label-code"><QrVisual value={`printstation://${selectedPrinter.id}`} size={250} /></div>
                <div className="qr-label-printer">
                  <strong>{selectedPrinter.name}</strong>
                  <span>{selectedPrinter.id} · {selectedPrinter.location}</span>
                </div>
              </div>
              <div className="qr-label-footer">Scan → Connect → Upload → Print</div>
            </div>

            <div className="qr-modal-actions">
              <button type="button" className="qr-download-button" onClick={() => downloadQrLabel(selectedPrinter)}><Download size={16} />Download QR</button>
              <button type="button" className="qr-view-button" onClick={() => window.print()}><Printer size={16} />Print Label</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
