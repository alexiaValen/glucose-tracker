import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { body, validationResult } from 'express-validator';

const router = Router();

// POST /api/v1/auth/request-reset
router.post(
  '/request-reset',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/v1/auth/verify-reset-code
router.post(
  '/verify-reset-code',
  [
    body('email').isEmail().normalizeEmail(),
    body('resetCode').isLength({ min: 6, max: 6 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, resetCode } = req.body;
      const result = await authService.verifyResetCode(email, resetCode);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('resetCode').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, resetCode, newPassword } = req.body;
      const result = await authService.resetPassword(email, resetCode, newPassword);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').optional().isIn(['user', 'coach']),
    body('phone').optional(), // ADD validation
    body('dateOfBirth').optional().isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        email, 
        password, 
        role = 'user', 
        firstName, 
        lastName,
        phone,
        dateOfBirth
       } = req.body;
      const result = await authService.register(
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        dateOfBirth);

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await authService.login(
        email,
        password,
        req.ip,
        req.get('user-agent')
      );

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
);

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;