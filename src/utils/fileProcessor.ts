import mammoth from 'mammoth';
import { Attachment } from '../types';

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB limit

export interface ProcessedFileResult {
  attachment: Attachment;
  error?: string;
}

export async function processUploadedFile(file: File): Promise<ProcessedFileResult> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      attachment: { type: 'document', data: '', name: file.name },
      error: `File "${file.name}" exceeds the maximum allowed size of 20MB.`
    };
  }

  const fileName = file.name;
  const lowerName = fileName.toLowerCase();
  const fileType = file.type;

  // 1. Image Files (PNG, JPG, WEBP, GIF, SVG, etc.)
  if (fileType.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          attachment: {
            type: 'image',
            data: dataUrl,
            mimeType: fileType || 'image/png',
            name: fileName,
          }
        });
      };
      reader.onerror = () => {
        resolve({
          attachment: { type: 'image', data: '', name: fileName },
          error: `Failed to read image file: ${fileName}`
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // 2. PDF Files
  if (fileType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          attachment: {
            type: 'document',
            data: dataUrl,
            mimeType: 'application/pdf',
            name: fileName,
          }
        });
      };
      reader.onerror = () => {
        resolve({
          attachment: { type: 'document', data: '', name: fileName },
          error: `Failed to read PDF file: ${fileName}`
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // 3. Word DOCX Files
  if (lowerName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value || '';
      return {
        attachment: {
          type: 'document',
          data: extractedText,
          mimeType: 'text/plain',
          name: fileName,
        }
      };
    } catch (err: any) {
      return {
        attachment: { type: 'document', data: '', name: fileName },
        error: `Failed to parse DOCX file "${fileName}": ${err.message || 'Unknown error'}`
      };
    }
  }

  // 4. Text, CSV, JSON, Markdown, and Code files (JS, TS, PY, HTML, CSS, SQL, BASH, YAML, etc.)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const textContent = (e.target?.result as string) || '';
      let mime = 'text/plain';
      if (lowerName.endsWith('.json') || fileType.includes('json')) mime = 'application/json';
      else if (lowerName.endsWith('.csv') || fileType.includes('csv')) mime = 'text/csv';
      else if (lowerName.endsWith('.md')) mime = 'text/markdown';

      resolve({
        attachment: {
          type: 'document',
          data: textContent,
          mimeType: mime,
          name: fileName,
        }
      });
    };
    reader.onerror = () => {
      resolve({
        attachment: { type: 'document', data: '', name: fileName },
        error: `Failed to read text/code file: ${fileName}`
      });
    };
    reader.readAsText(file);
  });
}
