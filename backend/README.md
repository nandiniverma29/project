# Smart Curriculum Activity & Attendance — Backend

**Stack:** Node.js, Express, MongoDB (Mongoose), JWT auth

## Quick Start

1. Install deps
```bash
npm install
```
2. Copy env
```bash
cp .env.example .env
```
3. Start MongoDB locally or set `MONGO_URI` to your Atlas cluster.
4. Seed sample data (optional)
```bash
npm run seed
```
5. Run
```bash
npm run dev
```

## API Overview (base: `/api`)

- `POST /auth/register` — { name,email,password,role }
- `POST /auth/login` — { email,password }
- `GET /courses` — list courses for logged-in user
- `POST /courses` — (admin) create course
- `POST /courses/:courseId/enroll` — (teacher/admin) add students
- `POST /attendance` — (teacher/admin) mark attendance: { courseId, date, records:[{studentId,status}] }
- `GET /attendance/:courseId?from=&to=` — attendance list
- `GET /assignments/:courseId` — list
- `POST /assignments/:courseId` — (teacher/admin) create
- `GET /assignments/submissions/:assignmentId` — list submissions
- `POST /assignments/submissions/:assignmentId` — upsert submission
- `GET /announcements?courseId=` — list
- `POST /announcements` — (teacher/admin) create

Auth: Send `Authorization: Bearer <token>` header.
