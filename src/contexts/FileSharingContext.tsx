import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Alert } from 'react-native';
import { FileSharingState, FileSharingContextType, FileData, FileMessage, FileUploadProgress } from '../types/fileSharing';
import { useAuth } from './AuthContext';
import { useMessaging } from './MessagingContext';
import { OfflineManager } from '../services/OfflineManager';

// Mock file data for demonstration
const MOCK_FILES: FileData[] = [
  {
    id: 'file1',
    name: 'Meeting Notes.pdf',
    size: 1024000,
    type: 'application/pdf',
    mimeType: 'application/pdf',
    uri: 'https://example.com/files/meeting-notes.pdf',
    uploadedAt: new Date('2024-01-15T10:30:00Z'),
    uploadedBy: '1',
    uploadedByName: 'John Doe',
  },
  {
    id: 'file2',
    name: 'Team Photo.jpg',
    size: 2048000,
    type: 'image/jpeg',
    mimeType: 'image/jpeg',
    uri: 'https://example.com/files/team-photo.jpg',
    thumbnail: 'https://example.com/thumbnails/team-photo-thumb.jpg',
    uploadedAt: new Date('2024-01-16T14:20:00Z'),
    uploadedBy: '2',
    uploadedByName: 'Jane Smith',
  },
  {
    id: 'file3',
    name: 'Budget Report.xlsx',
    size: 512000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uri: 'https://example.com/files/budget-report.xlsx',
    uploadedAt: new Date('2024-01-17T09:15:00Z'),
    uploadedBy: '3',
    uploadedByName: 'Admin User',
  },
];

const initialState: FileSharingState = {
  files: MOCK_FILES,
  uploadProgress: [],
  isUploading: false,
  error: null,
};

type FileSharingAction =
  | { type: 'SET_FILES'; payload: FileData[] }
  | { type: 'ADD_FILE'; payload: FileData }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: FileUploadProgress[] }
  | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { fileId: string; progress: number; status: 'uploading' | 'completed' | 'failed'; error?: string } }
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_UPLOAD_PROGRESS' };

const fileSharingReducer = (state: FileSharingState, action: FileSharingAction): FileSharingState => {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };
    
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };
    
    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter(file => file.id !== action.payload) };
    
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload };
    
    case 'UPDATE_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: state.uploadProgress.map(progress =>
          progress.fileId === action.payload.fileId
            ? { ...progress, ...action.payload }
            : progress
        ),
      };
    
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: [] };
    
    default:
      return state;
  }
};

const FileSharingContext = createContext<FileSharingContextType | undefined>(undefined);

export const FileSharingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fileSharingState, dispatch] = useReducer(fileSharingReducer, initialState);
  const { authState } = useAuth();
  const { sendMessage } = useMessaging();
  const offlineManager = OfflineManager.getInstance();

  useEffect(() => {
    loadFiles();
  }, [authState.user]);

  const loadFiles = async () => {
    try {
      // In a real app, this would load files from API
      dispatch({ type: 'SET_FILES', payload: MOCK_FILES });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load files' });
    }
  };

  const uploadFile = async (file: FileData, message?: string): Promise<void> => {
    if (!authState.user) {
      throw new Error('User not authenticated');
    }

    dispatch({ type: 'SET_UPLOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const uploadProgress: FileUploadProgress = {
      fileId: file.id,
      progress: 0,
      status: 'uploading',
    };

    dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: [uploadProgress] });

    try {
      // Simulate file upload with progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        dispatch({
          type: 'UPDATE_UPLOAD_PROGRESS',
          payload: { fileId: file.id, progress, status: 'uploading' },
        });
      }

      // Add file to the list
      const uploadedFile: FileData = {
        ...file,
        uploadedBy: authState.user.id,
        uploadedByName: authState.user.name,
        uploadedAt: new Date(),
      };

      dispatch({ type: 'ADD_FILE', payload: uploadedFile });
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: { fileId: file.id, progress: 100, status: 'completed' },
      });

      // Send file message if message is provided
      if (message) {
        const fileMessage: FileMessage = {
          id: Date.now().toString(),
          type: 'file',
          fileData: uploadedFile,
          message,
          timestamp: new Date(),
          senderId: authState.user.id,
          senderName: authState.user.name,
        };

        await sendMessage(fileMessage);
      }

      // Cache file for offline access
      await offlineManager.addPendingAction({
        type: 'message',
        action: 'create',
        data: { type: 'file', fileData: uploadedFile, message },
      });

      Alert.alert('Success', 'File uploaded successfully');
    } catch (error) {
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: {
          fileId: file.id,
          progress: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed',
        },
      });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to upload file' });
      Alert.alert('Error', 'Failed to upload file');
      throw error;
    } finally {
      dispatch({ type: 'SET_UPLOADING', payload: false });
    }
  };

  const downloadFile = async (fileId: string): Promise<void> => {
    try {
      const file = fileSharingState.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // In a real app, this would trigger actual file download
      Alert.alert('Download Started', `Downloading ${file.name}...`);
      
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Download Complete', `${file.name} has been downloaded successfully`);
    } catch (error) {
      Alert.alert('Download Failed', error instanceof Error ? error.message : 'Failed to download file');
      throw error;
    }
  };

  const deleteFile = async (fileId: string): Promise<void> => {
    try {
      const file = fileSharingState.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // In a real app, this would delete from server
      dispatch({ type: 'REMOVE_FILE', payload: fileId });
      
      Alert.alert('Success', 'File deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete file');
      throw error;
    }
  };

  const getFileById = (fileId: string): FileData | undefined => {
    return fileSharingState.files.find(file => file.id === fileId);
  };

  const getFilesByGroup = (groupId: string): FileData[] => {
    // In a real app, this would filter files by group
    return fileSharingState.files;
  };

  const getFilesByUser = (userId: string): FileData[] => {
    return fileSharingState.files.filter(file => file.uploadedBy === userId);
  };

  const clearUploadProgress = () => {
    dispatch({ type: 'CLEAR_UPLOAD_PROGRESS' });
  };

  const value: FileSharingContextType = {
    fileSharingState,
    uploadFile,
    downloadFile,
    deleteFile,
    getFileById,
    getFilesByGroup,
    getFilesByUser,
    clearUploadProgress,
  };

  return (
    <FileSharingContext.Provider value={value}>
      {children}
    </FileSharingContext.Provider>
  );
};

export const useFileSharing = (): FileSharingContextType => {
  const context = useContext(FileSharingContext);
  if (context === undefined) {
    throw new Error('useFileSharing must be used within a FileSharingProvider');
  }
  return context;
};
