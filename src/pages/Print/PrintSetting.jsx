import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Minus,
  Plus,
  X,
  Palette,
  Ruler,
  RotateCw,
} from 'lucide-react';

const PAPER_SIZES = [
  { value: 'A4', label: 'A4', dimensions: '210 × 297 mm' },
  { value: 'A3', label: 'A3', dimensions: '297 × 420 mm' },
  { value: 'A5', label: 'A5', dimensions: '148 × 210 mm' },
  { value: 'A6', label: 'A6', dimensions: '105 × 148 mm' },
  { value: 'A2', label: 'A2', dimensions: '420 × 594 mm' },
  { value: 'A1', label: 'A1', dimensions: '594 × 841 mm' },
  { value: 'B4', label: 'B4', dimensions: '250 × 353 mm' },
  { value: 'B5', label: 'B5', dimensions: '176 × 250 mm' },
  { value: 'Letter', label: 'Letter', dimensions: '216 × 279 mm' },
  { value: 'Legal', label: 'Legal', dimensions: '216 × 356 mm' },
  { value: 'Executive', label: 'Executive', dimensions: '184 × 267 mm' },
  { value: 'Tabloid', label: 'Tabloid', dimensions: '279 × 432 mm' },
];

export default function PrintSetting({
  file,
  previewUrl,
  pages,
  setPages,
  customPages,
  setCustomPages,
  copies,
  setCopies,
  previewPage,
  setPreviewPage,
  colorMode,
  setColorMode,
  paperSize,
  setPaperSize,
  orientation,
  setOrientation,
  onRemove,
}) {
  if (!file || !previewUrl) return null;

  const isPdf = file.type === 'application/pdf';
  const selectedPaper = PAPER_SIZES.find((paper) => paper.value === paperSize) || PAPER_SIZES[0];

  return (
    <section className="document-workspace">
      <div className="document-preview-panel">
        <div className="workspace-header">
          <div>
            <FileText size={19} />
            <strong>Document Preview</strong>
          </div>

          <button
            type="button"
            className="remove-file-btn"
            onClick={onRemove}
            aria-label="Remove document"
          >
            <X size={17} />
          </button>
        </div>

        <div className={`document-preview-stage preview-${orientation}`}>
          {isPdf ? (
            <iframe
              title="PDF document preview"
              src={`${previewUrl}#page=${previewPage}&view=FitH`}
              className="pdf-preview"
            />
          ) : (
            <img
              src={previewUrl}
              alt="Uploaded document preview"
              className="image-preview"
            />
          )}
        </div>

        {isPdf && (
          <div className="preview-navigation">
            <button
              type="button"
              disabled={previewPage <= 1}
              onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}
              aria-label="Previous preview page"
            >
              <ChevronLeft size={18} />
            </button>

            <span>Preview page {previewPage}</span>

            <button
              type="button"
              onClick={() => setPreviewPage((page) => page + 1)}
              aria-label="Next preview page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <div className="selected-file">
          <FileText size={17} />
          <span>{file.name}</span>
          <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
        </div>
      </div>

      <aside className="print-options-panel">
        {/* Pages */}
        <div className="option-section">
          <span className="option-label">Pages</span>

          <div className="option-segmented">
            <button
              type="button"
              className={pages === 'all' ? 'active' : ''}
              onClick={() => setPages('all')}
            >
              All
            </button>

            <button
              type="button"
              className={pages === 'custom' ? 'active' : ''}
              onClick={() => setPages('custom')}
            >
              Custom
            </button>
          </div>

          {pages === 'custom' && (
            <input
              className="custom-pages-input"
              value={customPages}
              onChange={(event) =>
                setCustomPages(event.target.value.replace(/[^0-9,\- ]/g, ''))
              }
              placeholder="e.g. 1, 3-5, 8"
              aria-label="Custom pages"
            />
          )}

          <small className="option-help">
            {pages === 'all'
              ? 'Print every page in the document.'
              : 'Enter page numbers or ranges separated by commas.'}
          </small>
        </div>

        {/* Copies */}
        <div className="option-section">
          <span className="option-label">Copies</span>

          <div className="copies-control">
            <button
              type="button"
              disabled={copies <= 1}
              onClick={() => setCopies((count) => Math.max(1, count - 1))}
              aria-label="Decrease copies"
            >
              <Minus size={17} />
            </button>

            <strong>{copies}</strong>

            <button
              type="button"
              disabled={copies >= 99}
              onClick={() => setCopies((count) => Math.min(99, count + 1))}
              aria-label="Increase copies"
            >
              <Plus size={17} />
            </button>
          </div>

          <small className="option-help">Choose from 1 to 99 copies.</small>
        </div>

        {/* Print Color */}
        <div className="option-section">
          <div className="option-heading-row">
            <span className="option-label">Print Color</span>
            <Palette size={17} aria-hidden="true" />
          </div>

          <div className="option-segmented color-mode-control">
            <button
              type="button"
              className={colorMode === 'color' ? 'active' : ''}
              onClick={() => setColorMode('color')}
            >
              <span className="color-preview color-preview-full" />
              Color
            </button>

            <button
              type="button"
              className={colorMode === 'bw' ? 'active' : ''}
              onClick={() => setColorMode('bw')}
            >
              <span className="color-preview color-preview-bw" />
              B&amp;W
            </button>
          </div>

          <small className="option-help">
            {colorMode === 'color'
              ? 'Print the document in full color.'
              : 'Print the document in black and white.'}
          </small>
        </div>

        {/* Paper Size */}
        <div className="option-section">
          <div className="option-heading-row">
            <span className="option-label">Paper Size</span>
            <Ruler size={17} aria-hidden="true" />
          </div>

          <div className="select-control">
            <select
              value={paperSize}
              onChange={(event) => setPaperSize(event.target.value)}
              aria-label="Paper size"
            >
              {PAPER_SIZES.map((paper) => (
                <option key={paper.value} value={paper.value}>
                  {paper.label} — {paper.dimensions}
                </option>
              ))}
            </select>
          </div>

          <small className="option-help">
            {selectedPaper.label}: {selectedPaper.dimensions}
          </small>
        </div>

        {/* Orientation */}
        <div className="option-section">
          <div className="option-heading-row">
            <span className="option-label">Orientation</span>
            <RotateCw size={17} aria-hidden="true" />
          </div>

          <div className="option-segmented orientation-control">
            <button
              type="button"
              className={orientation === 'portrait' ? 'active' : ''}
              onClick={() => setOrientation('portrait')}
              aria-pressed={orientation === 'portrait'}
            >
              <span className="orientation-icon portrait-icon" />
              Portrait
            </button>

            <button
              type="button"
              className={orientation === 'landscape' ? 'active' : ''}
              onClick={() => setOrientation('landscape')}
              aria-pressed={orientation === 'landscape'}
            >
              <span className="orientation-icon landscape-icon" />
              Landscape
            </button>
          </div>

          <small className="option-help">
            Choose how the document should be positioned on the paper.
          </small>
        </div>

        {/* Print Summary */}
        <div className="print-summary">
          <div>
            <span>Document</span>
            <strong>{file.name}</strong>
          </div>

          <div>
            <span>Pages</span>
            <strong>{pages === 'all' ? 'All pages' : customPages || 'Custom pages'}</strong>
          </div>

          <div>
            <span>Copies</span>
            <strong>{copies}</strong>
          </div>

          <div>
            <span>Color</span>
            <strong>{colorMode === 'color' ? 'Color' : 'B&W'}</strong>
          </div>

          <div>
            <span>Paper</span>
            <strong>{selectedPaper.label}</strong>
          </div>

          <div>
            <span>Orientation</span>
            <strong>
              {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="primary-button continue-print-button"
        >
          Continue
        </button>
      </aside>
    </section>
  );
}
