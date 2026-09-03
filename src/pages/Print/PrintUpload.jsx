import { useRef, useState } from 'react';
import { ArrowLeft, FileUp, Printer, CheckCircle2, X, Upload } from 'lucide-react';

export default function PrintUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  let printer = null;
  try {
    printer = JSON.parse(sessionStorage.getItem('printstation_printer') || 'null');
  } catch {
    printer = null;
  }

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      return;
    }
    setError('');
    setFile(selectedFile);
  };

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
          <p>Your printer is ready. Upload a JPG, PNG, or PDF to continue.</p>
        </div>

        <section className="upload-placeholder-card">
          <div className="upload-placeholder-icon"><FileUp size={34} /></div>
          <h2>{file ? file.name : 'Upload your document'}</h2>
          <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type === 'application/pdf' ? 'PDF' : 'Image'}` : 'Drag and drop your file here, or use the button below.'}</p>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <button className="upload-document-btn" type="button" onClick={() => inputRef.current?.click()}>
            <Upload size={19} />
            {file ? 'Choose Another Document' : 'Upload Document'}
          </button>

          {error && <p className="upload-error">{error}</p>}

          {file && (
            <div className="connected-printer upload-success">
              <CheckCircle2 size={18} />
              <span>Document uploaded successfully</span>
              <button type="button" className="remove-file-btn" aria-label="Remove document" onClick={() => setFile(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {printer && <div className="connected-printer"><CheckCircle2 size={18} /><span>{printer.name} connected</span></div>}
        </section>
      </main>
    </div>
  );
}
