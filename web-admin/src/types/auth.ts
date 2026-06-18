export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VendorRegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  ownerName: string;
  storeName: string;
  phoneNumber?: string;
  preferredLanguage: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

export interface LoginResponseDto extends AuthTokensDto {
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

export interface AuthSession extends AuthTokensDto {
  user: AuthUser;
}
