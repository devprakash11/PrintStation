import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, LoaderCircle, QrCode, ShieldCheck } from 'lucide-react';

function parsePrinterQr(value) {
  const raw = String(value || '').trim();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.printerId || parsed.id || parsed.model || parsed.name)) {
      return {
        id: parsed.printerId || parsed.id || 'Unknown printer',
        name: parsed.name || parsed.model || 'PrintStation Printer',
        model: parsed.model || '',
      };
    }
  } catch {
    // Continue with plain-text QR formats.
  }

  if (raw.toLowerCase().startsWith('printstation:')) {
    const parts = raw.split(':');
    return {
      id: parts[1] || raw,
      name: parts[2] || 'PrintStation Printer',
      model: parts.slice(3).join(':') || '',
    };
  }

  return raw ? { id: raw, name: 'PrintStation Printer', model: '' } : null;
}

export default function PrintScanner() {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [printer, setPrinter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let scanner;

    const start = async () => {
      try {
        // html5-qrcode uses the browser camera APIs and provides a reliable
        // QR decoder across mobile Chrome, Safari and Edge.
        if (!window.Html5Qrcode) {
          setStatus('error');
          setError('QR scanner is still loading. Please refresh the page and try again.');
          return;
        }

        scanner = new window.Html5Qrcode('printstation-qr-reader');
        scannerRef.current = scanner;

        const cameras = await window.Html5Qrcode.getCameras();
        if (!cameras?.length) {
          throw Object.assign(new Error('No camera found'), { name: 'NotFoundError' });
        }

        // Prefer the rear/environment camera on mobile devices.
        const rearCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label));
        const cameraId = rearCamera?.id || cameras[0].id;

        if (cancelled) return;

        setStatus('scanning');
        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          async (decodedText) => {
            if (cancelled || printer) return;
            const detected = parsePrinterQr(decodedText);
            if (!detected) return;

            setPrinter(detected);
            setStatus('connected');
            try { await scanner.stop(); } catch { /* already stopped */ }
          },
          () => {
            // Decoder misses are expected while positioning the QR code.
          },
        );
      } catch (scanError) {
        if (cancelled) return;
        setStatus('error');
        if (scanError?.name === 'NotAllowedError' || scanError?.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Allow camera access for PrintStation and try again.');
        } else if (scanError?.name === 'NotFoundError') {
          setError('No camera was found on this device.');
        } else {
          setError('Unable to start the camera scanner. Check browser camera permission and try again.');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => scanner.clear().catch(() => {}));
      }
      scannerRef.current = null;
    };
  }, []);

  function handleNext() {
    if (!printer) return;
    sessionStorage.setItem('printstation_printer', JSON.stringify(printer));
    window.location.href = '/print/upload';
  }

  function handleRetry() {
    window.location.reload();
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
                <span className="scan-corner top-left" />
                <span className="scan-corner top-right" />
                <span className="scan-corner bottom-left" />
                <span className="scan-corner bottom-right" />
                {isScanning && <span className="scan-line" />}
              </div>
              {status === 'loading' && <div className="scanner-state"><LoaderCircle className="spin" size={30} /><strong>Starting camera…</strong></div>}
              {status === 'error' && <div className="scanner-state"><Camera size={30} /><strong>Camera access needed</strong><span>{error}</span><button type="button" className="secondary-button" onClick={handleRetry}>Try again</button></div>}
              {status === 'connected' && <div className="scanner-success"><CheckCircle2 size={38} /><strong>Printer found</strong></div>}
            </div>

            <div className="scanner-status-row">
              <span className={`scanner-status-dot ${isScanning ? 'is-live' : ''}`} />
              <span>{status === 'connected' ? 'Printer detected successfully' : 'Scanning with your camera…'}</span>
            </div>
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
      </main>
    </div>
  );
}
