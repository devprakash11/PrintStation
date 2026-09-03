import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Footer from '../../components/Footer';

export default function Home() {
  return (
    <div className="app-shell">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  );
}