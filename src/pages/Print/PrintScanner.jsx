import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, FileUp, LoaderCircle, QrCode, ShieldCheck } from 'lucide-react';

const QR_SCANNER_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';

function parsePrinterQr(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.printerId || parsed.id || parsed.model || parsed.name)) {
      return { id: parsed.printerId || parsed.id || 'Unknown printer', name: parsed.name || parsed.model || 'PrintStation Printer', model: parsed.model || '' };
    }
  } catch {}
  if (raw.toLowerCase().startsWith('printstation:')) {
    const parts = raw.split(':');
    return { id: parts[1] || raw, name: parts[2] || 'PrintStation Printer', model: parts.slice(3).join(':') || '' };
  }
  return { id: raw, name: 'PrintStation Printer', model: '' };
}

function loadQrScannerLibrary() {
  if (window.Html5Qrcode) return Promise.resolve(window.Html5Qrcode);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${QR_SCANNER_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Html5Qrcode), { once: true });
      existing.addEventListener('error', () => reject(new Error('QR scanner library failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = QR_SCANNER_URL;
    script.async = true;
    script.onload = () => window.Html5Qrcode ? resolve(window.Html5Qrcode) : reject(new Error('QR scanner library loaded without Html5Qrcode'));
    script.onerror = () => reject(new Error('QR scanner library failed to load'));
    document.head.appendChild(script);
  });
}

export default function PrintScanner() {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [printer, setPrinter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let scanner = null;

    async function startScanner() {
      try {
        const Html5Qrcode = await loadQrScannerLibrary();
        if (cancelled) return;
        scanner = new Html5Qrcode('printstation-qr-reader', { verbose: false });
        scannerRef.current = scanner;
        setStatus('scanning');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (w, h) => { const size = Math.min(Math.floor(Math.min(w, h) * 0.68), 300); return { width: size, height: size }; }, aspectRatio: 1, disableFlip: false },
          async (decodedText) => {
            if (cancelled || printer) return;
            const detected = parsePrinterQr(decodedText);
            if (!detected) return;
            setPrinter(detected);
            setStatus('connected');
            try { await scanner.stop(); } catch {}
          },
          () => {},
        );
      } catch (scanError) {
        if (cancelled) return;
        setStatus('error');
        const message = String(scanError?.message || '').toLowerCase();
        if (scanError?.name === 'NotAllowedError' || scanError?.name === 'PermissionDeniedError' || message.includes('permission')) setError('Camera permission was denied. Allow camera access for PrintStation and tap Try again.');
        else if (scanError?.name === 'NotFoundError' || (message.includes('camera') && message.includes('not found'))) setError('No camera was found on this device.');
        else if (message.includes('library') || message.includes('failed to load')) setError('The QR scanner could not load. Check your internet connection and try again.');
        else setError('Unable to start the camera. Use HTTPS or localhost and allow camera access.');
      }
    }
    startScanner();
    return () => {
      cancelled = true;
      if (scanner) scanner.stop().catch(() => {}).finally(() => scanner.clear().catch(() => {}));
      scannerRef.current = null;
    };
  }, []);

  function handleNext() {
    if (!printer) return;
    sessionStorage.setItem('printstation_printer', JSON.stringify(printer));
    window.location.href = '/print/upload';
  }

  const isScanning = status === 'loading' || status === 'scanning';

  return (
    <div className="print-flow-page">
      <header className="print-flow-header">
        <a href="/" className="flow-back-link"><ArrowLeft size={18} /> Back</a>
        <div className="flow-brand"><QrCode size={24} /><span>PrintStation</span></div>
        <div className="flow-step">Step 1 of 4</div>
      </header>

      <main className="scanner-main container">
        <div className="scanner-heading">
          <div className="flow-eyebrow"><span /> Connect your printer</div>
          <h1>Scan the printer QR code</h1>
          <p>Allow camera access, then point your camera at the QR code displayed on your printer.</p>
        </div>

        <div className="scanner-layout">
          <section className="scanner-card">
            <div className="scanner-viewport">
              <div id="printstation-qr-reader" className="scanner-reader" />
              <div className="scanner-overlay" aria-hidden="true">
                <span className="scan-corner top-left" /><span className="scan-corner top-right" /><span className="scan-corner bottom-left" /><span className="scan-corner bottom-right" />
                {isScanning && <span className="scan-line" />}
              </div>
              {status === 'loading' && <div className="scanner-state"><LoaderCircle className="spin" size={30} /><strong>Starting camera…</strong></div>}
              {status === 'error' && <div className="scanner-state"><Camera size={30} /><strong>Camera access needed</strong><span>{error}</span><button type="button" className="secondary-button" onClick={() => window.location.reload()}>Try again</button></div>}
              {status === 'connected' && <div className="scanner-success"><CheckCircle2 size={38} /><strong>Printer found</strong></div>}
            </div>
            <div className="scanner-status-row"><span className={`scanner-status-dot ${isScanning ? 'is-live' : ''}`} /><span>{status === 'connected' ? 'Printer detected successfully' : 'Scanning with your camera…'}</span></div>
          </section>

          <aside className="scanner-info">
            <div className="info-icon"><QrCode size={22} /></div>
            <h2>How to connect</h2>
            <ol>
              <li><span>1</span><div><strong>Find the printer QR</strong><p>Locate the PrintStation QR code on your printer.</p></div></li>
              <li><span>2</span><div><strong>Allow camera access</strong><p>When prompted, allow PrintStation to use your camera.</p></div></li>
              <li><span>3</span><div><strong>Scan and continue</strong><p>Keep the QR code inside the frame, then tap Next.</p></div></li>
            </ol>
            <div className="secure-note"><ShieldCheck size={18} /><span>Camera access is used only for scanning the printer QR code.</span></div>
          </aside>
        </div>

        {printer && (
          <div className="printer-detected">
            <div><CheckCircle2 size={22} /><div><strong>{printer.name}</strong><span>{printer.model ? `${printer.model} · ` : ''}{printer.id}</span></div></div>
            <button type="button" className="primary-button flow-next-button" onClick={handleNext}>Next</button>
          </div>
        )}

        <a className="upload-document-scanner-button" href="/print/upload">
          <FileUp size={19} /> Upload Document
        </a>
      </main>
    </div>
  );
}
