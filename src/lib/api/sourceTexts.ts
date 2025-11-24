/**
 * Source Texts API Client
 * 
 * Functions for interacting with source text endpoints.
 */

export interface SourceText {
  source_text_id: string;
  title: string;
  writing_prompt?: string;
  file_type: 'pdf' | 'docx' | 'txt';
  file_size_bytes: number;
  created_at: string;
  updated_at: string;
  usage_count?: number;
  extracted_text?: string;
}

export interface UploadSourceTextRequest {
  title: string;
  writing_prompt?: string;
  file_data: string; // base64 encoded
  file_name: string;
  file_type: 'pdf' | 'docx' | 'txt';
}

export interface UploadSourceTextResponse {
  source_text_id: string;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

/**
 * Upload a new source text
 */
export async function uploadSourceText(
  request: UploadSourceTextRequest,
  token: string
): Promise<UploadSourceTextResponse> {
  const response = await fetch('/.netlify/functions/upload-source-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload source text');
  }

  return response.json();
}

/**
 * Get a single source text by ID
 */
export async function getSourceText(
  sourceTextId: string,
  token: string,
  includeContent = false
): Promise<SourceText> {
  const url = new URL('/.netlify/functions/get-source-text', window.location.origin);
  url.searchParams.set('source_text_id', sourceTextId);
  if (includeContent) {
    url.searchParams.set('include_content', 'true');
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch source text');
  }

  return response.json();
}

/**
 * List all source texts for the authenticated teacher
 */
export async function listSourceTexts(token: string): Promise<SourceText[]> {
  const response = await fetch('/.netlify/functions/list-source-texts', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list source texts');
  }

  const data = await response.json();
  return data.source_texts;
}

/**
 * Delete a source text
 */
export async function deleteSourceText(
  sourceTextId: string,
  token: string
): Promise<void> {
  const response = await fetch('/.netlify/functions/delete-source-text', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ source_text_id: sourceTextId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete source text');
  }
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get file type from File object
 */
export function getFileType(file: File): 'pdf' | 'docx' | 'txt' | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx' || extension === 'doc') return 'docx';
  if (extension === 'txt') return 'txt';
  
  // Check MIME type as fallback
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('wordprocessingml') || file.type.includes('msword')) return 'docx';
  if (file.type === 'text/plain') return 'txt';
  
  return null;
}
