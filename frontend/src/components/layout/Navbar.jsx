import { Settings2 } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { homeData } from '../../data/homeData';

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="container navbar" aria-label="Primary navigation">
        <BrandLogo />
        <a className="admin-button" href="/admin">
          <Settings2 size={17} strokeWidth={1.9} aria-hidden="true" />
          <span>{homeData.adminAction}</span>
        </a>
      </nav>
    </header>
  );
}