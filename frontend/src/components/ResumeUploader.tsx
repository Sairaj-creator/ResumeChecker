import { useRef, useState } from 'react';

interface ResumeUploaderProps {
  selectedFile: File | null;
  isAnalyzing: boolean;
  onFileSelected: (file: File) => void;
  onAnalyze: () => void;
}

export function ResumeUploader({
  selectedFile,
  isAnalyzing,
  onFileSelected,
  onAnalyze,
}: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const pickFile = (file?: File | null) => {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      window.alert('Please upload a PDF file.');
      return;
    }

    onFileSelected(file);
  };

  return (
    <section className="card uploader-card">
      <div
        className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          pickFile(event.dataTransfer.files?.[0]);
        }}
      >
        <p className="dropzone-title">Drop Resume PDF</p>
        <p className="dropzone-subtitle">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
        <p className="file-chip">
          {selectedFile ? selectedFile.name : 'No file selected'}
        </p>
      </div>

      <button
        className="primary-btn"
        disabled={!selectedFile || isAnalyzing}
        onClick={onAnalyze}
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
      </button>
    </section>
  );
}
