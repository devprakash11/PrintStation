import { ChevronLeft, ChevronRight, FileText, Minus, Plus, X } from 'lucide-react';

export default function PrintSetting({ file, previewUrl, pages, setPages, customPages, setCustomPages, copies, setCopies, previewPage, setPreviewPage, onRemove }) {
  if (!file || !previewUrl) return null;

  const isPdf = file.type === 'application/pdf';

  return (
    <section className="document-workspace">
      <div className="document-preview-panel">
        <div className="workspace-header">
          <div><FileText size={19} /><strong>Document Preview</strong></div>
          <button type="button" className="remove-file-btn" onClick={onRemove} aria-label="Remove document"><X size={17} /></button>
        </div>

        <div className="document-preview-stage">
          {isPdf ? (
            <iframe title="PDF document preview" src={`${previewUrl}#page=${previewPage}&view=FitH`} className="pdf-preview" />
          ) : (
            <img src={previewUrl} alt="Uploaded document preview" className="image-preview" />
          )}
        </div>

        {isPdf && (
          <div className="preview-navigation">
            <button type="button" disabled={previewPage <= 1} onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} aria-label="Previous preview page"><ChevronLeft size={18} /></button>
            <span>Preview page {previewPage}</span>
            <button type="button" onClick={() => setPreviewPage((p) => p + 1)} aria-label="Next preview page"><ChevronRight size={18} /></button>
          </div>
        )}

        <div className="selected-file">
          <FileText size={17} />
          <span>{file.name}</span>
          <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
        </div>
      </div>

      <aside className="print-options-panel">
        <div className="option-section">
          <span className="option-label">Pages</span>
          <div className="option-segmented">
            <button type="button" className={pages === 'all' ? 'active' : ''} onClick={() => setPages('all')}>All</button>
            <button type="button" className={pages === 'custom' ? 'active' : ''} onClick={() => setPages('custom')}>Custom</button>
          </div>
          {pages === 'custom' && (
            <input className="custom-pages-input" value={customPages} onChange={(e) => setCustomPages(e.target.value.replace(/[^0-9,\- ]/g, ''))} placeholder="e.g. 1, 3-5, 8" aria-label="Custom pages" />
          )}
          <small className="option-help">{pages === 'all' ? 'Print every page in the document.' : 'Enter page numbers or ranges separated by commas.'}</small>
        </div>

        <div className="option-section">
          <span className="option-label">Copies</span>
          <div className="copies-control">
            <button type="button" disabled={copies <= 1} onClick={() => setCopies((c) => Math.max(1, c - 1))} aria-label="Decrease copies"><Minus size={17} /></button>
            <strong>{copies}</strong>
            <button type="button" disabled={copies >= 99} onClick={() => setCopies((c) => Math.min(99, c + 1))} aria-label="Increase copies"><Plus size={17} /></button>
          </div>
          <small className="option-help">Choose from 1 to 99 copies.</small>
        </div>

        <div className="print-summary">
          <div><span>Document</span><strong>{file.name}</strong></div>
          <div><span>Pages</span><strong>{pages === 'all' ? 'All pages' : customPages || 'Custom pages'}</strong></div>
          <div><span>Copies</span><strong>{copies}</strong></div>
        </div>

        <button type="button" className="primary-button continue-print-button">Continue</button>
      </aside>
    </section>
  );
}
