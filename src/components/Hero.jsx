import { ArrowRight, ScanLine, ShieldCheck, Zap } from 'lucide-react';
import { homeData } from '../data/homeData';

export default function Hero() {
  return (
    <main className="hero" id="start-printing">
      <div className="hero-grid" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            {homeData.eyebrow}
          </div>
          <h1>{homeData.title.split('\n').map((line, index) => (
            <span key={line} className={index === 1 ? 'accent-line' : ''}>{line}</span>
          ))}</h1>
          <p>{homeData.description}</p>
          <a className="primary-button" href="/print">
            {homeData.primaryAction}
            <ArrowRight size={19} strokeWidth={2.1} aria-hidden="true" />
          </a>
          <div className="trust-row" aria-label="PrintStation benefits">
            <span><ScanLine size={16} /> QR to connect</span>
            <span><Zap size={16} /> Quick setup</span>
            <span><ShieldCheck size={16} /> Secure flow</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Wireless printing illustration">
          <div className="visual-glow" />
          <div className="phone-card">
            <div className="phone-top"><span /><span /><span /></div>
            <div className="phone-screen">
              <div className="screen-label">PRINTSTATION</div>
              <div className="qr-frame">
                <div className="qr-pattern" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                </div>
                <span>SCAN</span>
              </div>
              <div className="connection-pill"><span /> Ready to print</div>
            </div>
          </div>
          <div className="printer-card">
            <div className="printer-status"><span /> Connected</div>
            <div className="printer-body">
              <div className="printer-slot" />
              <div className="paper-sheet"><span /><span /><span /></div>
            </div>
            <strong>PrintStation</strong>
          </div>
          <div className="signal signal-one" />
          <div className="signal signal-two" />
        </div>
      </div>
    </main>
  );
}