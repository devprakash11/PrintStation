import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Printer, CheckCircle2, X, FolderOpen, FileUp, Minus, Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function PrintUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [pages, setPages] = useState('all');
  const [customPages, setCustomPages] = useState('');
  const [copies, setCopies] = useState(1);
  const [previewPage, setPreviewPage] = useState(1);

  let printer = null;
  try { printer = JSON.parse(sessionStorage.getItem('printstation_printer') || 'null'); } catch { printer = null; }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError(''); setFile(selectedFile); setPreviewUrl(URL.createObjectURL(selectedFile));
    setPages('all'); setCustomPages(''); setCopies(1); setPreviewPage(1);
  };

  const handleDrop = (event) => { event.preventDefault(); setIsDragging(false); handleFile(event.dataTransfer.files?.[0]); };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(''); setError(''); setPreviewPage(1); setPages('all'); setCustomPages(''); setCopies(1);
    if (inputRef.current) inputRef.current.value = '';
  };

  const isPdf = file?.type === 'application/pdf';

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
          <p>Upload a PDF, JPG, or PNG, preview it, then choose pages and copies.</p>
        </div>

        {!file ? (
          <section className={`document-upload-card ${isDragging ? 'is-dragging' : ''}`} onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }} onDragOver={(e) => e.preventDefault()} onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragging(false); }} onDrop={handleDrop}>
            <div className="document-upload-icon"><FileUp size={34} /></div>
            <h2>Drag & drop your document</h2>
            <p>Drag your file and drop it anywhere inside this area</p>
            <div className="upload-divider"><span>or</span></div>
            <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
            <button className="manual-upload-button" type="button" onClick={() => inputRef.current?.click()}><FolderOpen size={19} /> Manual Upload</button>
            <span className="upload-format-note">Supported formats: PDF, JPG, PNG</span>
            {error && <p className="upload-error">{error}</p>}
          </section>
        ) : (
          <section className="document-workspace">
            <div className="document-preview-panel">
              <div className="workspace-header"><div><FileText size={19} /><strong>Document Preview</strong></div><button type="button" className="remove-file-btn" onClick={removeFile} aria-label="Remove document"><X size={17} /></button></div>
              <div className="document-preview-stage">
                {isPdf ? <iframe title="PDF document preview" src={`${previewUrl}#page=${previewPage}&view=FitH`} className="pdf-preview" /> : <img src={previewUrl} alt="Uploaded document preview" className="image-preview" />}
              </div>
              {isPdf && <div className="preview-navigation"><button type="button" disabled={previewPage <= 1} onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}><ChevronLeft size={18} /></button><span>Preview page {previewPage}</span><button type="button" onClick={() => setPreviewPage((p) => p + 1)}><ChevronRight size={18} /></button></div>}
              <div className="selected-file"><CheckCircle2 size={17} /><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></div>
            </div>

            <aside className="print-options-panel">
              <div className="option-section"><span className="option-label">Pages</span><div className="option-segmented"><button type="button" className={pages === 'all' ? 'active' : ''} onClick={() => setPages('all')}>All</button><button type="button" className={pages === 'custom' ? 'active' : ''} onClick={() => setPages('custom')}>Custom</button></div>{pages === 'custom' && <input className="custom-pages-input" value={customPages} onChange={(e) => setCustomPages(e.target.value.replace(/[^0-9,\- ]/g, ''))} placeholder="e.g. 1, 3-5, 8" aria-label="Custom pages" />}<small className="option-help">{pages === 'all' ? 'Print every page in the document.' : 'Enter page numbers or ranges separated by commas.'}</small></div>
              <div className="option-section"><span className="option-label">Copies</span><div className="copies-control"><button type="button" disabled={copies <= 1} onClick={() => setCopies((c) => Math.max(1, c - 1))} aria-label="Decrease copies"><Minus size={17} /></button><strong>{copies}</strong><button type="button" disabled={copies >= 99} onClick={() => setCopies((c) => Math.min(99, c + 1))} aria-label="Increase copies"><Plus size={17} /></button></div><small className="option-help">Choose from 1 to 99 copies.</small></div>
              <div className="print-summary"><div><span>Document</span><strong>{file.name}</strong></div><div><span>Pages</span><strong>{pages === 'all' ? 'All pages' : customPages || 'Custom pages'}</strong></div><div><span>Copies</span><strong>{copies}</strong></div></div>
              <button type="button" className="primary-button continue-print-button">Continue</button>
            </aside>
          </section>
        )}

        {printer && <div className="connected-printer upload-printer-status"><CheckCircle2 size={18} /><span>{printer.name} connected</span></div>}
      </main>
    </div>
  );
}
