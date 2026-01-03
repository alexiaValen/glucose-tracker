import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '30d';

// UserPayload interface - used for JWT tokens
export interface UserPayload {
  userId: string;
  email: string;
  role: 'user' | 'coach' | 'admin';
  firstName?: string;
  lastName?: string;
}

export class AuthService {

  /**
   * Request password reset - generates token and sends email
   */
  async requestPasswordReset(email: string) {
    // Find user
    const result = await pool.query(
      'SELECT id, email, first_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not (security)
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const user = result.rows[0];

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, reset_code, expires_at) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET token_hash = $2, reset_code = $3, expires_at = $4, used_at = NULL`,
      [user.id, resetTokenHash, resetCode, expiresAt]
    );

    // TODO: Send email with reset code
    // For now, just log it (you'll need to integrate an email service)
    console.log(`🔐 Password reset code for ${email}: ${resetCode}`);
    console.log(`   Code expires at: ${expiresAt}`);

    // In production, send email here using service like SendGrid, Mailgun, etc.
    // await this.sendPasswordResetEmail(email, resetCode, user.first_name);

    return { 
      message: 'If that email exists, a reset code has been sent',
      // TEMPORARY: Return code for testing (REMOVE IN PRODUCTION)
      resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined
    };
  }

  /**
   * Verify reset code
   */
  async verifyResetCode(email: string, resetCode: string) {
    const result = await pool.query(
      `SELECT u.id, u.email, prt.reset_code, prt.expires_at, prt.used_at
       FROM users u
       JOIN password_reset_tokens prt ON u.id = prt.user_id
       WHERE u.email = $1 AND prt.reset_code = $2`,
      [email, resetCode]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset code');
    }

    const resetToken = result.rows[0];

    if (resetToken.used_at) {
      throw new Error('Reset code already used');
    }

    if (new Date() > new Date(resetToken.expires_at)) {
      throw new Error('Reset code expired');
    }

    return { valid: true, userId: resetToken.id };
  }

  /**
   * Reset password with code
   */
  async resetPassword(email: string, resetCode: string, newPassword: string) {
    // Verify code first
    await this.verifyResetCode(email, resetCode);

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used
    const result = await pool.query(
      `UPDATE users u
       SET password_hash = $1, updated_at = NOW()
       FROM password_reset_tokens prt
       WHERE u.id = prt.user_id 
       AND u.email = $2 
       AND prt.reset_code = $3
       RETURNING u.id`,
      [passwordHash, email, resetCode]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to reset password');
    }

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens 
       SET used_at = NOW() 
       WHERE reset_code = $1`,
      [resetCode]
    );

    console.log(`✅ Password reset successful for ${email}`);

    return { message: 'Password reset successful' };
  }

  async register(
    email: string,
    password: string,
    role: 'user' | 'coach' = 'user',
    firstName?: string,
    lastName?: string
  ) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, role, first_name, last_name, created_at`,
      [email, passwordHash, role, firstName, lastName]
    );

    const user = result.rows[0];

    await pool.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [user.id]);

    // Auto-assign regular users to main coach and send welcome message
    const MAIN_COACH_ID = '329f8f7a-2e22-4889-8480-67770ba62a47'; // Alexia's ID
    
    if (role === 'user') {
      try {
        // Assign to coach
        await pool.query(
          `INSERT INTO coach_clients (coach_id, client_id) 
           VALUES ($1, $2) 
           ON CONFLICT DO NOTHING`,
          [MAIN_COACH_ID, user.id]
        );
        
        // Send welcome message from coach
        await pool.query(
          `INSERT INTO messages (sender_id, recipient_id, message, read) 
           VALUES ($1, $2, $3, $4)`,
          [
            MAIN_COACH_ID,
            user.id,
            `Welcome to GraceFlow, ${firstName || 'there'}! 👋 I'm so excited to support you on your health journey. Feel free to reach out anytime you have questions or need guidance. Let's work together to help you feel your best! 💚`,
            false
          ]
        );
        
        console.log(`✅ Auto-assigned user ${email} to coach and sent welcome message`);
      } catch (error) {
        console.error('Error auto-assigning coach:', error);
        // Don't fail registration if coach assignment fails
      }
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role, is_active, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'login', ipAddress, userAgent]
    );

    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      ...tokens,
    };
  }

  async generateTokens(payload: UserPayload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
       VALUES ($1, $2, $3)`,
      [payload.userId, tokenHash, expiresAt]
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as UserPayload;

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const result = await pool.query(
        `SELECT id FROM refresh_tokens 
         WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
        [payload.userId, tokenHash]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const accessToken = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          firstName: payload.firstName,
          lastName: payload.lastName,
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );
  }

  verifyAccessToken(token: string): UserPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }
}

export const authService = new AuthService();