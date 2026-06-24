export interface UserDto {
  id: number;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  roleId: number;
  preferredLanguage?: string;
}

export interface UpdateUserRequest {
  password?: string;
  roleId?: number;
  preferredLanguage?: string;
  isActive?: boolean;
}
