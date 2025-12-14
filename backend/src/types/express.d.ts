// import { UserPayload } from '../../interfaces/UserPayload';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'user' | 'coach' | 'admin';
      };
    }
  }
}

export {};