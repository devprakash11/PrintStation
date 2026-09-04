import Home from './pages/Home/Home';
import PrintScanner from './pages/Print/PrintScanner';
import PrintUpload from './pages/Print/PrintUpload';
import AdminAuth from './pages/Admin/AdminAuth';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PrinterManagement from './pages/Admin/PrinterManagement';
import QrCodeManagement from './pages/Admin/QrCodeManagement';
import PrintJob from './pages/Admin/PrintJob';
import Users from './pages/Admin/Users';
import Reports from './pages/Admin/Reports';
import Settings from './pages/Admin/Settings';
import HelpCenter from './pages/Admin/HelpCenter';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/print') return <PrintScanner />;
  if (path === '/print/upload') return <PrintUpload />;
  if (path === '/admin/qr-codes') return <QrCodeManagement />;
  if (path === '/admin/printers') return <PrinterManagement />;
  if (path === '/admin/print-jobs') return <PrintJob />;
  if (path === '/admin/users') return <Users />;
  if (path === '/admin/reports') return <Reports />;
  if (path === '/admin/settings') return <Settings />;
  if (path === '/admin/help') return <HelpCenter />;
  if (path === '/admin/dashboard') return <AdminDashboard />;
  if (path === '/admin') return <AdminAuth />;

  return <Home />;
}
