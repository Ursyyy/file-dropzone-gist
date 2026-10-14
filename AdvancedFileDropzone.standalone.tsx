import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FC,
  type ReactNode,
} from 'react';
import {
  AlertCircle,
  File as FileIcon,
  FolderUp,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

// ============================================================================
// Types & Contracts
// ============================================================================

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

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function isImageMime(type: string): boolean {
  return type.startsWith('image/');
}

function matchesAccept(file: File, acceptedRules: string[]): boolean {
  if (!acceptedRules.length) return true;
  const fileName = file.name.toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  return acceptedRules.some((rule) => {
    const cleanRule = rule.trim().toLowerCase();
    if (cleanRule.endsWith('/*')) {
      const baseType = cleanRule.slice(0, -2);
      return fileType.startsWith(baseType);
    }
    if (cleanRule.startsWith('.')) {
      return fileName.endsWith(cleanRule);
    }
    return fileType === cleanRule;
  });
}

// ============================================================================
// Custom Hook: useFileDropzone
// ============================================================================


export function useFileDropzone({
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 50,
  accept = [],
  allowFolder = true,
  onChange,
  onError,
  initialFiles = [],
}: UseFileDropzoneOptions = {}) {
  const [items, setItems] = useState<UploadFileItem[]>(initialFiles);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const createdUrlsRef = useRef<Set<string>>(new Set());

  const revokeUrl = useCallback((url?: string) => {
    if (url && createdUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      createdUrlsRef.current.delete(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdUrlsRef.current.clear();
    };
  }, []);

  const addValidatedFiles = useCallback(
    (newFiles: File[]) => {
      if (!newFiles.length) return;

      const oversized: File[] = [];
      const invalidType: File[] = [];
      const valid: File[] = [];

      newFiles.forEach((file) => {
        if (file.size > maxFileSize) {
          oversized.push(file);
        } else if (!matchesAccept(file, accept)) {
          invalidType.push(file);
        } else {
          valid.push(file);
        }
      });

      if (oversized.length > 0) {
        onError?.({
          code: 'FILE_TOO_LARGE',
          message: `${oversized.length} file(s) exceeded the ${formatBytes(maxFileSize)} limit.`,
          files: oversized,
        });
      }

      if (invalidType.length > 0) {
        onError?.({
          code: 'INVALID_FILE_TYPE',
          message: `${invalidType.length} file(s) have an unsupported file format.`,
          files: invalidType,
        });
      }

      setItems((prev) => {
        const remainingSlots = Math.max(0, maxFiles - prev.length);

        if (valid.length > remainingSlots) {
          onError?.({
            code: 'TOO_MANY_FILES',
            message: `Maximum of ${maxFiles} files reached. ${valid.length - remainingSlots} file(s) were skipped.`,
          });
        }

        const accepted = valid.slice(0, remainingSlots);

        const newItems: UploadFileItem[] = accepted.map((file) => {
          let previewUrl: string | undefined;

          if (isImageMime(file.type)) {
            previewUrl = URL.createObjectURL(file);
            createdUrlsRef.current.add(previewUrl);
          }

          const relativePath =
            (file as { webkitRelativePath?: string }).webkitRelativePath ||
            (file as { path?: string }).path ||
            undefined;

          return {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            previewUrl,
            relativePath,
            progress: 0,
            status: 'idle',
          };
        });

        const nextState = [...prev, ...newItems];
        onChange?.(nextState);
        return nextState;
      });
    },
    [accept, maxFileSize, maxFiles, onChange, onError]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (target?.previewUrl) {
          revokeUrl(target.previewUrl);
        }
        const updated = prev.filter((i) => i.id !== id);
        onChange?.(updated);
        return updated;
      });
    },
    [onChange, revokeUrl]
  );

  const clearAll = useCallback(() => {
    items.forEach((item) => {
      if (item.previewUrl) revokeUrl(item.previewUrl);
    });
    setItems([]);
    onChange?.([]);
  }, [items, onChange, revokeUrl]);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    addValidatedFiles(droppedFiles);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addValidatedFiles(selected);
    if (e.target) e.target.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();
  const openFolderPicker = () => folderInputRef.current?.click();

  return {
    items,
    isDragActive,
    removeItem,
    clearAll,
    openFilePicker,
    openFolderPicker,
    fileInputRef,
    folderInputRef,
    dropzoneProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      role: 'region' as const,
      'aria-label': 'File Dropzone',
    },
    inputProps: {
      ref: fileInputRef,
      type: 'file' as const,
      multiple: true,
      onChange: handleFileInputChange,
      className: 'hidden',
    },
    folderInputProps: allowFolder
      ? {
        ref: folderInputRef,
        type: 'file' as const,
        multiple: true,
        onChange: handleFileInputChange,
        className: 'hidden',
        ...({ webkitdirectory: '', directory: '' } as Record<string, string>),
      }
      : undefined,
  };
}


export const FilePreviewItemRow: FC<{
  item: UploadFileItem;
  onRemove: (id: string) => void;
  disabled?: boolean;
}> = ({ item, onRemove, disabled }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : isImageMime(item.type) ? (
          <ImageIcon className="w-5 h-5 text-slate-400" />
        ) : (
          <FileIcon className="w-5 h-5 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{formatBytes(item.size)}</span>
          {item.relativePath && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]" title={item.relativePath}>
                {item.relativePath}
              </span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onRemove(item.id)}
        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
        title="Remove file"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const AdvancedFileDropzone: FC<AdvancedFileDropzoneProps> = ({
  className,
  disabled = false,
  maxFileSize = 50 * 1024 * 1024,
  maxFiles = 50,
  accept = [],
  allowFolder = true,
  onChange,
  onError,
  initialFiles,
  children,
}) => {
  const inputId = useId();
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleError = useCallback(
    (err: DropzoneError) => {
      setInternalError(err.message);
      onError?.(err);
    },
    [onError]
  );

  const {
    items,
    isDragActive,
    removeItem,
    clearAll,
    openFilePicker,
    openFolderPicker,
    dropzoneProps,
    inputProps,
    folderInputProps,
  } = useFileDropzone({
    maxFileSize,
    maxFiles,
    accept,
    allowFolder,
    onChange,
    onError: handleError,
    initialFiles,
  });

  const acceptHint = useMemo(() => {
    if (!accept.length) return 'All file formats supported';
    return accept.join(', ');
  }, [accept]);

  return (
    <div className={cn('w-full flex flex-col gap-4', className)}>
      <div
        {...dropzoneProps}
        onClick={() => !disabled && openFilePicker()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 outline-none',
          'flex flex-col items-center justify-center gap-3',
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300',
          disabled && 'opacity-60 cursor-not-allowed pointer-events-none'
        )}
      >
        <input id={inputId} {...inputProps} disabled={disabled} />
        {folderInputProps && <input {...folderInputProps} disabled={disabled} />}

        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-slate-800">
            <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">
            Up to {maxFiles} files • Max {formatBytes(maxFileSize)} per file
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5 max-w-sm truncate">
            {acceptHint}
          </p>
        </div>

        {allowFolder && (
          <div
            className="mt-1 pt-2 border-t border-slate-200/60 w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={openFolderPicker}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors py-1 px-2.5 rounded-lg hover:bg-white"
            >
              <FolderUp className="w-3.5 h-3.5" />
              Upload entire directory
            </button>
          </div>
        )}

        {children}
      </div>

      {internalError && (
        <div className="flex items-center justify-between p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{internalError}</span>
          </div>
          <button
            type="button"
            onClick={() => setInternalError(null)}
            className="p-1 hover:bg-rose-100 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Selected files ({items.length} / {maxFiles})
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={clearAll}
              className="text-xs text-rose-600 hover:underline disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <FilePreviewItemRow
                key={item.id}
                item={item}
                onRemove={removeItem}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFileDropzone;
