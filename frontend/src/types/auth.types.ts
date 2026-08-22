export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}



export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}