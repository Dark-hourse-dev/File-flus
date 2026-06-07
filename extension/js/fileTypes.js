/**
 * FileFlux — File Utilities
 * Maps file extensions to icons, names, viewers, and conversion options.
 */

export const FILE_TYPES = {
  // Documents
  pdf:   { icon: '📄', name: 'PDF Document',      viewer: 'pdf',    color: '#ff4444', category: 'document' },
  docx:  { icon: '📝', name: 'Word Document',      viewer: 'office', color: '#2b7bb8', category: 'document' },
  doc:   { icon: '📝', name: 'Word Document',      viewer: 'office', color: '#2b7bb8', category: 'document' },
  pptx:  { icon: '📊', name: 'PowerPoint',         viewer: 'office', color: '#d04929', category: 'document' },
  ppt:   { icon: '📊', name: 'PowerPoint',         viewer: 'office', color: '#d04929', category: 'document' },
  xlsx:  { icon: '📗', name: 'Excel Spreadsheet',  viewer: 'office', color: '#1f7244', category: 'document' },
  xls:   { icon: '📗', name: 'Excel Spreadsheet',  viewer: 'office', color: '#1f7244', category: 'document' },
  odt:   { icon: '📝', name: 'OpenDocument Text',  viewer: 'office', color: '#3daee9', category: 'document' },
  rtf:   { icon: '📄', name: 'Rich Text Format',   viewer: 'text',   color: '#888',    category: 'document' },
  txt:   { icon: '🗒️', name: 'Text File',           viewer: 'text',   color: '#aaa',    category: 'text'     },
  md:    { icon: '📑', name: 'Markdown',            viewer: 'text',   color: '#00f5ff', category: 'text'     },
  csv:   { icon: '📊', name: 'CSV Spreadsheet',     viewer: 'table',  color: '#39ff14', category: 'document' },
  json:  { icon: '🔧', name: 'JSON Data',           viewer: 'code',   color: '#ffe600', category: 'code'     },
  xml:   { icon: '🔧', name: 'XML Data',            viewer: 'code',   color: '#ffe600', category: 'code'     },

  // Images
  jpg:   { icon: '🖼️', name: 'JPEG Image',          viewer: 'image',  color: '#ff8c00', category: 'image' },
  jpeg:  { icon: '🖼️', name: 'JPEG Image',          viewer: 'image',  color: '#ff8c00', category: 'image' },
  png:   { icon: '🖼️', name: 'PNG Image',           viewer: 'image',  color: '#00c8ff', category: 'image' },
  gif:   { icon: '🎞️', name: 'GIF Animation',       viewer: 'image',  color: '#ff2d9e', category: 'image' },
  webp:  { icon: '🖼️', name: 'WebP Image',          viewer: 'image',  color: '#00c8ff', category: 'image' },
  svg:   { icon: '✏️', name: 'SVG Vector',           viewer: 'image',  color: '#b14aed', category: 'image' },
  bmp:   { icon: '🖼️', name: 'Bitmap Image',        viewer: 'image',  color: '#888',    category: 'image' },
  ico:   { icon: '🔲', name: 'Icon File',            viewer: 'image',  color: '#888',    category: 'image' },
  tiff:  { icon: '🖼️', name: 'TIFF Image',          viewer: 'image',  color: '#888',    category: 'image' },
  heic:  { icon: '🖼️', name: 'HEIC Image',          viewer: 'image',  color: '#ff8c00', category: 'image' },
  avif:  { icon: '🖼️', name: 'AVIF Image',          viewer: 'image',  color: '#00c8ff', category: 'image' },

  // Video
  mp4:   { icon: '🎬', name: 'MP4 Video',           viewer: 'video',  color: '#ff4444', category: 'video' },
  mkv:   { icon: '🎬', name: 'MKV Video',           viewer: 'video',  color: '#ff4444', category: 'video' },
  webm:  { icon: '🎬', name: 'WebM Video',          viewer: 'video',  color: '#39ff14', category: 'video' },
  avi:   { icon: '🎬', name: 'AVI Video',            viewer: 'video',  color: '#888',    category: 'video' },
  mov:   { icon: '🎬', name: 'QuickTime Video',      viewer: 'video',  color: '#888',    category: 'video' },
  flv:   { icon: '🎬', name: 'Flash Video',          viewer: 'video',  color: '#888',    category: 'video' },

  // Audio
  mp3:   { icon: '🎵', name: 'MP3 Audio',            viewer: 'audio',  color: '#b14aed', category: 'audio' },
  wav:   { icon: '🎵', name: 'WAV Audio',            viewer: 'audio',  color: '#b14aed', category: 'audio' },
  flac:  { icon: '🎵', name: 'FLAC Audio',           viewer: 'audio',  color: '#00f5ff', category: 'audio' },
  ogg:   { icon: '🎵', name: 'OGG Audio',            viewer: 'audio',  color: '#39ff14', category: 'audio' },
  aac:   { icon: '🎵', name: 'AAC Audio',            viewer: 'audio',  color: '#ff8c00', category: 'audio' },
  m4a:   { icon: '🎵', name: 'M4A Audio',            viewer: 'audio',  color: '#ff8c00', category: 'audio' },

  // Archives
  zip:   { icon: '🗜️', name: 'ZIP Archive',          viewer: 'archive',color: '#ffe600', category: 'archive' },
  rar:   { icon: '🗜️', name: 'RAR Archive',          viewer: 'archive',color: '#ff8c00', category: 'archive' },
  '7z':  { icon: '🗜️', name: '7-Zip Archive',        viewer: 'archive',color: '#ff8c00', category: 'archive' },
  tar:   { icon: '🗜️', name: 'TAR Archive',          viewer: 'archive',color: '#888',    category: 'archive' },
  gz:    { icon: '🗜️', name: 'GZip Archive',         viewer: 'archive',color: '#888',    category: 'archive' },

  // Code
  js:    { icon: '⚡', name: 'JavaScript',            viewer: 'code',   color: '#ffe600', category: 'code' },
  ts:    { icon: '⚡', name: 'TypeScript',            viewer: 'code',   color: '#3a86ff', category: 'code' },
  py:    { icon: '🐍', name: 'Python',               viewer: 'code',   color: '#3daee9', category: 'code' },
  html:  { icon: '🌐', name: 'HTML',                 viewer: 'code',   color: '#ff6b35', category: 'code' },
  css:   { icon: '🎨', name: 'CSS',                  viewer: 'code',   color: '#b14aed', category: 'code' },
  rs:    { icon: '⚙️', name: 'Rust',                  viewer: 'code',   color: '#ff6b35', category: 'code' },
  go:    { icon: '⚙️', name: 'Go',                   viewer: 'code',   color: '#00f5ff', category: 'code' },
  java:  { icon: '☕', name: 'Java',                  viewer: 'code',   color: '#ff6b35', category: 'code' },
  cpp:   { icon: '⚙️', name: 'C++',                  viewer: 'code',   color: '#3a86ff', category: 'code' },
  c:     { icon: '⚙️', name: 'C',                    viewer: 'code',   color: '#3a86ff', category: 'code' },
  rb:    { icon: '💎', name: 'Ruby',                  viewer: 'code',   color: '#ff2d9e', category: 'code' },
  php:   { icon: '🐘', name: 'PHP',                  viewer: 'code',   color: '#b14aed', category: 'code' },
  sh:    { icon: '💻', name: 'Shell Script',          viewer: 'code',   color: '#39ff14', category: 'code' },
  sql:   { icon: '🗄️', name: 'SQL',                  viewer: 'code',   color: '#00f5ff', category: 'code' },
  yaml:  { icon: '🔧', name: 'YAML Config',          viewer: 'code',   color: '#ff8c00', category: 'code' },
  toml:  { icon: '🔧', name: 'TOML Config',          viewer: 'code',   color: '#ff8c00', category: 'code' },
  ini:   { icon: '🔧', name: 'INI Config',           viewer: 'code',   color: '#888',    category: 'code' },

  // 3D & Design
  stl:   { icon: '🎲', name: '3D STL Model',         viewer: '3d',     color: '#00f5ff', category: '3d'   },
  obj:   { icon: '🎲', name: '3D OBJ Model',         viewer: '3d',     color: '#00f5ff', category: '3d'   },
  glb:   { icon: '🎲', name: 'GLTF Binary',          viewer: '3d',     color: '#b14aed', category: '3d'   },
  gltf:  { icon: '🎲', name: 'GLTF Model',           viewer: '3d',     color: '#b14aed', category: '3d'   },
  psd:   { icon: '🎨', name: 'Photoshop',            viewer: 'image',  color: '#3a86ff', category: 'design'},
  ai:    { icon: '🎨', name: 'Illustrator',          viewer: 'image',  color: '#ff8c00', category: 'design'},
  sketch:{ icon: '🎨', name: 'Sketch',               viewer: 'image',  color: '#ff8c00', category: 'design'},
  fig:   { icon: '🎨', name: 'Figma',                viewer: 'image',  color: '#b14aed', category: 'design'},

  // eBooks
  epub:  { icon: '📚', name: 'ePub eBook',           viewer: 'epub',   color: '#39ff14', category: 'ebook' },
  mobi:  { icon: '📚', name: 'Mobi eBook',           viewer: 'text',   color: '#ff8c00', category: 'ebook' },
  fb2:   { icon: '📚', name: 'FictionBook',          viewer: 'text',   color: '#888',    category: 'ebook' },
};

export function getFileInfo(ext) {
  const key = (ext || '').toLowerCase().replace('.', '');
  return FILE_TYPES[key] || { icon: '📁', name: `${key.toUpperCase()} File`, viewer: 'unknown', color: '#888', category: 'other' };
}

export function getExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFilenameFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    return parts[parts.length - 1] || u.hostname;
  } catch {
    return url.split('/').pop() || 'file';
  }
}

export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

export const CONVERSION_MAP = {
  // Image conversions
  jpg:  ['png', 'webp', 'gif', 'bmp', 'pdf'],
  jpeg: ['png', 'webp', 'gif', 'bmp', 'pdf'],
  png:  ['jpg', 'webp', 'gif', 'bmp', 'pdf', 'svg'],
  webp: ['jpg', 'png', 'gif'],
  gif:  ['jpg', 'png', 'webp', 'mp4'],
  bmp:  ['jpg', 'png', 'webp'],
  svg:  ['png', 'jpg', 'pdf'],
  heic: ['jpg', 'png', 'webp'],

  // Document conversions
  pdf:  ['txt', 'docx', 'png', 'jpg'],
  docx: ['pdf', 'txt', 'html', 'md', 'odt'],
  doc:  ['pdf', 'txt', 'html', 'docx'],
  pptx: ['pdf', 'jpg', 'png'],
  xlsx: ['csv', 'pdf', 'json'],
  xls:  ['csv', 'pdf', 'xlsx', 'json'],
  csv:  ['xlsx', 'json', 'html'],
  json: ['csv', 'yaml', 'xml'],
  yaml: ['json', 'toml'],
  xml:  ['json', 'csv'],
  txt:  ['pdf', 'docx', 'md', 'html'],
  md:   ['html', 'pdf', 'docx', 'txt'],
  html: ['pdf', 'txt', 'md'],

  // Audio conversions
  mp3:  ['wav', 'ogg', 'flac', 'aac', 'm4a'],
  wav:  ['mp3', 'ogg', 'flac', 'aac'],
  flac: ['mp3', 'wav', 'ogg'],
  ogg:  ['mp3', 'wav'],
  aac:  ['mp3', 'wav'],
  m4a:  ['mp3', 'wav', 'aac'],

  // Video conversions
  mp4:  ['webm', 'gif', 'mp3', 'avi'],
  mkv:  ['mp4', 'webm', 'avi', 'mp3'],
  webm: ['mp4', 'gif'],
  avi:  ['mp4', 'mkv', 'webm'],
  mov:  ['mp4', 'webm', 'avi'],
};

export function getConversionOptions(ext) {
  return CONVERSION_MAP[(ext || '').toLowerCase()] || [];
}
