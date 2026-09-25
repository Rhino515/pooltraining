/**
 * Export a text file: Web Share API with a File when the browser allows it (iPhone share sheet → Save to Files,
 * AirDrop, Messages …), otherwise a normal download. Android Chrome only shares a fixed list of file types, so a
 * .pooliq file is normally downloaded there (Downloads folder).
 */
export function canShareFile(file) {
  try { return !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { return false; }
}
export function downloadText(name, text, type = 'application/octet-stream') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
/** → Promise<'shared' | 'downloaded' | 'cancelled'> */
export function shareOrDownload(name, text, { title = 'Pool IQ content' } = {}) {
  const file = typeof File === 'function' ? new File([text], name, { type: 'application/json' }) : null;
  if (canShareFile(file)) {
    return navigator.share({ files: [file], title }).then(() => 'shared').catch((err) => {
      if (err && err.name === 'AbortError') return 'cancelled';
      downloadText(name, text);
      return 'downloaded';
    });
  }
  downloadText(name, text);
  return Promise.resolve('downloaded');
}
