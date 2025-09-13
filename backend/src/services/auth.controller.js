import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, seedUsers } from './user.service.js';

const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export async function loginController(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials.' });

  const token = signToken({ id: user.id, role: user.role });
  const { passwordHash, ...safe } = user;
  res.json({ ...safe, token });
}

export async function signupController(req, res) {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'name, email, password, role required.' });
  const normalizedRole = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';

  const existing = await findUserByEmail(email);
  if (existing) return res.status(409).json({ message: 'Email already registered.' });

  const idPrefix = normalizedRole === 'teacher' ? 't' : (normalizedRole === 'admin' ? 'a' : 's');
  const userId = `${idPrefix}${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: userId,
    name,
    email,
    role: normalizedRole,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  
  const savedUser = await createUser(newUser);
  const token = signToken({ id: savedUser.id, role: savedUser.role });
  const { passwordHash: _, ...safe } = savedUser;
  res.status(201).json({ ...safe, token });
}


