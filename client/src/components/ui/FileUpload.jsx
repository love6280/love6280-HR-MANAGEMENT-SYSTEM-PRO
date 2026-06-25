import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';

const FileUpload = ({
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5, // in MB
  onUpload,
  loading = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    
    // Check size
    const sizeInMB = selectedFile.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      setError(`File size exceeds the ${maxSize}MB limit.`);
      setFile(null);
      return false;
    }

    // Check extension
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    const acceptedExtensions = accept.replace(/\./g, '').split(',');
    if (!acceptedExtensions.includes(extension)) {
      setError(`Invalid file type. Allowed: ${accept}`);
      setFile(null);
      return false;
    }

    setError('');
    setFile(selectedFile);
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
          ${dragActive 
            ? 'border-accent-primary bg-accent-primary/5 shadow-glow' 
            : file 
              ? 'border-state-success/40 bg-state-success/[0.02] hover:border-state-success' 
              : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {file ? (
          <>
            <CheckCircle className="h-10 w-10 text-state-success animate-bounce" />
            <div className="text-center">
              <p className="text-sm font-semibold text-text-primary truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-text-secondary" />
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">Drag & drop your file here, or click to browse</p>
              <p className="text-xs text-text-muted mt-1">Supports PDF, JPG, PNG (Max {maxSize}MB)</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-state-danger bg-state-danger/10 border border-state-danger/20 p-2.5 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          loading={loading}
          variant="primary"
          className="w-full mt-1"
        >
          Upload Document
        </Button>
      )}
    </div>
  );
};

export default FileUpload;
