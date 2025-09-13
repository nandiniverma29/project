import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStudentProfile, updateStudentProfile, getStudentCourses, getStudentAttendance, addAttendanceCredit } from '../services/student.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/courses', getStudentCourses);
router.get('/attendance', getStudentAttendance);
router.post('/attendance/credit', addAttendanceCredit);

export default router;


