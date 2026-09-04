import Home from './pages/Home/Home';
import PrintScanner from './pages/Print/PrintScanner';
import PrintUpload from './pages/Print/PrintUpload';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/print') return <PrintScanner />;
  if (path === '/print/upload') return <PrintUpload />;

  return <Home />;
}
