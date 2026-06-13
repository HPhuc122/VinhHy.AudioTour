export interface RoleDto {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}
