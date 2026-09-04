import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Printer, CheckCircle2, FolderOpen, FileUp } from 'lucide-react';
import PrintSetting from './PrintSetting';

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

export default function PrintUpload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
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
    printer = JSON.parse(
      sessionStorage.getItem('printstation_printer') || 'null'
    );
  } catch {
    printer = null;
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetPrintSettings = () => {
    setPages(DEFAULT_PRINT_SETTINGS.pages);
    setCustomPages(DEFAULT_PRINT_SETTINGS.customPages);
    setCopies(DEFAULT_PRINT_SETTINGS.copies);
    setPreviewPage(DEFAULT_PRINT_SETTINGS.previewPage);
    setColorMode(DEFAULT_PRINT_SETTINGS.colorMode);
    setPaperSize(DEFAULT_PRINT_SETTINGS.paperSize);
    setOrientation(DEFAULT_PRINT_SETTINGS.orientation);
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    resetPrintSettings();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(null);
    setPreviewUrl('');
    setError('');
    setIsDragging(false);
    resetPrintSettings();

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

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

        <div className="flow-step">Step 2 of 4</div>
      </header>

      <main className="upload-step-main container">
        <div className="scanner-heading">
          <div className="flow-eyebrow">
            <span />
            Printer connected
          </div>

          <h1>Upload your document</h1>
          <p>
            Upload a PDF, JPG, or PNG, preview it, then choose pages, copies,
            color, paper size, and orientation.
          </p>
        </div>

        {!file ? (
          <section
            className={`document-upload-card ${
              isDragging ? 'is-dragging' : ''
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
          >
            <div className="document-upload-icon">
              <FileUp size={34} />
            </div>

            <h2>Drag &amp; drop your document</h2>
            <p>Drag your file and drop it anywhere inside this area</p>

            <div className="upload-divider">
              <span>or</span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              hidden
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            <button
              className="manual-upload-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FolderOpen size={19} />
              Manual Upload
            </button>

            <span className="upload-format-note">
              Supported formats: PDF, JPG, PNG
            </span>

            {error && <p className="upload-error">{error}</p>}
          </section>
        ) : (
          <PrintSetting
            file={file}
            previewUrl={previewUrl}
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
            onRemove={removeFile}
          />
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
