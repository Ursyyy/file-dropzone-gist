# 📁 Advanced React File & Folder Dropzone (`useFileDropzone`)

A production-ready, accessible, and headless-friendly file dropzone with native directory recursion, live thumbnail previews, and comprehensive memory leak management.

Written in TypeScript 5 & React 18/19.

---

## 🌟 Key Highlights for Tech Reviewers / Interviewers

1. **Zero-Leak Memory Management (`URL.createObjectURL` & `URL.revokeObjectURL`)**:
   - Previewing large volumes of image files via browser Blob URLs easily leaks memory if not explicitly cleaned up.
   - `useFileDropzone` maintains an active registry of allocated Object URLs and deterministically revokes them on individual file deletion, complete queue clearance, or component unmount.

2. **Recursive Folder & Directory Upload Support**:
   - Integrates HTML5 non-standard directory pickers (`webkitdirectory`, `directory`) and preserves directory hierarchy (`webkitRelativePath`).
   - Prevents native click-event bubbling collisions that otherwise trigger both file and folder pickers concurrently.

3. **Strict Client-Side Validation**:
   - Enforces configurable per-file byte limits (with automatic human-readable size formatting).
   - Validates MIME types and extension rules (supports wildcards like `image/*`, exact types, and extensions like `.pdf`, `.docx`).
   - Limits total simultaneous slots (`maxFiles`) and returns structured, typed errors (`DropzoneError`).

4. **Headless & Composable Architecture**:
   - **`useFileDropzone`**: Pure headless hook managing the state machine, drag events, validation, and browser refs.
   - **`AdvancedFileDropzone`**: Styled UI component (Tailwind CSS) with empty state, animated drag highlights, dismissible alerts, and thumbnail previews.

---

## 📦 File Structure

You can publish this as a multi-file GitHub Gist or use the standalone bundle:

| File | Purpose |
|---|---|
| [`type.ts`](./type.ts) | TypeScript interfaces, errors, and component contracts |
| [`utils.ts`](./utils.ts) | Helper utilities (file size formatting, MIME matching, className merging) |
| [`useFileDropzone.ts`](./useFileDropzone.ts) | Headless hook containing the core browser & validation logic |
| [`FileDropzone.tsx`](./FileDropzone.tsx) | Presentation UI component with Tailwind CSS |
| [`index.ts`](./index.ts) | Public API barrel export |
| [`AdvancedFileDropzone.standalone.tsx`](./AdvancedFileDropzone.standalone.tsx) | **All-in-one bundle** for single-file Gists or sandboxes |

---

## 🚀 Quick Usage Example

```tsx
import React, { useState } from 'react';
import { AdvancedFileDropzone, type UploadFileItem } from './file-dropzone-gist';

export const UploadDemo = () => {
  const [files, setFiles] = useState<UploadFileItem[]>([]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Documents & Media Upload
      </h2>

      <AdvancedFileDropzone
        maxFiles={20}
        maxFileSize={25 * 1024 * 1024} // 25 MB limit
        accept={['image/*', '.pdf', '.docx', '.xlsx']}
        allowFolder={true}
        onChange={(items) => {
          setFiles(items);
          console.log('Current files:', items);
        }}
        onError={(err) => {
          console.warn(`Validation Error [${err.code}]:`, err.message);
        }}
      />
    </div>
  );
};
```

---

## ⚙️ Props Reference

| Prop | Type | Default | Description |
|---|---|---|---|
| `maxFileSize` | `number` | `100MB` | Max file size in bytes |
| `maxFiles` | `number` | `50` | Maximum number of files in the list |
| `accept` | `string[]` | `[]` | Allowed MIME types / extensions |
| `allowFolder` | `boolean` | `true` | Enables nested directory picker |
| `onChange` | `(files: UploadFileItem[]) => void` | `undefined` | Callback on file list change |
| `onError` | `(err: DropzoneError) => void` | `undefined` | Callback on validation failure |
| `disabled` | `boolean` | `false` | Disables dropzone and inputs |
| `className` | `string` | `undefined` | Container CSS classes |

---

## 🛡️ License

MIT — Feel free to use in personal projects and portfolio showcases.
