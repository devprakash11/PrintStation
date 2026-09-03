import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, LoaderCircle, QrCode, ShieldCheck } from 'lucide-react';

function parsePrinterQr(value) {
  const raw = String(value || '').trim();

  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.printerId || parsed.model || parsed.name)) {
      return {
        id: parsed.printerId || parsed.id || 'Unknown printer',
        name: parsed.name || parsed.model || 'Printer',
        model: parsed.model || '',
      };
    }
  } catch {
    // Support simple printer QR payloads too.
  }

  if (raw.toLowerCase().startsWith('printstation:')) {
    const parts = raw.split(':');
    return {
      id: parts[1] || raw,
      name: parts[2] || 'PrintStation Printer',
      model: parts.slice(3).join(':') || '',
    };
  }

  if (raw) {
    return { id: raw, name: 'PrintStation Printer', model: '' };
  }

  return null;
}

export default function PrintScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const detectorRef = useRef(null);
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState('');
  const [printer, setPrinter] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      if (!('BarcodeDetector' in window)) {
        setStatus('unsupported');
        setError('QR scanning is not supported in this browser. Please use the latest Chrome or Edge on a device with a camera.');
        return;
      }

      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        if (!supported.includes('qr_code')) {
          throw new Error('QR scanning is not supported by this browser.');
        }

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        detectorRef.current = detector;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('scanning');

        const scan = async () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2 || printer) return;

          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const detected = parsePrinterQr(codes[0].rawValue);
              if (detected) {
                setPrinter(detected);
                setStatus('connected');
                return;
              }
            }
          } catch {
            // Camera frames can occasionally fail while the video is initializing.
          }

          frameRef.current = requestAnimationFrame(scan);
        };

        frameRef.current = requestAnimationFrame(scan);
      } catch (scanError) {
        if (cancelled) return;
        setStatus('error');
        if (scanError?.name === 'NotAllowedError' || scanError?.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Allow camera access and try again.');
        } else if (scanError?.name === 'NotFoundError') {
          setError('No camera was found on this device.');
        } else {
          setError('Unable to start the QR scanner. Please check camera permissions and try again.');
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, [printer]);

  function handleNext() {
    if (!printer) return;
    sessionStorage.setItem('printstation_printer', JSON.stringify(printer));
    window.location.href = '/print/upload';
  }

  function handleRetry() {
    window.location.reload();
  }

  const isScanning = status === 'starting' || status === 'scanning';

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
          <p>Point your camera at the QR code displayed on your printer to connect your mobile device.</p>
        </div>

        <div className="scanner-layout">
          <section className="scanner-card">
            <div className="scanner-viewport">
              <video ref={videoRef} className="scanner-video" playsInline muted aria-label="Camera QR scanner" />
              <div className="scanner-overlay" aria-hidden="true">
                <span className="scan-corner top-left" />
                <span className="scan-corner top-right" />
                <span className="scan-corner bottom-left" />
                <span className="scan-corner bottom-right" />
                {isScanning && <span className="scan-line" />}
              </div>
              {status === 'starting' && (
                <div className="scanner-state"><LoaderCircle className="spin" size={30} /><strong>Starting camera…</strong></div>
              )}
              {status === 'unsupported' && (
                <div className="scanner-state"><Camera size={30} /><strong>Camera scanner unavailable</strong><span>{error}</span></div>
              )}
              {status === 'error' && (
                <div className="scanner-state"><Camera size={30} /><strong>Camera access needed</strong><span>{error}</span><button type="button" className="secondary-button" onClick={handleRetry}>Try again</button></div>
              )}
              {status === 'connected' && (
                <div className="scanner-success"><CheckCircle2 size={38} /><strong>Printer found</strong></div>
              )}
            </div>

            <div className="scanner-status-row">
              <span className={`scanner-status-dot ${isScanning ? 'is-live' : ''}`} />
              <span>{status === 'connected' ? 'Printer detected successfully' : 'Scanning for a printer QR code…'}</span>
            </div>
          </section>

          <aside className="scanner-info">
            <div className="info-icon"><QrCode size={22} /></div>
            <h2>How to connect</h2>
            <ol>
              <li><span>1</span><div><strong>Find the QR code</strong><p>Locate the PrintStation QR code on your printer.</p></div></li>
              <li><span>2</span><div><strong>Scan the code</strong><p>Keep the code inside the scanning frame.</p></div></li>
              <li><span>3</span><div><strong>Continue</strong><p>After detection, tap Next to start uploading your document.</p></div></li>
            </ol>
            <div className="secure-note"><ShieldCheck size={18} /><span>Your printer connection is handled securely on this device.</span></div>
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
