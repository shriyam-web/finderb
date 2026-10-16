const MAX_CV_BYTES = 5_000_000;

const ALLOWED = new Set(['pdf', 'doc', 'docx']);

export type CvKind = 'pdf' | 'doc' | 'docx';

export type InspectedCv = {
  kind: CvKind;
  bytes: Buffer;
  safeName: string;
  contentType: string;
};

function extensionOf(filename: string): string {
  const base = filename.split(/[/\\]/).pop() || '';
  const parts = base.toLowerCase().split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1] || '';
}

function safeDownloadName(filename: string, kind: CvKind): string {
  const base = (filename.split(/[/\\]/).pop() || 'cv')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._ -]/g, '')
    .trim()
    .slice(0, 80);
  return `${base || 'cv'}.${kind}`;
}

function hasDangerousAscii(bytes: Buffer): boolean {
  const head = bytes.subarray(0, 8);
  if (head[0] === 0x4d && head[1] === 0x5a) return true;
  if (head[0] === 0x7f && head[1] === 0x45 && head[2] === 0x4c && head[3] === 0x46) return true;
  const sample = bytes.subarray(0, Math.min(bytes.length, 64)).toString('utf8');
  return sample.startsWith('#!') || sample.startsWith('<?php') || sample.startsWith('<script');
}

function zipNames(bytes: Buffer): string[] {
  const names: string[] = [];
  let offset = 0;
  while (offset + 30 < bytes.length) {
    if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4b || bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
      offset += 1;
      continue;
    }
    const nameLen = bytes.readUInt16LE(offset + 26);
    const extraLen = bytes.readUInt16LE(offset + 28);
    const start = offset + 30;
    if (start + nameLen > bytes.length) break;
    names.push(bytes.subarray(start, start + nameLen).toString('utf8'));
    const compressed = bytes.readUInt32LE(offset + 18);
    offset = start + nameLen + extraLen + compressed;
  }
  return names;
}

function docxIsUnsafe(bytes: Buffer): boolean {
  const names = zipNames(bytes).map((name) => name.replace(/\\/g, '/').toLowerCase());
  if (!names.some((name) => name === 'word/document.xml' || name.endsWith('/word/document.xml'))) return true;
  return names.some((name) => {
    if (name.includes('..')) return true;
    if (name.includes('vbaproject')) return true;
    return /\.(exe|apk|js|vbs|bat|cmd|scr|dll|msi|html|htm|svg|jar|ps1)$/i.test(name);
  });
}

function pdfIsUnsafe(bytes: Buffer): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 1_500_000)).toString('latin1');
  return /\/JavaScript|\/JS\b|\/Launch|\/EmbeddedFile|\/OpenAction|\/AA\b/i.test(sample);
}

export function inspectCv(filename: string, bytes: Buffer): { ok: true; file: InspectedCv } | { ok: false; error: string } {
  if (!bytes.length) return { ok: false, error: 'The CV file is empty.' };
  if (bytes.length > MAX_CV_BYTES) return { ok: false, error: 'CV must be 5 MB or smaller.' };
  const ext = extensionOf(filename);
  if (!ALLOWED.has(ext)) {
    return { ok: false, error: 'Upload a PDF, DOC, or DOCX only.' };
  }
  if ((filename.match(/\./g) || []).length > 1 && !filename.toLowerCase().endsWith(`.${ext}`)) {
    return { ok: false, error: 'Upload a PDF, DOC, or DOCX only.' };
  }
  if (hasDangerousAscii(bytes)) {
    return { ok: false, error: 'This file is not an allowed document.' };
  }

  if (ext === 'pdf') {
    if (bytes.subarray(0, 5).toString('utf8') !== '%PDF-') {
      return { ok: false, error: 'This PDF could not be read. Upload a real PDF.' };
    }
    if (pdfIsUnsafe(bytes)) {
      return { ok: false, error: 'This PDF includes scripts or embedded files. Upload a plain PDF.' };
    }
    return {
      ok: true,
      file: {
        kind: 'pdf',
        bytes,
        safeName: safeDownloadName(filename, 'pdf'),
        contentType: 'application/pdf',
      },
    };
  }

  if (ext === 'docx') {
    const zip = bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!zip || docxIsUnsafe(bytes)) {
      return { ok: false, error: 'This Word file could not be accepted. Upload a plain DOCX without macros.' };
    }
    return {
      ok: true,
      file: {
        kind: 'docx',
        bytes,
        safeName: safeDownloadName(filename, 'docx'),
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    };
  }

  const ole = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (!ole) return { ok: false, error: 'This Word file could not be read. Upload a real DOC or a DOCX.' };
  const ascii = bytes.toString('latin1');
  if (/vbaProject|_VBA_PROJECT|Macros/i.test(ascii)) {
    return { ok: false, error: 'Word files with macros are not accepted.' };
  }
  return {
    ok: true,
    file: {
      kind: 'doc',
      bytes,
      safeName: safeDownloadName(filename, 'doc'),
      contentType: 'application/msword',
    },
  };
}
