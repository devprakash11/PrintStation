import BrandLogo from '../common/BrandLogo';
import { homeData } from '../../data/homeData';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <BrandLogo />
        <p>{homeData.footer}</p>
      </div>
    </footer>
  );
}