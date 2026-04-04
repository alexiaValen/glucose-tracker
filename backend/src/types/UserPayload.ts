export interface UserPayload {
  id: string;
  email: string;
  rrole?: "user" | "coach" | "admin";
}