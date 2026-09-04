import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Home from './pages/Home/Home';
import PrintScanner from './pages/Print/PrintScanner';
import PrintUpload from './pages/Print/PrintUpload';
import AdminAuth from './pages/Admin/Auth/AdminAuth';
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
import PrinterManagement from './pages/Admin/Printers/PrinterManagement';
import QrCodeManagement from './pages/Admin/QRCodes/QrCodeManagement';
import PrintJob from './pages/Admin/PrintJobs/PrintJob';
import Users from './pages/Admin/Users/Users';
import Reports from './pages/Admin/Reports/Reports';
import Settings from './pages/Admin/Settings/Settings';
import HelpCenter from './pages/Admin/HelpCenter/HelpCenter';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/print" element={<PrintScanner />} />
      <Route path="/print/upload" element={<PrintUpload />} />
      <Route path="/admin" element={<AdminAuth />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/printers" element={<PrinterManagement />} />
        <Route path="/admin/qr-codes" element={<QrCodeManagement />} />
        <Route path="/admin/print-jobs" element={<PrintJob />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/help" element={<HelpCenter />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
