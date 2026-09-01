export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface UploadResult {
  status: 'success' | 'skipped';
  filename: string;
  raw_file_key?: string;
  reason?: string;
  counts?: {
    texts: number;
    tables: number;
    images: number;
    total_indexed: number;
  };
}