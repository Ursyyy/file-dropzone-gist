import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode, RefObject } from 'react';

export type DropzoneErrorCode =
  | 'FILE_TOO_LARGE'
  | 'TOO_MANY_FILES'
  | 'INVALID_FILE_TYPE';

export interface DropzoneError {
  code: DropzoneErrorCode;
  message: string;
  files?: File[];
}

export type UploadItemStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  relativePath?: string;
  progress: number;
  status: UploadItemStatus;
  errorMessage?: string;
}

export interface UseFileDropzoneOptions {
  maxFileSize?: number;
  maxFiles?: number;
  accept?: string[];
  allowFolder?: boolean;
  onChange?: (items: UploadFileItem[]) => void;
  onError?: (error: DropzoneError) => void;
  initialFiles?: UploadFileItem[];
}

export interface AdvancedFileDropzoneProps extends UseFileDropzoneOptions {
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export interface FilePreviewItemRowProps {
  item: UploadFileItem;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export interface DropzoneRootProps {
  onDragEnter: (e: DragEvent<HTMLElement>) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  tabIndex: number;
  role: 'region';
  'aria-label': string;
}

export interface DropzoneInputProps {
  ref: RefObject<HTMLInputElement | null>;
  type: 'file';
  multiple: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className: string;
}

export interface DropzoneFolderInputProps {
  ref: RefObject<HTMLInputElement | null>;
  type: 'file';
  multiple: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className: string;
  webkitdirectory?: string;
  directory?: string;
  [key: string]: unknown;
}

export interface UseFileDropzoneReturn {
  items: UploadFileItem[];
  isDragActive: boolean;
  removeItem: (id: string) => void;
  clearAll: () => void;
  openFilePicker: () => void;
  openFolderPicker: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  folderInputRef: RefObject<HTMLInputElement | null>;
  dropzoneProps: DropzoneRootProps;
  inputProps: DropzoneInputProps;
  folderInputProps?: DropzoneFolderInputProps;
}
