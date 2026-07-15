import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { dbQuery, addAuditLog } from '../services/db';

const getJwtSecret = () => process.env.JWT_SECRET || 'anvesha_christ_university_super_secret_key_2026';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const inputStr = (username || '').trim().toLowerCase();

  try {
    if (!password || password !== 'Anvesha@2026') {
      res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      return;
    }

    const rowsRes = await dbQuery('SELECT * FROM users');
    const users = rowsRes.rows;

    // Find user by username or email or role match
    const user = users.find((u: any) => 
      u.username.toLowerCase() === inputStr || 
      u.email.toLowerCase() === inputStr ||
      u.username.toLowerCase().split('@')[0] === inputStr ||
      u.role.toLowerCase() === inputStr ||
      (u.role === 'admin' && inputStr === 'admin') ||
      (u.role === 'registration_team' && (inputStr === 'registration' || inputStr === 'verify')) ||
      (u.role === 'hospitality_team' && (inputStr === 'hospitality' || inputStr === 'hosp')) ||
      (u.role === 'faculty_football' && inputStr === 'football') ||
      (u.role === 'certificate_team' && (inputStr === 'certificate' || inputStr === 'certs')) ||
      (u.role === 'officials' && (inputStr === 'official' || inputStr === 'officials'))
    );
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User account not found.' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name, eventId: user.event_id || user.eventId },
      getJwtSecret(),
      { expiresIn: '12h' }
    );

    await addAuditLog(user.name, user.role, 'LOGIN', `User ${user.username} logged into system.`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        eventId: user.event_id || user.eventId
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const getMe = (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No authorization token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    res.json({ success: true, user: decoded });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

