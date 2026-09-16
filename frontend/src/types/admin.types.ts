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

export interface UploadJobStarted {
  job_id: string;
  status: "processing";
}

export interface UploadJobStatus {
  status: "processing" | "done" | "error";
  result?: UploadResult;
  error?: string;
}

export interface AdminDocument {
  filename: string;
  raw_file_key: string | null;
  counts: {
    text: number;
    table: number;
    image: number;
  };
  total_chunks: number;
}