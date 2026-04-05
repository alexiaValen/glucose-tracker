export interface UserPayload {
  id: string;
  email: string;
  role?: "user" | "coach" | "admin" | string  ;
  user?: {
    firstName: string;
    lastName: string;
    id: string;
  };
}