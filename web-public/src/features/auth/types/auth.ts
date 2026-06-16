export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  preferredLanguage?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: number;
  username: string;
  role: string;
  preferredLanguage: string;
}

export interface AuthUser {
  userId: number;
  username: string;
  role: string;
  preferredLanguage: string;
}
