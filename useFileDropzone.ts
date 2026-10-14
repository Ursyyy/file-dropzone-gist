import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import type {
  UploadFileItem,
  UseFileDropzoneOptions,
  UseFileDropzoneReturn,
} from './type';
import {
  formatBytes,
  generateItemId,
  getFileRelativePath,
  isImageMime,
  matchesAccept,
} from './utils';

export function useFileDropzone({
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 50,
  accept = [],
  allowFolder = true,
  onChange,
  onError,
  initialFiles = [],
}: UseFileDropzoneOptions = {}): UseFileDropzoneReturn {
  const [items, setItems] = useState<UploadFileItem[]>(initialFiles);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

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

          const relativePath = getFileRelativePath(file);

          return {
            id: generateItemId(),
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

  // Drag-and-drop event handlers
  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

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
      onKeyDown: handleKeyDown,
      tabIndex: 0,
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
        webkitdirectory: '',
        directory: '',
      }
      : undefined,
  };
}
