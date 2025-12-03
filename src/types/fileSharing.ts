export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  uri: string;
  thumbnail?: string;
  uploadedAt: Date;
  uploadedBy: string;
  uploadedByName: string;
}

export interface FileMessage {
  id: string;
  type: 'file';
  fileData: FileData;
  message: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  groupId?: string;
  recipientId?: string;
}

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface FileSharingState {
  files: FileData[];
  uploadProgress: FileUploadProgress[];
  isUploading: boolean;
  error: string | null;
}

export interface FileSharingContextType {
  fileSharingState: FileSharingState;
  uploadFile: (file: FileData, message?: string) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  getFileById: (fileId: string) => FileData | undefined;
  getFilesByGroup: (groupId: string) => FileData[];
  getFilesByUser: (userId: string) => FileData[];
  clearUploadProgress: () => void;
}

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  PRESENTATION: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
} as const;

export const getFileTypeCategory = (mimeType: string): string => {
  for (const [category, types] of Object.entries(FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category.toLowerCase();
    }
  }
  return 'other';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
  const category = getFileTypeCategory(mimeType);
  
  switch (category) {
    case 'image':
      return 'image-outline';
    case 'document':
      return 'document-text-outline';
    case 'spreadsheet':
      return 'grid-outline';
    case 'presentation':
      return 'easel-outline';
    case 'archive':
      return 'archive-outline';
    case 'video':
      return 'videocam-outline';
    case 'audio':
      return 'musical-notes-outline';
    default:
      return 'document-outline';
  }
};
