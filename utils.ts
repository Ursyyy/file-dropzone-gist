export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}


export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function isImageMime(type: string): boolean {
  return type.startsWith('image/');
}

export function matchesAccept(file: File, acceptedRules: string[]): boolean {
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

export function generateItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getFileRelativePath(file: File): string | undefined {
  return (
    (file as { webkitRelativePath?: string }).webkitRelativePath ||
    (file as { path?: string }).path ||
    undefined
  );
}
