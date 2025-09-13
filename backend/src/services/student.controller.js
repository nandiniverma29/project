import { findUserById, updateUser } from './user.service.js';

// In absence of a real DB for courses/attendance, keep simple demo stores in memory.
// These mimic the defaults in the frontend to provide data from backend.
const demoCoursesByStudentId = new Map();
const demoAttendanceByStudentId = new Map();

function ensureDemoData(studentId) {
  if (!demoCoursesByStudentId.has(studentId)) {
    demoCoursesByStudentId.set(studentId, [
      { id: 'c1', code: 'CS201', title: 'Data Structures & Algorithms', progress: 88, credits: 4 },
      { id: 'c2', code: 'CS310', title: 'Database Management Systems', progress: 72, credits: 3 },
      { id: 'c3', code: 'MA101', title: 'Linear Algebra', progress: 95, credits: 3 },
      { id: 'c4', code: 'CS450', title: 'Machine Learning', progress: 64, credits: 4 }
    ]);
  }
  if (!demoAttendanceByStudentId.has(studentId)) {
    demoAttendanceByStudentId.set(studentId, [
      { subject: 'Data Structures & Algorithms', total: 40, attended: 36 },
      { subject: 'Database Management Systems', total: 42, attended: 32 },
      { subject: 'Linear Algebra', total: 38, attended: 35 },
      { subject: 'Machine Learning', total: 30, attended: 22 },
      { subject: 'Physics', total: 28, attended: 20 }
    ]);
  }
}

export async function getStudentProfile(req, res) {
  const user = await findUserById(req.user.id);
  if (!user || user.role !== 'student') return res.status(404).json({ message: 'Student not found' });
  
  // Return user-specific data
  res.json({ 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    studyPoints: user.studyPoints || 1250, 
    studentId: user.studentId || 'S' + user.id, 
    phone: user.phone || '', 
    dob: user.dob || '', 
    address: user.address || '', 
    major: user.major || 'Computer Science', 
    year: user.year || '3rd Year', 
    enrollmentDate: user.enrollmentDate || '2023-08-01', 
    careerGoal: user.careerGoal || 'Software Developer', 
    interests: user.interests || 'Web Development, AI/ML, Cybersecurity',
    achievements: user.achievements || []
  });
}

export async function updateStudentProfile(req, res) {
  const payload = req.body || {};
  const user = await findUserById(req.user.id);
  if (!user || user.role !== 'student') return res.status(404).json({ message: 'Student not found' });
  
  const allowed = ['name','phone','dob','address','major','year','enrollmentDate','careerGoal','interests'];
  const updateData = {};
  for (const k of allowed) {
    if (payload[k] !== undefined) updateData[k] = payload[k];
  }
  
  await updateUser(req.user.id, updateData);
  res.json({ ok: true });
}

export async function getStudentCourses(req, res) {
  ensureDemoData(req.user.id);
  res.json(demoCoursesByStudentId.get(req.user.id));
}

export async function getStudentAttendance(req, res) {
  ensureDemoData(req.user.id);
  res.json(demoAttendanceByStudentId.get(req.user.id));
}

export async function addAttendanceCredit(req, res) {
  ensureDemoData(req.user.id);
  const { courseId } = req.body || {};
  const courses = demoCoursesByStudentId.get(req.user.id);
  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(400).json({ message: 'Invalid courseId' });
  const attendance = demoAttendanceByStudentId.get(req.user.id);
  const record = attendance.find(a => a.subject === course.title);
  if (record) { record.attended += 1; record.total += 1; }
  return res.json({ ok: true });
}


