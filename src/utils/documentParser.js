import mammoth from 'mammoth';
import JSZip from 'jszip';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Parse a document file and extract text content.
 * Returns { text, isPdf, error }
 * - text: extracted text content (null for PDFs)
 * - isPdf: true if file needs server-side processing
 * - error: error message if parsing failed
 */
export async function parseDocument(file) {
  if (file.size > MAX_FILE_SIZE) {
    return { error: `File too large. Maximum size is 10MB.` };
  }

  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'txt':
      return parseTxt(file);
    case 'docx':
      return parseDocx(file);
    case 'pptx':
      return parsePptx(file);
    case 'pdf':
      return { text: null, isPdf: true, file };
    default:
      return { error: `Unsupported file type: .${extension}` };
  }
}

/**
 * Parse plain text file
 */
async function parseTxt(file) {
  try {
    const text = await file.text();
    if (!text.trim()) {
      return { error: 'File appears to be empty' };
    }
    return { text: text.trim() };
  } catch (err) {
    console.error('TXT parsing error:', err);
    return { error: 'Failed to read text file' };
  }
}

/**
 * Parse Word document (.docx)
 */
async function parseDocx(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value.trim()) {
      return { error: 'No text content found in document' };
    }

    // Log any warnings (but don't fail)
    if (result.messages.length > 0) {
      console.warn('Mammoth warnings:', result.messages);
    }

    return { text: result.value.trim() };
  } catch (err) {
    console.error('DOCX parsing error:', err);
    return { error: 'Failed to read Word document. File may be corrupted or password-protected.' };
  }
}

/**
 * Parse PowerPoint document (.pptx)
 * PPTX files are ZIP archives containing XML files for each slide
 */
async function parsePptx(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find all slide XML files
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        // Sort by slide number
        const numA = parseInt(a.match(/slide(\d+)/)[1]);
        const numB = parseInt(b.match(/slide(\d+)/)[1]);
        return numA - numB;
      });

    if (slideFiles.length === 0) {
      return { error: 'No slides found in PowerPoint file' };
    }

    const textParts = [];

    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile).async('text');
      const slideText = extractTextFromSlideXml(content);
      if (slideText.trim()) {
        textParts.push(slideText.trim());
      }
    }

    const fullText = textParts.join('\n\n');

    if (!fullText.trim()) {
      return { error: 'No text content found in PowerPoint slides' };
    }

    return { text: fullText };
  } catch (err) {
    console.error('PPTX parsing error:', err);
    return { error: 'Failed to read PowerPoint file. File may be corrupted or password-protected.' };
  }
}

/**
 * Extract text content from PowerPoint slide XML
 * Text is contained in <a:t> tags within the XML
 */
function extractTextFromSlideXml(xml) {
  const textParts = [];

  // Match all <a:t>...</a:t> tags (text content in OOXML)
  const textRegex = /<a:t>([^<]*)<\/a:t>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1].trim();
    if (text) {
      textParts.push(text);
    }
  }

  // Join with spaces, but try to detect paragraph breaks
  // In PPTX, new paragraphs typically start with <a:p> tags
  // For simplicity, we'll join all text with spaces and let natural breaks happen
  return textParts.join(' ');
}

/**
 * Get accepted file types for input element
 */
export function getAcceptedFileTypes() {
  return '.txt,.docx,.pdf,.pptx';
}

/**
 * Check if a file type is supported
 */
export function isFileTypeSupported(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  return ['txt', 'docx', 'pdf', 'pptx'].includes(extension);
}
