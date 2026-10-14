import React, {
  useCallback,
  useId,
  useMemo,
  useState,
  type FC,
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
import type {
  AdvancedFileDropzoneProps,
  DropzoneError,
  FilePreviewItemRowProps,
} from './type';
import { useFileDropzone } from './useFileDropzone';
import { cn, formatBytes, isImageMime } from './utils';

export const FilePreviewItemRow: FC<FilePreviewItemRowProps> = ({ item, onRemove, disabled }) => {
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
        tabIndex={disabled ? -1 : dropzoneProps.tabIndex}
        onClick={() => !disabled && openFilePicker()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 outline-none',
          'flex flex-col items-center justify-center gap-3 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
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
