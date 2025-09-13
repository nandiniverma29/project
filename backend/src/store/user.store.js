import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const dataDir = path.resolve(process.cwd(), 'backend', 'data');
const usersFile = path.join(dataDir, 'users.json');

async function ensureSeed() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(usersFile);
  } catch {
    const seedPassword = await bcrypt.hash('password123', 10);
    const seed = [
      { 
        id: 's1001', 
        name: 'Student One', 
        email: 'student1@example.com', 
        role: 'student', 
        passwordHash: seedPassword, 
        createdAt: new Date().toISOString(),
        studyPoints: 1250,
        studentId: 'S1001',
        phone: '+91 98765 43210',
        major: 'Computer Science',
        year: '3rd Year'
      },
      { 
        id: 's1002', 
        name: 'Student Two', 
        email: 'student2@example.com', 
        role: 'student', 
        passwordHash: seedPassword, 
        createdAt: new Date().toISOString(),
        studyPoints: 980,
        studentId: 'S1002',
        phone: '+91 98765 43211',
        major: 'Mechanical Engineering',
        year: '2nd Year'
      },
      { 
        id: 's1003', 
        name: 'Nandini Verma', 
        email: 'nandini@example.com', 
        role: 'student', 
        passwordHash: seedPassword, 
        createdAt: new Date().toISOString(),
        studyPoints: 1500,
        studentId: 'S1003',
        phone: '+91 98765 43212',
        major: 'Computer Science',
        year: '4th Year',
        dob: '2002-01-15',
        address: 'Delhi, India',
        careerGoal: 'Full Stack Developer',
        interests: 'Web Development, Machine Learning, UI/UX Design'
      },
      { id: 't1001', name: 'Teacher One', email: 'teacher1@example.com', role: 'teacher', passwordHash: seedPassword, createdAt: new Date().toISOString() },
      { id: 'a1001', name: 'Admin One', email: 'admin1@example.com', role: 'admin', passwordHash: seedPassword, createdAt: new Date().toISOString() },
    ];
    await fs.writeFile(usersFile, JSON.stringify(seed, null, 2), 'utf8');
  }
}

export async function readUsers() {
  await ensureSeed();
  const raw = await fs.readFile(usersFile, 'utf8');
  return JSON.parse(raw);
}

export async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

export async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}


