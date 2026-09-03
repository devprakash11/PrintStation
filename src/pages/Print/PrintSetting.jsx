import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Files,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import '../../styles/multiFilePreview.css';

const PAPER_SIZES = [
  { value: 'A4', label: 'A4', dimensions: '210 × 297 mm', width: 210, height: 297 },
  { value: 'A3', label: 'A3', dimensions: '297 × 420 mm', width: 297, height: 420 },
  { value: 'A5', label: 'A5', dimensions: '148 × 210 mm', width: 148, height: 210 },
  { value: 'A6', label: 'A6', dimensions: '105 × 148 mm', width: 105, height: 148 },
  { value: 'A2', label: 'A2', dimensions: '420 × 594 mm', width: 420, height: 594 },
  { value: 'A1', label: 'A1', dimensions: '594 × 841 mm', width: 594, height: 841 },
  { value: 'B4', label: 'B4', dimensions: '250 × 353 mm', width: 250, height: 353 },
  { value: 'B5', label: 'B5', dimensions: '176 × 250 mm', width: 176, height: 250 },
  { value: 'Letter', label: 'Letter', dimensions: '216 × 279 mm', width: 216, height: 279 },
  { value: 'Legal', label: 'Legal', dimensions: '216 × 356 mm', width: 216, height: 356 },
  { value: 'Executive', label: 'Executive', dimensions: '184 × 267 mm', width: 184, height: 267 },
  { value: 'Tabloid', label: 'Tabloid', dimensions: '279 × 432 mm', width: 279, height: 432 },
];

const getPdfPageCount = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('latin1').decode(new Uint8Array(buffer));

    const countMatches = [...text.matchAll(/\/Count\s+(\d+)/g)]
      .map((match) => Number(match[1]))
      .filter((count) => Number.isInteger(count) && count > 0 && count <= 10000);

    if (countMatches.length > 0) {
      return Math.max(...countMatches);
    }

    const pageMatches = text.match(/\/Type\s*\/Page\b/g);
    return Math.max(1, pageMatches?.length || 1);
  } catch (error) {
    console.error('Unable to determine PDF page count:', error);
    return 1;
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function PrintSetting({
  file,
  previewUrl,
  files = [],
  activeFileIndex = 0,
  onSelectFile,
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
  const [isPaperMenuOpen, setIsPaperMenuOpen] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const paperSizeRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!paperSizeRef.current?.contains(event.target)) setIsPaperMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsPaperMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPageCount = async () => {
      if (!file) return;

      if (file.type !== 'application/pdf') {
        setPageCount(1);
        setPreviewPage(1);
        return;
      }

      const count = await getPdfPageCount(file);

      if (!cancelled) {
        setPageCount(count);
        setPreviewPage((page) => Math.min(Math.max(1, page), count));
      }
    };

    loadPageCount();
    setZoom(1);

    return () => {
      cancelled = true;
    };
  }, [file, setPreviewPage]);

  if (!file || !previewUrl) return null;

  const isPdf = file.type === 'application/pdf';
  const selectedPaper = PAPER_SIZES.find((paper) => paper.value === paperSize) || PAPER_SIZES[0];
  const paperWidth = orientation === 'portrait' ? selectedPaper.width : selectedPaper.height;
  const paperHeight = orientation === 'portrait' ? selectedPaper.height : selectedPaper.width;

  const goToPage = (page) => {
    setPreviewPage(Math.min(pageCount, Math.max(1, page)));
  };

  const handlePaperSizeChange = (value) => {
    setPaperSize(value);
    setIsPaperMenuOpen(false);
  };

  const selectFile = (index) => {
    if (index === activeFileIndex) return;
    onSelectFile?.(index);
    setPreviewPage(1);
  };

  return (
    <section className="document-workspace">
      <div className="document-preview-panel">
        <div className="workspace-header">
          <div className="workspace-file-meta">
            <span className="workspace-file-icon" aria-hidden="true">
              <FileText size={17} />
            </span>
            <div>
              <strong title={file.name}>{file.name}</strong>
              <small>
                {formatFileSize(file.size)}
                <span aria-hidden="true">•</span>
                {pageCount} {pageCount === 1 ? 'Page' : 'Pages'}
              </small>
            </div>
          </div>

          <div className="preview-toolbar">
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(0.8, Number((value - 0.1).toFixed(1))))}
              disabled={zoom <= 0.8}
              aria-label="Zoom out"
            >
              <ZoomOut size={17} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(1.4, Number((value + 0.1).toFixed(1))))}
              disabled={zoom >= 1.4}
              aria-label="Zoom in"
            >
              <ZoomIn size={17} />
            </button>
            <button
              type="button"
              className="preview-remove-button"
              onClick={onRemove}
              aria-label="Remove document"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="document-preview-stage">
          <button
            type="button"
            className="preview-arrow preview-arrow-left"
            disabled={!isPdf || previewPage <= 1}
            onClick={() => goToPage(previewPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={19} />
          </button>

          <div
            className={`document-preview-paper preview-${orientation}`}
            style={{
              '--paper-width': paperWidth,
              '--paper-height': paperHeight,
              '--preview-scale': zoom,
            }}
          >
            {isPdf ? (
              <iframe
                key={`${previewUrl}-page-${previewPage}`}
                title="PDF document preview"
                src={`${previewUrl}#page=${previewPage}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                className="pdf-preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Uploaded document preview"
                className="image-preview"
              />
            )}
            <span className="preview-page-badge">
              Page {previewPage} of {pageCount}
            </span>
          </div>

          <button
            type="button"
            className="preview-arrow preview-arrow-right"
            disabled={!isPdf || previewPage >= pageCount}
            onClick={() => goToPage(previewPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="preview-thumbnails" aria-label="Uploaded document thumbnails">
          {files.map(({ file: thumbnailFile, previewUrl: thumbnailUrl }, index) => {
            const isActive = index === activeFileIndex;
            const thumbnailIsPdf = thumbnailFile.type === 'application/pdf';

            return (
              <button
                key={`${thumbnailFile.name}-${thumbnailFile.size}-${thumbnailFile.lastModified}`}
                type="button"
                className={`preview-thumbnail preview-file-thumbnail ${isActive ? 'is-active' : ''}`}
                onClick={() => selectFile(index)}
                aria-label={`Open ${thumbnailFile.name}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="preview-thumbnail-paper">
                  {thumbnailIsPdf ? (
                    <iframe
                      title={`${thumbnailFile.name} thumbnail`}
                      src={`${thumbnailUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                      tabIndex="-1"
                    />
                  ) : (
                    <img src={thumbnailUrl} alt="" />
                  )}
                </span>
                <span className="preview-thumbnail-index">{index + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="selected-file">
          <FileText size={17} />
          <span title={file.name}>{file.name}</span>
          <small>{formatFileSize(file.size)}</small>
        </div>
      </div>

      <aside className="print-options-panel">
        <div className="option-section">
          <span className="option-label"><Files size={16} /> Pages</span>
          <div className="option-segmented">
            <button type="button" className={pages === 'all' ? 'active' : ''} onClick={() => setPages('all')}>
              All
            </button>
            <button type="button" className={pages === 'custom' ? 'active' : ''} onClick={() => setPages('custom')}>
              Custom
            </button>
          </div>
          {pages === 'custom' && (
            <input
              className="custom-pages-input"
              value={customPages}
              onChange={(event) => setCustomPages(event.target.value.replace(/[^0-9,\- ]/g, ''))}
              placeholder="e.g. 1, 3-5, 8"
              aria-label="Custom pages"
            />
          )}
          <small className="option-help">
            {pages === 'all'
              ? `Print all ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}.`
              : 'Enter page numbers or ranges separated by commas.'}
          </small>
        </div>

        <div className="option-section">
          <span className="option-label"><Copy size={16} /> Copies</span>
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

        <div className="option-section">
          <span className="option-label">Print Color</span>
          <div className="option-segmented color-mode-control">
            <button type="button" className={colorMode === 'color' ? 'active' : ''} onClick={() => setColorMode('color')}>
              Color
            </button>
            <button type="button" className={colorMode === 'bw' ? 'active' : ''} onClick={() => setColorMode('bw')}>
              B&amp;W
            </button>
          </div>
          <small className="option-help">
            {colorMode === 'color' ? 'Print the document in full color.' : 'Print the document in black and white.'}
          </small>
        </div>

        <div className="option-section paper-size-section">
          <span className="option-label">Paper Size</span>
          <div className="paper-size-field" ref={paperSizeRef}>
            <button
              type="button"
              className={`paper-size-trigger ${isPaperMenuOpen ? 'is-open' : ''}`}
              onClick={() => setIsPaperMenuOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={isPaperMenuOpen}
            >
              <span className="paper-size-trigger-text">
                <strong>{selectedPaper.label}</strong>
                <span>{selectedPaper.dimensions}</span>
              </span>
              <ChevronDown
                size={19}
                className={`paper-size-chevron ${isPaperMenuOpen ? 'is-open' : ''}`}
              />
            </button>

            {isPaperMenuOpen && (
              <div className="paper-size-menu" role="listbox" aria-label="Paper size options">
                {PAPER_SIZES.map((paper) => {
                  const isSelected = paper.value === selectedPaper.value;

                  return (
                    <button
                      key={paper.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`paper-size-option ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handlePaperSizeChange(paper.value)}
                    >
                      <span className="paper-size-option-icon" aria-hidden="true">
                        <FileText size={23} strokeWidth={1.7} />
                      </span>
                      <span className="paper-size-option-name">{paper.label}</span>
                      <span className="paper-size-option-dimensions">{paper.dimensions}</span>
                      {isSelected && (
                        <span className="paper-size-option-check" aria-hidden="true">
                          <Check size={19} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <small className="option-help">
            {selectedPaper.label}: {selectedPaper.dimensions}
          </small>
        </div>

        <div className="option-section">
          <span className="option-label">Orientation</span>
          <div className="option-segmented orientation-control">
            <button
              type="button"
              className={orientation === 'portrait' ? 'active' : ''}
              onClick={() => setOrientation('portrait')}
              aria-pressed={orientation === 'portrait'}
            >
              Portrait
            </button>
            <button
              type="button"
              className={orientation === 'landscape' ? 'active' : ''}
              onClick={() => setOrientation('landscape')}
              aria-pressed={orientation === 'landscape'}
            >
              Landscape
            </button>
          </div>
          <small className="option-help">
            {orientation === 'portrait' ? 'Print vertically on the page.' : 'Print horizontally on the page.'}
          </small>
        </div>

        <div className="print-summary">
          <div>
            <span>Document</span>
            <strong title={file.name}>{file.name}</strong>
          </div>
          <div>
            <span>Pages</span>
            <strong>{pages === 'all' ? `All (${pageCount})` : customPages || 'Custom'}</strong>
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
            <strong>{orientation === 'portrait' ? 'Portrait' : 'Landscape'}</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}
