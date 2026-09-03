import { useRef, useState } from 'react';
import { ArrowLeft, FileUp, Printer, CheckCircle2, X, FolderOpen } from 'lucide-react';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function PrintUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  let printer = null;
  try { printer = JSON.parse(sessionStorage.getItem('printstation_printer') || 'null'); } catch { printer = null; }

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      return;
    }
    setError('');
    setFile(selectedFile);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
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
          <p>Choose drag & drop or manually select a JPG, PNG, or PDF document.</p>
        </div>

        <section
          className={`document-upload-card ${isDragging ? 'is-dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }}
          onDrop={handleDrop}
        >
          <div className="document-upload-icon"><FileUp size={34} /></div>
          <h2>Drag & drop your document</h2>
          <p>Drag your file and drop it anywhere inside this area</p>
          <div className="upload-divider"><span>or</span></div>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
          <button className="manual-upload-button" type="button" onClick={() => inputRef.current?.click()}>
            <FolderOpen size={19} /> Manual Upload
          </button>
          <span className="upload-format-note">Supported formats: PDF, JPG, PNG</span>
          {error && <p className="upload-error">{error}</p>}
          {file && (
            <div className="selected-document">
              <div className="selected-document-info">
                <CheckCircle2 size={20} />
                <div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type === 'application/pdf' ? 'PDF' : 'Image'}</span></div>
              </div>
              <button type="button" className="remove-file-btn" aria-label="Remove document" onClick={removeFile}><X size={17} /></button>
            </div>
          )}
          {printer && <div className="connected-printer"><CheckCircle2 size={18} /><span>{printer.name} connected</span></div>}
        </section>
      </main>
    </div>
  );
}
