import { AppUserRole } from '../enums/app-user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AppUserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AppUserRole;
}
