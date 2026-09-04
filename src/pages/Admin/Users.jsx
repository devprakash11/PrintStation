import { useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import '../../styles/adminDashboard.css';
import '../../styles/users.css';

const SESSION_KEY = 'printstation_admin_session';
const USERS_STORAGE_KEY = 'printstation_admin_users';
const PAGE_SIZE = 8;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Printers', icon: Printer, path: '/admin/printers' },
  { label: 'QR Codes', icon: QrCode, path: '/admin/qr-codes' },
  { label: 'Print Jobs', icon: FileText, path: '/admin/print-jobs' },
  { label: 'Users', icon: UsersIcon, path: '/admin/users' },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const DEFAULT_USERS = [
  { id: 'USR-001', name: 'Admin User', email: 'admin@printstation.in', role: 'Administrator', status: 'Active', jobs: 126, lastActive: 'Just now' },
  { id: 'USR-002', name: 'Rahul Sharma', email: 'rahul@printstation.in', role: 'Operator', status: 'Active', jobs: 48, lastActive: '10 min ago' },
  { id: 'USR-003', name: 'Priya Verma', email: 'priya@printstation.in', role: 'Operator', status: 'Active', jobs: 36, lastActive: '24 min ago' },
  { id: 'USR-004', name: 'Amit Singh', email: 'amit@printstation.in', role: 'Viewer', status: 'Inactive', jobs: 14, lastActive: '2 days ago' },
  { id: 'USR-005', name: 'Neha Gupta', email: 'neha@printstation.in', role: 'Operator', status: 'Active', jobs: 72, lastActive: '1 hour ago' },
  { id: 'USR-006', name: 'Vikash Kumar', email: 'vikash@printstation.in', role: 'Viewer', status: 'Active', jobs: 21, lastActive: '3 hours ago' },
  { id: 'USR-007', name: 'Anjali Patel', email: 'anjali@printstation.in', role: 'Operator', status: 'Active', jobs: 59, lastActive: '5 hours ago' },
  { id: 'USR-008', name: 'Rohit Jain', email: 'rohit@printstation.in', role: 'Viewer', status: 'Inactive', jobs: 8, lastActive: '5 days ago' },
  { id: 'USR-009', name: 'Sonal Mehta', email: 'sonal@printstation.in', role: 'Operator', status: 'Active', jobs: 42, lastActive: 'Yesterday' },
  { id: 'USR-010', name: 'Karan Malhotra', email: 'karan@printstation.in', role: 'Viewer', status: 'Active', jobs: 17, lastActive: 'Yesterday' },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function getStoredUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || 'null');
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

function getStatusClass(status) {
  return status.toLowerCase();
}

const EMPTY_FORM = { name: '', email: '', role: 'Operator', status: 'Active' };

export default function Users() {
  const [session] = useState(getSession);
  const [users, setUsers] = useState(getStoredUsers);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All Roles');
  const [status, setStatus] = useState('All Status');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const displayName = session?.name?.trim() || 'Admin';

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || [user.id, user.name, user.email, user.role].some((value) => value.toLowerCase().includes(query));
      const matchesRole = role === 'All Roles' || user.role === role;
      const matchesStatus = status === 'All Status' || user.status === status;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, role, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filteredUsers.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  const saveUsers = (nextUsers) => {
    setUsers(nextUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  };

  const handleNavigation = (item) => {
    setMobileOpen(false);
    if (item.path) window.location.href = item.path;
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('/admin');
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name || !email) return;

    if (editingUser) {
      saveUsers(users.map((user) => user.id === editingUser.id ? { ...user, ...form, name, email } : user));
    } else {
      const nextId = `USR-${String(users.length + 1).padStart(3, '0')}`;
      saveUsers([{ id: nextId, name, email, role: form.role, status: form.status, jobs: 0, lastActive: 'Never' }, ...users]);
      setPage(1);
    }
    closeModal();
  };

  const handleDelete = (user) => {
    if (window.confirm(`Delete ${user.name}? This action cannot be undone.`)) {
      saveUsers(users.filter((item) => item.id !== user.id));
      setPage(1);
    }
  };

  const handleToggleStatus = (user) => {
    saveUsers(users.map((item) => item.id === user.id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item));
  };

  if (!session) {
    window.location.replace('/admin');
    return null;
  }

  return (
    <div className="admin-dashboard users-page">
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
            return <button key={item.label} type="button" className={`admin-nav-item ${item.label === 'Users' ? 'is-active' : ''}`} onClick={() => handleNavigation(item)}><Icon size={20} strokeWidth={1.9} /><span>{item.label}</span></button>;
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" type="button"><CircleHelp size={20} strokeWidth={1.9} /><span>Help Center</span></button>
          <button className="admin-nav-item" type="button" onClick={handleLogout}><LogOut size={20} strokeWidth={1.9} /><span>Logout</span></button>
        </div>
      </aside>

      {mobileOpen && <button className="admin-sidebar-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <main className="admin-main">
        <header className="admin-topbar users-topbar">
          <button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div className="admin-page-heading">
            <span className="admin-mobile-brand">PrintStation</span>
            <h1>Users</h1>
            <p>Manage administrators, operators, and users with print access.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip"><span className="admin-user-avatar"><UsersIcon size={17} /></span><span>{displayName}</span></div>
          </div>
        </header>

        <section className="admin-content users-content" aria-label="User management">
          <div className="users-toolbar">
            <div className="users-toolbar-copy">
              <div className="users-count"><UsersIcon size={19} /><strong>{users.length}</strong><span>Total Users</span></div>
            </div>
            <button className="users-add-button" type="button" onClick={openCreateModal}><UserPlus size={18} />Add User</button>
          </div>

          <section className="users-card">
            <div className="users-filter-bar">
              <label className="users-search">
                <Search size={18} aria-hidden="true" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search users..." aria-label="Search users" />
              </label>
              <label className="users-select">
                <span>Role</span>
                <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option>All Roles</option><option>Administrator</option><option>Operator</option><option>Viewer</option></select>
              </label>
              <label className="users-select">
                <span>Status</span>
                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option>All Status</option><option>Active</option><option>Inactive</option></select>
              </label>
            </div>

            <div className="users-table-wrap">
              <table className="users-table">
                <thead><tr><th>User</th><th>User ID</th><th>Role</th><th>Print Jobs</th><th>Status</th><th>Last Active</th><th>Actions</th></tr></thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td><div className="users-person"><span className="users-avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div></td>
                      <td><code>{user.id}</code></td>
                      <td><span className={`users-role users-role--${user.role.toLowerCase()}`}>{user.role}</span></td>
                      <td>{user.jobs}</td>
                      <td><button type="button" className={`users-status users-status--${getStatusClass(user.status)}`} onClick={() => handleToggleStatus(user)} title="Toggle user status"><i />{user.status}</button></td>
                      <td className="users-last-active">{user.lastActive}</td>
                      <td><div className="users-actions"><button type="button" onClick={() => openEditModal(user)} aria-label={`Edit ${user.name}`}><Pencil size={16} /></button><button type="button" className="is-danger" onClick={() => handleDelete(user)} aria-label={`Delete ${user.name}`}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!visibleUsers.length && <div className="users-empty"><UsersIcon size={28} /><strong>No users found</strong><span>Try changing the search or filter values.</span></div>}
            </div>

            <footer className="users-pagination">
              <span>Showing {rangeStart} to {rangeEnd} of {filteredUsers.length} users</span>
              <div>
                <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page">‹</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((number) => <button key={number} type="button" className={currentPage === number ? 'is-current' : ''} onClick={() => setPage(number)}>{number}</button>)}
                <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next page">›</button>
              </div>
            </footer>
          </section>

          <div className="users-note"><Check size={15} /><span>User changes are stored locally for this frontend demo. Connect your backend/database for persistent multi-admin data.</span></div>
        </section>
      </main>

      {modalOpen && (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="users-modal-title">
            <header className="users-modal-header"><div><span className="users-modal-icon"><UserPlus size={20} /></span><div><h2 id="users-modal-title">{editingUser ? 'Edit User' : 'Add User'}</h2><p>{editingUser ? 'Update account details and access.' : 'Create a new PrintStation user.'}</p></div></div><button type="button" onClick={closeModal} aria-label="Close modal"><X size={20} /></button></header>
            <form className="users-form" onSubmit={handleSubmit}>
              <label><span>Full Name</span><input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Rahul Sharma" required /></label>
              <label><span>Email Address</span><input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="e.g. rahul@printstation.in" required /></label>
              <div className="users-form-grid">
                <label><span>Role</span><select name="role" value={form.role} onChange={handleFormChange}><option>Administrator</option><option>Operator</option><option>Viewer</option></select></label>
                <label><span>Status</span><select name="status" value={form.status} onChange={handleFormChange}><option>Active</option><option>Inactive</option></select></label>
              </div>
              <footer className="users-form-actions"><button type="button" className="users-cancel-button" onClick={closeModal}>Cancel</button><button type="submit" className="users-save-button">{editingUser ? 'Save Changes' : 'Add User'}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
