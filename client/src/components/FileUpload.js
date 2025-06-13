import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Camera } from 'lucide-react';

const FileUpload = ({ onFiles, onClose, accept = "image/*", title, description }) => {
  const onDrop = useCallback((acceptedFiles) => {
    onFiles(acceptedFiles);
  }, [onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="file-upload-modal" onClick={onClose}>
      <div className="file-upload-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'Datei hochladen'}</h3>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <Camera size={48} />
            <h4>Datei hier ablegen oder klicken</h4>
            <p>{description || 'Wählen Sie eine Datei von Ihrem Gerät aus'}</p>
            <small>Maximale Dateigröße: 10MB</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;