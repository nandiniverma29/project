import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true, enum: ['student', 'teacher', 'admin'] },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // Student-specific fields
  studyPoints: { type: Number, default: 1250 },
  studentId: String,
  phone: String,
  dob: String,
  address: String,
  major: String,
  year: String,
  enrollmentDate: String,
  careerGoal: String,
  interests: String,
  achievements: [{
    id: String,
    title: String,
    description: String,
    date: String
  }]
});

export default mongoose.model('User', userSchema);
