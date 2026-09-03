import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FileUp,
  FolderOpen,
  Plus,
  Printer,
  X,
} from 'lucide-react';
import PrintSetting from './PrintSetting';
import '../../styles/printUpload.css';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const DEFAULT_PRINT_SETTINGS = {
  pages: 'all',
  customPages: '',
  copies: 1,
  previewPage: 1,
  colorMode: 'color',
  paperSize: 'A4',
  orientation: 'portrait',
};

const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function PrintUpload() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const filesRef = useRef([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [pages, setPages] = useState(DEFAULT_PRINT_SETTINGS.pages);
  const [customPages, setCustomPages] = useState(DEFAULT_PRINT_SETTINGS.customPages);
  const [copies, setCopies] = useState(DEFAULT_PRINT_SETTINGS.copies);
  const [previewPage, setPreviewPage] = useState(DEFAULT_PRINT_SETTINGS.previewPage);
  const [colorMode, setColorMode] = useState(DEFAULT_PRINT_SETTINGS.colorMode);
  const [paperSize, setPaperSize] = useState(DEFAULT_PRINT_SETTINGS.paperSize);
  const [orientation, setOrientation] = useState(DEFAULT_PRINT_SETTINGS.orientation);

  let printer = null;
  try {
    printer = JSON.parse(sessionStorage.getItem('printstation_printer') || 'null');
  } catch {
    printer = null;
  }

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  const resetPrintSettings = () => {
    setPages(DEFAULT_PRINT_SETTINGS.pages);
    setCustomPages(DEFAULT_PRINT_SETTINGS.customPages);
    setCopies(DEFAULT_PRINT_SETTINGS.copies);
    setPreviewPage(DEFAULT_PRINT_SETTINGS.previewPage);
    setColorMode(DEFAULT_PRINT_SETTINGS.colorMode);
    setPaperSize(DEFAULT_PRINT_SETTINGS.paperSize);
    setOrientation(DEFAULT_PRINT_SETTINGS.orientation);
  };

  const addFiles = (selectedFiles) => {
    const incomingFiles = Array.from(selectedFiles || []);
    if (!incomingFiles.length) return;

    const invalidFiles = incomingFiles.filter((file) => !ACCEPTED_TYPES.includes(file.type));
    setError(invalidFiles.length ? 'Only PDF, JPG, and PNG files are supported.' : '');

    const validFiles = incomingFiles.filter((file) => ACCEPTED_TYPES.includes(file.type));
    if (!validFiles.length) return;

    setFiles((currentFiles) => {
      const existingKeys = new Set(
        currentFiles.map(({ file }) => `${file.name}-${file.size}-${file.lastModified}`),
      );

      const newItems = validFiles
        .filter((file) => {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        })
        .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));

      if (!currentFiles.length && newItems.length) {
        setActiveFileIndex(0);
        resetPrintSettings();
      }

      return [...currentFiles, ...newItems];
    });

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (indexToRemove) => {
    setFiles((currentFiles) => {
      const item = currentFiles[indexToRemove];
      if (item) URL.revokeObjectURL(item.previewUrl);

      const nextFiles = currentFiles.filter((_, index) => index !== indexToRemove);

      if (!nextFiles.length) {
        setActiveFileIndex(0);
        resetPrintSettings();
        return nextFiles;
      }

      setActiveFileIndex((currentIndex) => {
        if (indexToRemove < currentIndex) return currentIndex - 1;
        if (indexToRemove === currentIndex) {
          return Math.min(currentIndex, nextFiles.length - 1);
        }
        return currentIndex;
      });

      return nextFiles;
    });
  };

  const activeItem = files[activeFileIndex];
  const activeFile = activeItem?.file || null;
  const activePreviewUrl = activeItem?.previewUrl || '';

  return (
    <div className="print-flow-page">
      <header className="print-flow-header">
        <a href="/print" className="flow-back-link">
          <ArrowLeft size={18} />
          Back
        </a>

        <div className="flow-brand">
          <Printer size={24} />
          <span>PrintStation</span>
        </div>

        <div className="flow-step">Step 2 of 2</div>
      </header>

      <main className="upload-step-main container">
        <div className="scanner-heading">
          <div className="flow-eyebrow">
            <span />
            Printer connected
          </div>

          <h1>Upload your documents</h1>
          <p>
            Upload multiple PDF, JPG, or PNG files at once, then preview and configure your print settings.
          </p>
        </div>

        {!files.length ? (
          <section
            className={`document-upload-card ${isDragging ? 'is-dragging' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            <div className="document-upload-icon">
              <FileUp size={34} />
            </div>

            <h2>Drag &amp; drop your documents</h2>
            <p>Select or drop multiple files to upload them together</p>

            <div className="upload-divider"><span>or</span></div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              multiple
              hidden
              onChange={(event) => addFiles(event.target.files)}
            />

            <button
              className="manual-upload-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FolderOpen size={19} />
              Select Documents
            </button>

            <span className="upload-format-note">
              Supported formats: PDF, JPG, PNG • Multiple files supported
            </span>

            {error && <p className="upload-error">{error}</p>}
          </section>
        ) : (
          <>
            <section className="uploaded-files-panel" aria-label="Uploaded documents">
              <div className="uploaded-files-header">
                <div>
                  <span className="uploaded-files-title">
                    <FileText size={17} />
                    Uploaded Documents
                  </span>
                  <small>
                    {files.length} {files.length === 1 ? 'document' : 'documents'}
                  </small>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  multiple
                  hidden
                  onChange={(event) => addFiles(event.target.files)}
                />

                <button
                  type="button"
                  className="add-files-button"
                  onClick={() => inputRef.current?.click()}
                >
                  <Plus size={17} />
                  Add Files
                </button>
              </div>

              <div className="uploaded-files-list">
                {files.map(({ file }, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className={`uploaded-file-item ${index === activeFileIndex ? 'is-active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveFileIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveFileIndex(index);
                      }
                    }}
                  >
                    <span className="uploaded-file-icon" aria-hidden="true">
                      <FileText size={18} />
                    </span>
                    <span className="uploaded-file-details">
                      <strong title={file.name}>{file.name}</strong>
                      <small>{formatFileSize(file.size)}</small>
                    </span>
                    <span className="uploaded-file-index">{index + 1}</span>
                    <button
                      type="button"
                      className="uploaded-file-remove"
                      aria-label={`Remove ${file.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {error && <p className="upload-error">{error}</p>}
            </section>

            <PrintSetting
              file={activeFile}
              previewUrl={activePreviewUrl}
              files={files}
              activeFileIndex={activeFileIndex}
              onSelectFile={setActiveFileIndex}
              pages={pages}
              setPages={setPages}
              customPages={customPages}
              setCustomPages={setCustomPages}
              copies={copies}
              setCopies={setCopies}
              previewPage={previewPage}
              setPreviewPage={setPreviewPage}
              colorMode={colorMode}
              setColorMode={setColorMode}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
              orientation={orientation}
              setOrientation={setOrientation}
              onRemove={() => removeFile(activeFileIndex)}
            />
          </>
        )}

        {printer && (
          <div className="connected-printer upload-printer-status">
            <CheckCircle2 size={18} />
            <span>{printer.name} connected</span>
          </div>
        )}
      </main>
    </div>
  );
}
