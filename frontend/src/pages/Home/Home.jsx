import Navbar from '../../components/layout/Navbar';
import Hero from '../../components/layout/Hero';
import Footer from '../../components/layout/Footer';
import '../../styles/allPage.css';

export default function Home() {
  return (
    <div className="app-shell">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  );
}