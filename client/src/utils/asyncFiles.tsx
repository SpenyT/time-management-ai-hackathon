import axios, { type AxiosProgressEvent, type AxiosRequestConfig } from 'axios';

// Types and Interfaces
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  file?: UploadedFile;
  error?: string;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
];

// Axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// File validation
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Please upload PDF, DOC, DOCX, TXT, or images.',
    };
  }

  return { valid: true };
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Upload file with progress tracking
export const uploadFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size.toString());

    // Upload configuration with progress tracking
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      },
    };

    // Make the upload request
    const response = await apiClient.post<UploadResponse>(
      '/files/upload',
      formData,
      config
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Upload failed',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred during upload',
    };
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (
  files: File[],
  onProgressUpdate?: (fileId: string, progress: number) => void
): Promise<UploadResponse[]> => {
  const uploadPromises = files.map((file) => {
    const fileId = `${file.name}-${Date.now()}`;
    return uploadFile(file, (progress) => {
      if (onProgressUpdate) {
        onProgressUpdate(fileId, progress);
      }
    });
  });

  return Promise.all(uploadPromises);
};

// Delete file
export const deleteFile = async (fileId: string): Promise<DeleteResponse> => {
  try {
    const response = await apiClient.delete<DeleteResponse>(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Delete failed',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred during deletion',
    };
  }
};

// Fetch all files
export const fetchFiles = async (): Promise<UploadedFile[]> => {
  try {
    const response = await apiClient.get<{ files: UploadedFile[] }>('/files');
    return response.data.files;
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
};

// Download file
export const downloadFile = async (fileId: string, fileName: string): Promise<void> => {
  try {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });

    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Get file icon based on type
export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('text')) return '📃';
  return '📎';
};

export default {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  fetchFiles,
  downloadFile,
  validateFile,
  formatFileSize,
  getFileIcon,
};