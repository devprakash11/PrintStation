import { ArrowLeft, FileUp, Printer, CheckCircle2 } from 'lucide-react';

export default function PrintUpload() {
  let printer = null;
  try {
    printer = JSON.parse(sessionStorage.getItem('printstation_printer') || 'null');
  } catch {
    printer = null;
  }

  return (
    <div className="print-flow-page">
      <header className="print-flow-header">
        <a href="/print" className="flow-back-link"><ArrowLeft size={18} /> Back</a>
        <div className="flow-brand"><Printer size={24} /><span>PrintStation</span></div>
        <div className="flow-step">Step 2 of 4</div>
      </header>

      <main className="upload-step-main container">
        <div className="scanner-heading">
          <div className="flow-eyebrow"><span /> Printer connected</div>
          <h1>Upload your document</h1>
          <p>Your printer is ready. Choose a JPG, PNG, or PDF file to continue.</p>
        </div>

        <section className="upload-placeholder-card">
          <div className="upload-placeholder-icon"><FileUp size={34} /></div>
          <h2>Document upload</h2>
          <p>Upload functionality is the next step in the PrintStation printing flow.</p>
          {printer && <div className="connected-printer"><CheckCircle2 size={18} /><span>{printer.name} connected</span></div>}
        </section>
      </main>
    </div>
  );
}
