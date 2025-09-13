import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { seedUsers } from './services/user.service.js';
import authRouter from './routes/auth.js';
import studentRouter from './routes/student.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ 
  origin: true, // allow all origins to simplify local testing
  credentials: false 
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smartapp-backend', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Seed JSON store (no MongoDB required)
seedUsers();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});


