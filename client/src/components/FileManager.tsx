import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Trash2, Download, File, AlertCircle, CheckCircle, RotateCw } from 'lucide-react';
import {
  uploadFile,
  deleteFile,
  fetchFiles,
  downloadFile,
  formatFileSize,
  getFileIcon,
  type UploadedFile,
  type FileUploadProgress,
} from '@/utils/asyncFiles';

interface FailedUpload {
  fileId: string;
  file: File;
  progress: FileUploadProgress;
}

interface FileManagerProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const FileManager: React.FC<FileManagerProps> = ({ onFilesChange, maxFiles = 10 }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, FileUploadProgress>>(
    new Map()
  );
  const [failedUploads, setFailedUploads] = useState<Map<string, FailedUpload>>(
    new Map()
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Fetch files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const loadedFiles = await fetchFiles();
      setFiles(loadedFiles);
      if (onFilesChange) {
        onFilesChange(loadedFiles);
      }
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      handleFiles(Array.from(selectedFiles));
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    setError('');

    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Process each file
    for (const file of newFiles) {
      await uploadSingleFile(file);
    }
  };

  const uploadSingleFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}-${Math.random()}`;
    
    // Initialize progress tracking
    const progressInfo: FileUploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'pending',
    };
    
    setUploadProgress((prev) => new Map(prev).set(fileId, progressInfo));

    // Start upload
    try {
      progressInfo.status = 'uploading';
      setUploadProgress((prev) => new Map(prev).set(fileId, progressInfo));

      const result = await uploadFile(file, (progress) => {
        setUploadProgress((prev) => {
          const updated = new Map(prev);
          const current = updated.get(fileId);
          if (current) {
            current.progress = progress;
            updated.set(fileId, current);
          }
          return updated;
        });
      });

      if (result.success && result.file) {
        // Update progress to completed
        progressInfo.status = 'completed';
        progressInfo.progress = 100;
        setUploadProgress((prev) => new Map(prev).set(fileId, progressInfo));

        // Add to files list
        setFiles((prev) => {
          const updated = [...prev, result.file!];
          if (onFilesChange) {
            onFilesChange(updated);
          }
          return updated;
        });

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress((prev) => {
            const updated = new Map(prev);
            updated.delete(fileId);
            return updated;
          });
        }, 2000);
      } else {
        // Handle error - store in failed uploads
        progressInfo.status = 'error';
        progressInfo.error = result.error || 'Upload failed';
        setUploadProgress((prev) => new Map(prev).set(fileId, progressInfo));
        
        // Add to failed uploads for retry
        setFailedUploads((prev) => 
          new Map(prev).set(fileId, { fileId, file, progress: progressInfo })
        );
      }
    } catch (err) {
      progressInfo.status = 'error';
      progressInfo.error = 'Upload failed';
      setUploadProgress((prev) => new Map(prev).set(fileId, progressInfo));
      
      // Add to failed uploads for retry
      setFailedUploads((prev) => 
        new Map(prev).set(fileId, { fileId, file, progress: progressInfo })
      );
    }
  };

  const handleRetry = async (fileId: string) => {
    const failedUpload = failedUploads.get(fileId);
    if (!failedUpload) return;

    // Remove from failed uploads
    setFailedUploads((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });

    // Remove from progress
    setUploadProgress((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });

    // Retry upload
    await uploadSingleFile(failedUpload.file);
  };

  const handleRemoveFailed = (fileId: string) => {
    setFailedUploads((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
    
    setUploadProgress((prev) => {
      const updated = new Map(prev);
      updated.delete(fileId);
      return updated;
    });
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`Delete ${fileName}?`)) {
      return;
    }

    try {
      const result = await deleteFile(fileId);
      if (result.success) {
        setFiles((prev) => {
          const updated = prev.filter((f) => f.id !== fileId);
          if (onFilesChange) {
            onFilesChange(updated);
          }
          return updated;
        });
      } else {
        setError(result.error || 'Failed to delete file');
      }
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadFile(fileId, fileName);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <File className="text-blue-400" size={24} />
          <h2 className="text-xl font-semibold text-white">File Manager</h2>
        </div>
        <div className="text-sm text-gray-400">
          {files.length} / {maxFiles} files
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="text-red-400" size={16} />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-white mb-2">Drag and drop files here</p>
        <p className="text-gray-400 text-sm mb-4">or</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
        <p className="text-gray-500 text-xs mt-4">
          Supported: PDF, DOC, DOCX, TXT, Images (Max 10MB)
        </p>
      </div>

      {/* Upload Progress */}
      {uploadProgress.size > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-400">Uploading...</h3>
          {Array.from(uploadProgress.values()).map((item) => (
            <div
              key={item.fileId}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm truncate flex-1 mr-4">
                  {item.fileName}
                </span>
                <div className="flex items-center gap-2">
                  {item.status === 'completed' && (
                    <CheckCircle className="text-green-400" size={16} />
                  )}
                  {item.status === 'error' && (
                    <>
                      <button
                        onClick={() => handleRetry(item.fileId)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Retry upload"
                      >
                        <RotateCw size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveFailed(item.fileId)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Remove"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {item.status === 'uploading' && (
                <>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{item.progress}%</div>
                </>
              )}
              
              {item.status === 'error' && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
                  <div className="text-xs text-red-400 flex-1">{item.error}</div>
                </div>
              )}
              
              {item.status === 'completed' && (
                <div className="text-xs text-green-400">Upload complete!</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Files List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No files uploaded yet
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(file.id, file.name)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.name)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileManager;