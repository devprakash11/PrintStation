import Home from './pages/Home/Home';
import PrintScanner from './pages/Print/PrintScanner';
import PrintUpload from './pages/Print/PrintUpload';
import AdminAuth from './pages/Admin/AdminAuth';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PrinterManagement from './pages/Admin/PrinterManagement';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/print') return <PrintScanner />;
  if (path === '/print/upload') return <PrintUpload />;
  if (path === '/admin/printers') return <PrinterManagement />;
  if (path === '/admin/dashboard') return <AdminDashboard />;
  if (path === '/admin') return <AdminAuth />;

  return <Home />;
}
