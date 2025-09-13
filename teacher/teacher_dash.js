/************************************************************************************************
 * Comprehensive Teacher Dashboard (Fully Functional Prototype)
 * — Fully wired views, CRUD with localStorage, charts, exports, modals, toasts.
 * — NEW: Includes Live QR Code Attendance Session feature.
 ************************************************************************************************/
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = (id) => document.getElementById(id);

  // --- SIMULATION: In a real app, this would come from a login session ---
  const LOGGED_IN_TEACHER_ID = 't01';

  /************************************************************************************************
   * SIMULATED DATABASE (persisted in localStorage)
   ************************************************************************************************/
  const DB_KEY = 'teacherDashboardDB_v5';
  let seed = JSON.parse(localStorage.getItem('teacherDashboardDB_v3')) || JSON.parse(localStorage.getItem('teacherDashboardDB_v4'));
  let db = JSON.parse(localStorage.getItem(DB_KEY)) || seed || {
    users: [
      { id: 's101', name: 'Arjun Verma', role: 'student', email: 'arjun@example.com' },
      { id: 's102', name: 'Priya Singh', role: 'student', email: 'priya@example.com' },
      { id: 's103', name: 'Rohan Mehta', role: 'student', email: 'rohan@example.com' },
      { id: 's104', name: 'Sneha Patil', role: 'student', email: 'sneha@example.com' },
      { id: 't01', name: `Souvik Das`, role: 'teacher', email: 'souvik.das@example.edu', department: 'Computer Science', officeHours: 'Mon, Wed 10-11 AM' },
      { id: 't02', name: 'Dr. Vikram Rathod', role: 'teacher', email: 'vikram@example.edu', department: 'Mechanical Engg', officeHours: 'Tue, Thu 2-3 PM' },
    ],
    courses: [
      { id: 'c1', name: 'Data Structures & Algorithms', code: 'CS201', teacherId: 't01', syllabusProgress: 75, studentIds: ['s101', 's102', 's104'] },
      { id: 'c2', name: 'Database Management Systems', code: 'CS310', teacherId: 't01', syllabusProgress: 50, studentIds: ['s101', 's102'] },
      { id: 'c3', name: 'Thermodynamics', code: 'ME305', teacherId: 't02', syllabusProgress: 90, studentIds: ['s103'] },
    ],
    courseMaterials: [
      { id: 'm1', courseId: 'c1', type: 'syllabus', title: 'CS201 Syllabus 2025', url: '#' },
      { id: 'm2', courseId: 'c1', type: 'notes', title: 'Lecture 1: Intro to Big O', url: '#' },
    ],
    assignments: [
      { id: 'a1', courseId: 'c1', title: 'Assignment 1: Sorting Algorithms', dueDate: '2025-09-15' },
      { id: 'a2', courseId: 'c1', title: 'Mid-Term Exam', dueDate: '2025-10-10' },
      { id: 'a3', courseId: 'c2', title: 'Project: SQL Queries', dueDate: '2025-09-20' },
    ],
    submissions: [
      { id: 'sub1', assignmentId: 'a1', studentId: 's101', submittedAt: '2025-09-14', grade: 85, feedback: 'Good work.' },
      { id: 'sub2', assignmentId: 'a1', studentId: 's102', submittedAt: '2025-09-15', grade: 92, feedback: 'Excellent.' },
      { id: 'sub3', assignmentId: 'a1', studentId: 's104', submittedAt: null, grade: null, feedback: null },
      { id: 'sub4', assignmentId: 'a3', studentId: 's101', submittedAt: '2025-09-19', grade: 78, feedback: 'Well done.' },
      { id: 'sub5', assignmentId: 'a3', studentId: 's102', submittedAt: null, grade: null, feedback: null },
    ],
    attendance: [
      { id: 'att1', courseId: 'c1', date: '2025-09-05', studentId: 's101', status: 'present' },
      { id: 'att2', courseId: 'c1', date: '2025-09-05', studentId: 's102', status: 'present' },
      { id: 'att3', courseId: 'c1', date: '2025-09-05', studentId: 's104', status: 'absent' },
    ],
    announcements: [
        { id: 'an1', courseId: 'c1', title: 'Mid-Term Exam Schedule', content: 'The mid-term exam for CS201 will be held on October 10th.', date: '2025-09-01' },
        { id: 'an2', courseId: null, title: 'College Holiday Notice', content: `The college will be closed on ${new Date().getFullYear()}-10-02 for Gandhi Jayanti.`, date: '2025-09-03' },
    ],
    messages: [
        { id:'msg1', studentId: 's101', teacherId: 't01', history: [{from: 's101', text:'Sir, I have a doubt about the last lecture.'}, {from: 't01', text: 'Sure, Arjun. Please specify the topic.'}]}
    ],
  };
  const saveDb = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

  /************************************************************************************************
   * STATE & UTILITIES
   ************************************************************************************************/
  const state = {
    teacher: db.users.find(u => u.id === LOGGED_IN_TEACHER_ID),
    get myCourses() { return db.courses.filter(c => c.teacherId === LOGGED_IN_TEACHER_ID); },
    theme: localStorage.getItem('theme') || 'light',
    calendarDate: new Date(),
    ui: {
      attendance: { courseId: null, date: new Date().toISOString().slice(0, 10) },
      assignments: { courseId: null },
      reports: { courseId: null },
      messages: { studentId: null },
      courseDetail: { courseId: null, tab: 'materials' },
      // --- NEW: State for live session ---
      liveSession: {
        active: false,
        courseId: null,
        timerInterval: null,
        simulationInterval: null,
        qrCodeData: null
      }
    }
  };
  document.documentElement.dataset.theme = state.theme;

  // Toasts
  const toastStack = byId('toastStack');
  const toast = (msg, type = 'primary') => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.style.borderLeftColor = type === 'danger' ? 'var(--danger)' : (type === 'warning' ? 'var(--warning)' : 'var(--primary)');
    el.textContent = msg;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(() => el.remove(), 300);
    }, 2200);
  };

  // --- MODIFIED: Cleanup function for timers and charts ---
  let chartInstances = {};
  const cleanupViewState = () => {
    // Destroy charts
    Object.values(chartInstances).forEach(chart => { try { chart.destroy(); } catch {} });
    chartInstances = {};
    // Clear live session intervals
    if (state.ui.liveSession.timerInterval) clearInterval(state.ui.liveSession.timerInterval);
    if (state.ui.liveSession.simulationInterval) clearInterval(state.ui.liveSession.simulationInterval);
    state.ui.liveSession.active = false;
  };

  // Helpers
  const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString();
  const getCourse = (id) => db.courses.find(c => c.id === id);
  const getStudent = (id) => db.users.find(u => u.id === id);
  const getAssignment = (id) => db.assignments.find(a => a.id === id);

  const setPageTitle = (t) => byId('pageTitle').textContent = t;
  const setActiveNav = (view) => {
    $$('#mainNav .nav-item').forEach(item => {
      const isCourseDetail = view === 'course_detail';
      const isLiveSession = view === 'live_session';
      item.classList.toggle('active', item.dataset.nav === view || (isCourseDetail && item.dataset.nav === 'my_classes') || (isLiveSession && item.dataset.nav === 'my_classes'));
    });
  };

  // Modal
  const modal = byId('formModal');
  const modalTitle = byId('modalTitle');
  const modalForm = byId('modalForm');
  const openModal = (title, fields, onSubmit) => {
    modalTitle.textContent = title;
    modalForm.innerHTML = '';
    fields.forEach(f => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const id = uid('fld');
      wrap.innerHTML = `
        <label for="${id}">${f.label}</label>
        ${f.type === 'textarea' ?
          `<textarea id="${id}" name="${f.name}" placeholder="${f.placeholder || ''}">${f.value ?? ''}</textarea>` :
          f.type === 'select' ?
          `<select id="${id}" name="${f.name}">${(f.options||[]).map(o=>`<option value="${o.value}" ${o.value==f.value?'selected':''}>${o.label}</option>`).join('')}</select>` :
          `<input id="${id}" name="${f.name}" type="${f.type||'text'}" value="${f.value ?? ''}" placeholder="${f.placeholder||''}" ${f.min?`min="${f.min}"`:''} ${f.max?`max="${f.max}"`:''}/>`}
      `;
      modalForm.appendChild(wrap);
    });
    modal.classList.add('open');
    const handler = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(modalForm).entries());
      try {
        onSubmit(data);
        closeModal();
      } catch (err) {
        console.error(err);
        toast(err.message || 'Failed to save', 'danger');
      } finally {
        modalForm.removeEventListener('submit', handler);
      }
    };
    modalForm.addEventListener('submit', handler);
  };
  const closeModal = () => {
    modal.classList.remove('open');
    modalForm.innerHTML = '';
  };
  modal.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeModal();
  });

  /************************************************************************************************
   * NAVIGATION
   ************************************************************************************************/
  const mainViews = {
    dashboard: () => renderDashboard(),
    my_classes: () => renderMyClasses(),
    attendance: () => renderAttendance(),
    announcements: () => renderAnnouncements(),
    messages: () => renderMessages(),
    reports: () => renderReports(),
    calendar: () => renderCalendar(),
    course_detail: (id) => renderCourseDetail(id),
    student_profile: (studentId, courseId) => renderStudentProfile(studentId, courseId),
    submissions: (assignmentId) => renderSubmissions(assignmentId),
    // --- NEW: Live session view ---
    live_session: (courseId) => renderLiveSession(courseId),
  };
  const navigate = (view, ...args) => {
    cleanupViewState(); // --- MODIFIED: Use the new cleanup function ---
    if (mainViews[view]) mainViews[view](...args);
    setActiveNav(view);
  };

  /************************************************************************************************
   * RENDERERS
   ************************************************************************************************/
  const renderSidebarUser = () => {
    const el = byId('sidebarUser');
    const t = state.teacher;
    const initials = t.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
    el.innerHTML = `
      <div class="avatar">${initials}</div>
      <div>
        <div class="sidebar-user-name">${t.name}</div>
        <div class="sidebar-user-role">${t.role}</div>
        <div class="sidebar-user-role">${t.department || ''}</div>
      </div>
    `;
  };

  const renderDashboard = () => {
    setPageTitle('Dashboard');
    const myCourses = state.myCourses;
    const pendingSubmissions = db.submissions.filter(s => {
      const assignment = db.assignments.find(a => a.id === s.assignmentId);
      return myCourses.some(c => c.id === assignment.courseId) && s.grade === null && s.submittedAt !== null;
    });

    byId('contentArea').innerHTML = `
      <div class="grid-3">
        <div class="stat-card"><div class="icon"><span class="material-icons-outlined">class</span></div><div><div class="value">${myCourses.length}</div><div class="label">Assigned Classes</div></div></div>
        <div class="stat-card"><div class="icon"><span class="material-icons-outlined">groups</span></div><div><div class="value">${new Set(myCourses.flatMap(c=>c.studentIds)).size}</div><div class="label">Total Students</div></div></div>
        <div class="stat-card"><div class="icon"><span class="material-icons-outlined">pending_actions</span></div><div><div class="value">${pendingSubmissions.length}</div><div class="label">Pending Evaluations</div></div></div>
      </div>
      <div class="grid-2" style="margin-top: 1.5rem;">
        <div class="card">
          <div class="card-header"><h3>Today's Schedule</h3></div>
          <p>9:00 AM - CS201 (Data Structures)</p><p>11:00 AM - CS310 (DBMS)</p>
        </div>
        <div class="card">
          <div class="card-header"><h3>Recent Announcements</h3></div>
          ${db.announcements.slice(0, 4).map(a => `<div class="announcement-card"><div class="meta">${fmtDate(a.date)} | ${a.courseId ? getCourse(a.courseId).code : 'College'}</div><strong>${a.title}</strong></div>`).join('')}
        </div>
      </div>
    `;
  };

  const renderMyClasses = () => {
    setPageTitle('My Classes');
    const courses = state.myCourses;
    byId('contentArea').innerHTML = `
      <div class="grid-2">
        ${courses.map(c => `
          <div class="card">
            <div class="card-header">
              <h3>${c.code} — ${c.name}</h3>
              <div class="table-actions">
                <button class="btn" data-action="open" data-id="${c.id}"><span class="material-icons-outlined">open_in_new</span>Open</button>
              </div>
            </div>
             <div style="margin:.4rem 0 .6rem; font-weight:600;">Syllabus Progress</div>
            <div class="progress-bar"><div style="width:${c.syllabusProgress}%"></div></div>
            <div style="margin-top:.7rem; color:var(--muted);">${c.studentIds.length} students</div>
             <div class="card-actions-bar">
                <button class="btn" data-action="attendance" data-id="${c.id}"><span class="material-icons-outlined">rule</span>Manual</button>
                <button class="btn" data-action="announce" data-id="${c.id}"><span class="material-icons-outlined">campaign</span>Announce</button>
                 <button class="btn primary" data-action="live" data-id="${c.id}"><span class="material-icons-outlined">qr_code_2</span>Start Session</button>
             </div>
          </div>
        `).join('')}
      </div>
    `;
    // Actions
    byId('contentArea').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'open') navigate('course_detail', id);
      if (btn.dataset.action === 'attendance') {
        state.ui.attendance.courseId = id;
        navigate('attendance');
      }
      if (btn.dataset.action === 'announce') openAnnouncementModal(id);
      // --- NEW: Handle live session start ---
      if (btn.dataset.action === 'live') navigate('live_session', id);
    }, { once: true });
  };

  // --- NEW: Live Session Renderer ---
  const renderLiveSession = (courseId) => {
      const course = getCourse(courseId);
      if (!course) return toast('Course not found', 'danger');
      setPageTitle(`Live Session: ${course.code}`);
      
      // 1. Set session state
      state.ui.liveSession.active = true;
      state.ui.liveSession.courseId = courseId;
      // This unique data would be sent by the student's app after scanning
      state.ui.liveSession.qrCodeData = `SMARTAPP_ATTENDANCE::${course.id}::${uid('sess')}`;

      // 2. Generate QR code using a free public API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(state.ui.liveSession.qrCodeData)}`;

      // 3. Render layout
      byId('contentArea').innerHTML = `
          <div class="card">
              <div class="toolbar">
                  <h3>Display this QR code on the projector</h3>
                  <button class="btn" id="endSessionBtn"><span class="material-icons-outlined">stop_circle</span>End Session</button>
              </div>
              <div class="live-session-grid">
                  <div class="qr-code-display">
                      <img src="${qrApiUrl}" alt="Attendance QR Code" />
                      <div class="live-timer">Expires in: <span id="qr-timer">5:00</span></div>
                      <div id="expired-message" class="expired-message" style="display:none;">QR Code Expired</div>
                  </div>
                  <div class="live-roster">
                      <h4>Real-time Roster (${course.studentIds.length} Students)</h4>
                      <ul class="live-roster-list" id="live-roster-list">
                          ${course.studentIds.map(sid => {
                              const student = getStudent(sid);
                              return `<li class="live-roster-item absent" data-id="${sid}">
                                  <span class="status"></span> ${student.name}
                              </li>`;
                          }).join('')}
                      </ul>
                  </div>
              </div>
          </div>
      `;
      
      byId('endSessionBtn').onclick = () => navigate('my_classes');

      // 4. Start countdown timer
      let timeLeft = 299; // 5 minutes in seconds
      const timerEl = byId('qr-timer');
      state.ui.liveSession.timerInterval = setInterval(() => {
          if (timeLeft <= 0) {
              clearInterval(state.ui.liveSession.timerInterval);
              clearInterval(state.ui.liveSession.simulationInterval);
              byId('expired-message').style.display = 'block';
              $('.qr-code-display img').style.opacity = '0.1';
              timerEl.textContent = '0:00';
              return;
          }
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          timerEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
          timeLeft--;
      }, 1000);

      // 5. SIMULATE students scanning the code
      const absentStudents = [...$$('.live-roster-item.absent')];
      state.ui.liveSession.simulationInterval = setInterval(() => {
          if (absentStudents.length === 0) {
              clearInterval(state.ui.liveSession.simulationInterval);
              return;
          }
          const randomIndex = Math.floor(Math.random() * absentStudents.length);
          const studentEl = absentStudents.splice(randomIndex, 1)[0];
          if (studentEl) {
              studentEl.classList.remove('absent');
              studentEl.classList.add('present');
          }
      }, 3000); // A new student is marked present every 3 seconds
  };


  const renderCourseDetail = (courseId) => {
    const course = getCourse(courseId);
    if (!course) return toast('Course not found', 'danger');
    state.ui.courseDetail.courseId = courseId;
    setPageTitle(`${course.code} — ${course.name}`);
    const tab = state.ui.courseDetail.tab;

    byId('contentArea').innerHTML = `
      <div class="tabs">
        ${['materials','roster','assignments','grades'].map(t=>`
          <button class="${t===tab?'active':''}" data-tab="${t}">${t[0].toUpperCase()+t.slice(1)}</button>
        `).join('')}
      </div>
      <div id="courseTabWrap"></div>
    `;
    $$('.tabs button').forEach(b => b.addEventListener('click', () => {
      state.ui.courseDetail.tab = b.dataset.tab;
      renderCourseTab(b.dataset.tab, courseId);
    }));
    renderCourseTab(tab, courseId);
  };

  const renderCourseTab = (tab, courseId) => {
    const wrap = byId('courseTabWrap');
    const course = getCourse(courseId);
    if (tab === 'materials') {
      const mats = db.courseMaterials.filter(m => m.courseId === courseId);
      wrap.innerHTML = `
        <div class="toolbar">
          <div></div>
          <button class="btn primary" id="btnAddMat"><span class="material-icons-outlined">add</span>Add Material</button>
        </div>
        <table class="table">
          <thead><tr><th>Type</th><th>Title</th><th>Link</th><th>Actions</th></tr></thead>
          <tbody>
            ${mats.map(m => `
              <tr>
                <td>${m.type}</td><td>${m.title}</td>
                <td>${m.url ? `<a href="${m.url}" target="_blank">Open</a>`:''}</td>
                <td><button class="btn" data-edit="${m.id}">Edit</button> <button class="btn" data-del="${m.id}">Delete</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      `;
      byId('btnAddMat').onclick = () => openModal('Add Material', [
        { label:'Type', name:'type', type:'select', options:[{value:'notes',label:'Notes'},{value:'slides',label:'Slides'},{value:'syllabus',label:'Syllabus'}] },
        { label:'Title', name:'title' },
        { label:'URL', name:'url', type:'url', placeholder:'https://...' },
      ], (data) => {
        db.courseMaterials.push({ id: uid('m'), courseId, ...data });
        saveDb(); toast('Material added'); renderCourseTab('materials', courseId);
      });
      wrap.addEventListener('click', (e) => {
        const edit = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
        if (edit) {
          const m = db.courseMaterials.find(x=>x.id===edit.dataset.edit);
          openModal('Edit Material', [
            { label:'Type', name:'type', type:'select', value:m.type, options:[{value:'notes',label:'Notes'},{value:'slides',label:'Slides'},{value:'syllabus',label:'Syllabus'}] },
            { label:'Title', name:'title', value:m.title },
            { label:'URL', name:'url', type:'url', value:m.url||'' },
          ], (data) => { Object.assign(m, data); saveDb(); toast('Saved'); renderCourseTab('materials', courseId); });
        }
        if (del) {
          db.courseMaterials = db.courseMaterials.filter(x=>x.id!==del.dataset.del);
          saveDb(); toast('Deleted','warning'); renderCourseTab('materials', courseId);
        }
      }, { once: true });
    }

    if (tab === 'roster') {
      wrap.innerHTML = `
        <div class="toolbar">
          <div>${course.studentIds.length} students</div>
          <div class="table-actions">
            <button class="btn" id="btnMsgClass"><span class="material-icons-outlined">chat</span>Message Class</button>
          </div>
        </div>
        <table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            ${course.studentIds.map(sid => {
              const s = getStudent(sid);
              return `<tr><td>${s.name}</td><td>${s.email}</td>
                <td><button class="btn" data-profile="${sid}">Profile</button>
                <button class="btn" data-message="${sid}">Message</button></td></tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
      byId('btnMsgClass').onclick = () => { state.ui.messages.studentId = null; navigate('messages'); };
      wrap.addEventListener('click', (e) => {
        const p = e.target.closest('[data-profile]'); const m = e.target.closest('[data-message]');
        if (p) navigate('student_profile', p.dataset.profile, courseId);
        if (m) { state.ui.messages.studentId = m.dataset.message; navigate('messages'); }
      }, { once: true });
    }

    if (tab === 'assignments') {
      const as = db.assignments.filter(a => a.courseId === courseId);
      wrap.innerHTML = `
        <div class="toolbar">
          <div></div>
          <button class="btn primary" id="btnAddAssn"><span class="material-icons-outlined">add</span>New Assignment</button>
        </div>
        <table class="table">
          <thead><tr><th>Title</th><th>Due Date</th><th>Submissions</th><th>Actions</th></tr></thead>
          <tbody>
            ${as.map(a => {
              const subs = db.submissions.filter(s => s.assignmentId === a.id);
              const submitted = subs.filter(s => s.submittedAt).length;
              return `<tr><td>${a.title}</td><td>${fmtDate(a.dueDate)}</td><td>${submitted}/${course.studentIds.length}</td>
                <td>
                  <button class="btn" data-open="${a.id}">Open</button>
                  <button class="btn" data-edit="${a.id}">Edit</button>
                  <button class="btn" data-del="${a.id}">Delete</button>
                </td></tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
      byId('btnAddAssn').onclick = () => openModal('New Assignment', [
        { label:'Title', name:'title' },
        { label:'Due Date', name:'dueDate', type:'date', min: new Date().toISOString().slice(0,10) },
      ], (data) => {
        const id = uid('a');
        db.assignments.push({ id, courseId, title: data.title, dueDate: data.dueDate });
        // Pre-create submission placeholders
        getCourse(courseId).studentIds.forEach(sid => {
          db.submissions.push({ id: uid('sub'), assignmentId: id, studentId: sid, submittedAt: null, grade: null, feedback: null });
        });
        saveDb(); toast('Assignment created'); renderCourseTab('assignments', courseId);
      });
      wrap.addEventListener('click', (e) => {
        const open = e.target.closest('[data-open]'), edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
        if (open) navigate('submissions', open.dataset.open);
        if (edit) {
          const a = db.assignments.find(x=>x.id===edit.dataset.edit);
          openModal('Edit Assignment', [
            { label:'Title', name:'title', value:a.title },
            { label:'Due Date', name:'dueDate', type:'date', value:a.dueDate },
          ], (data) => { Object.assign(a, data); saveDb(); toast('Saved'); renderCourseTab('assignments', courseId); });
        }
        if (del) {
          const aid = del.dataset.del;
          db.assignments = db.assignments.filter(x=>x.id!==aid);
          db.submissions = db.submissions.filter(x=>x.assignmentId!==aid);
          saveDb(); toast('Deleted','warning'); renderCourseTab('assignments', courseId);
        }
      }, { once: true });
    }

    if (tab === 'grades') {
      const students = course.studentIds.map(getStudent);
      // Aggregate average per student for this course
      const courseAssnIds = db.assignments.filter(a=>a.courseId===courseId).map(a=>a.id);
      const rows = students.map(s => {
        const subs = db.submissions.filter(sub => sub.studentId===s.id && courseAssnIds.includes(sub.assignmentId) && sub.grade!=null);
        const avg = subs.length ? Math.round(subs.reduce((a,b)=>a+b.grade,0)/subs.length) : '-';
        return { name: s.name, email: s.email, avg };
      });
      wrap.innerHTML = `
        <div class="toolbar">
          <div></div>
          <div class="table-actions">
            <button class="btn" id="btnExportCSV"><span class="material-icons-outlined">download</span>CSV</button>
            <button class="btn" id="btnExportPDF"><span class="material-icons-outlined">picture_as_pdf</span>PDF</button>
          </div>
        </div>
        <table class="table" id="gradesTable">
          <thead><tr><th>Name</th><th>Email</th><th>Average</th></tr></thead>
          <tbody>
            ${rows.map(r=>`<tr><td>${r.name}</td><td>${r.email}</td><td>${r.avg}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
      byId('btnExportCSV').onclick = () => {
        const csv = ['Name,Email,Average'].concat(rows.map(r=>`${r.name},${r.email},${r.avg}`)).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `${course.code}_grades.csv`; a.click();
      };
      byId('btnExportPDF').onclick = async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`${course.code} — Grades`, 14, 16);
        const body = rows.map(r => [r.name, r.email, String(r.avg)]);
        doc.autoTable({ head: [['Name','Email','Average']], body });
        doc.save(`${course.code}_grades.pdf`);
      };
    }
  };

  const renderStudentProfile = (studentId, courseId) => {
    const s = getStudent(studentId); const c = getCourse(courseId);
    setPageTitle(`${s.name} — ${c.code}`);
    const assnIds = db.assignments.filter(a=>a.courseId===courseId).map(a=>a.id);
    const subs = db.submissions.filter(x=>x.studentId===studentId && assnIds.includes(x.assignmentId));
    const attend = db.attendance.filter(a=>a.courseId===courseId && a.studentId===studentId);
    const present = attend.filter(a=>a.status==='present').length;
    const total = attend.length || 1;
    const attendancePct = Math.round((present/total)*100);

    byId('contentArea').innerHTML = `
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>Student Info</h3></div>
          <p><strong>Name:</strong> ${s.name}</p>
          <p><strong>Email:</strong> ${s.email}</p>
          <p><strong>Attendance:</strong> ${attendancePct}%</p>
        </div>
        <div class="card">
          <div class="card-header"><h3>Actions</h3></div>
          <div class="table-actions">
            <button class="btn" id="btnMessage"><span class="material-icons-outlined">chat</span>Message</button>
            <button class="btn" id="btnBack"><span class="material-icons-outlined">arrow_back</span>Back to Class</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Submissions</h3></div>
        <table class="table">
          <thead><tr><th>Assignment</th><th>Submitted</th><th>Grade</th><th>Feedback</th><th>Actions</th></tr></thead>
          <tbody>
            ${subs.map(sub=>{
              const a = getAssignment(sub.assignmentId);
              return `<tr>
                <td>${a.title}</td>
                <td>${sub.submittedAt?fmtDate(sub.submittedAt):'—'}</td>
                <td>${sub.grade ?? '—'}</td>
                <td>${sub.feedback ?? '—'}</td>
                <td><button class="btn" data-grade="${sub.id}">Grade</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    byId('btnMessage').onclick = () => { state.ui.messages.studentId = studentId; navigate('messages'); };
    byId('btnBack').onclick = () => navigate('course_detail', courseId);
    byId('contentArea').addEventListener('click', (e) => {
      const g = e.target.closest('[data-grade]'); if (!g) return;
      const sub = db.submissions.find(x=>x.id===g.dataset.grade);
      openModal('Grade Submission', [
        { label:'Grade (0-100)', name:'grade', type:'number', min:0, max:100, value: sub.grade ?? '' },
        { label:'Feedback', name:'feedback', type:'textarea', value: sub.feedback ?? '' },
      ], (data) => { sub.grade = Number(data.grade); sub.feedback = data.feedback; saveDb(); toast('Saved'); renderStudentProfile(studentId, courseId); });
    }, { once: true });
  };

  const renderAttendance = () => {
    setPageTitle('Attendance');
    const courseId = state.ui.attendance.courseId || state.myCourses[0]?.id;
    if (!courseId) return byId('contentArea').innerHTML = '<div class="card"><div class="card-header"><h3>No courses assigned</h3></div></div>';
    state.ui.attendance.courseId = courseId;
    const date = state.ui.attendance.date;

    const course = getCourse(courseId);
    byId('contentArea').innerHTML = `
      <div class="card">
        <div class="toolbar">
          <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr;">
            <div class="field"><label>Course</label>
              <select id="attCourse">${state.myCourses.map(c=>`<option value="${c.id}" ${c.id===courseId?'selected':''}>${c.code} — ${c.name}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Date</label><input type="date" id="attDate" value="${date}"/></div>
            <div class="field"><label>&nbsp;</label><button class="btn primary" id="btnSaveAtt"><span class="material-icons-outlined">save</span>Save</button></div>
          </div>
        </div>
        <table class="table">
          <thead><tr><th>Student</th><th>Status</th></tr></thead>
          <tbody>
            ${course.studentIds.map(sid => {
              const rec = db.attendance.find(a=>a.courseId===courseId && a.date===date && a.studentId===sid);
              const status = rec?.status || 'present';
              return `<tr><td>${getStudent(sid).name}</td>
                <td>
                  <select data-sid="${sid}" class="attSel">
                    <option value="present" ${status==='present'?'selected':''}>Present</option>
                    <option value="absent" ${status==='absent'?'selected':''}>Absent</option>
                    <option value="late" ${status==='late'?'selected':''}>Late</option>
                  </select>
                </td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    byId('attCourse').onchange = (e) => { state.ui.attendance.courseId = e.target.value; renderAttendance(); };
    byId('attDate').onchange = (e) => { state.ui.attendance.date = e.target.value; renderAttendance(); };
    byId('btnSaveAtt').onclick = () => {
      const sels = $$('.attSel');
      sels.forEach(sel => {
        const sid = sel.dataset.sid;
        let rec = db.attendance.find(a=>a.courseId===courseId && a.date===date && a.studentId===sid);
        if (!rec) {
          rec = { id: uid('att'), courseId, date, studentId: sid, status: sel.value };
          db.attendance.push(rec);
        } else {
          rec.status = sel.value;
        }
      });
      saveDb(); toast('Attendance saved');
    };
  };

  const renderSubmissions = (assignmentId) => {
    const a = getAssignment(assignmentId);
    const course = getCourse(a.courseId);
    setPageTitle(`Submissions — ${course.code}`);
    const subs = db.submissions.filter(s=>s.assignmentId===assignmentId);
    byId('contentArea').innerHTML = `
      <div class="card">
        <div class="card-header"><h3>${a.title} (Due: ${fmtDate(a.dueDate)})</h3>
          <div class="table-actions">
            <button class="btn" id="btnBackToCourse"><span class="material-icons-outlined">arrow_back</span>Back</button>
          </div>
        </div>
        <table class="table">
          <thead><tr><th>Student</th><th>Submitted</th><th>Grade</th><th>Feedback</th><th>Actions</th></tr></thead>
          <tbody>
            ${subs.map(sub=>{
              const s = getStudent(sub.studentId);
              return `<tr>
                <td>${s.name}</td><td>${sub.submittedAt?fmtDate(sub.submittedAt):'—'}</td>
                <td>${sub.grade ?? '—'}</td><td>${sub.feedback ?? '—'}</td>
                <td>
                  <button class="btn" data-grade="${sub.id}">Grade</button>
                  <button class="btn" data-toggle-submit="${sub.id}">${sub.submittedAt?'Mark Unsubmitted':'Mark Submitted'}</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    byId('btnBackToCourse').onclick = () => navigate('course_detail', a.courseId);
    byId('contentArea').addEventListener('click', (e) => {
      const g = e.target.closest('[data-grade]'); const t = e.target.closest('[data-toggle-submit]');
      if (g) {
        const sub = db.submissions.find(x=>x.id===g.dataset.grade);
        openModal('Grade Submission', [
          { label:'Grade (0-100)', name:'grade', type:'number', min:0, max:100, value: sub.grade ?? '' },
          { label:'Feedback', name:'feedback', type:'textarea', value: sub.feedback ?? '' },
        ], (data) => { sub.grade = Number(data.grade); sub.feedback = data.feedback; saveDb(); toast('Saved'); renderSubmissions(assignmentId); });
      }
      if (t) {
        const sub = db.submissions.find(x=>x.id===t.dataset.toggleSubmit);
        sub.submittedAt = sub.submittedAt ? null : new Date().toISOString().slice(0,10);
        saveDb(); toast('Updated'); renderSubmissions(assignmentId);
      }
    }, { once: true });
  };

  const openAnnouncementModal = (courseId=null) => {
    openModal('New Announcement', [
      { label:'Audience', name:'courseId', type:'select', value: courseId??'', options:[{value:'',label:'College-wide'}].concat(state.myCourses.map(c=>({value:c.id,label:`${c.code} — ${c.name}`}))) },
      { label:'Title', name:'title' },
      { label:'Content', name:'content', type:'textarea' },
      { label:'Date', name:'date', type:'date', value: new Date().toISOString().slice(0,10) },
    ], (data) => {
      db.announcements.unshift({ id: uid('an'), courseId: data.courseId || null, title: data.title, content: data.content, date: data.date });
      saveDb(); toast('Announcement posted'); navigate('announcements');
    });
  };

  const renderAnnouncements = () => {
    setPageTitle('Announcements');
    const filter = byId('contentArea');
    const options = [{value:'',label:'All'}].concat(state.myCourses.map(c=>({value:c.id,label:c.code})));
    filter.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <div class="field" style="margin:0;">
            <label>Filter</label>
            <select id="annFilter">${options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}</select>
          </div>
          <div><button class="btn primary" id="btnNewAnn"><span class="material-icons-outlined">add</span>New</button></div>
        </div>
        <div id="annList"></div>
      </div>
    `;
    const apply = () => {
      const v = byId('annFilter').value;
      const list = byId('annList');
      const items = db.announcements.filter(a=>!v || a.courseId===v);
      list.innerHTML = items.length ? items.map(a => `
        <div class="announcement-card">
          <div class="meta">${fmtDate(a.date)} | ${a.courseId? getCourse(a.courseId).code : 'College'}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
            <div>
              <strong>${a.title}</strong><div>${a.content}</div>
            </div>
            <div class="table-actions">
              <button class="btn" data-edit="${a.id}">Edit</button>
              <button class="btn" data-del="${a.id}">Delete</button>
            </div>
          </div>
        </div>
      `).join('') : '<div style="color:var(--muted);">No announcements</div>';
    };
    byId('annFilter').onchange = apply;
    byId('btnNewAnn').onclick = () => openAnnouncementModal();
    byId('annList').addEventListener('click', (e) => {
      const edit = e.target.closest('[data-edit]'); const del = e.target.closest('[data-del]');
      if (edit) {
        const a = db.announcements.find(x=>x.id===edit.dataset.edit);
        openModal('Edit Announcement', [
          { label:'Audience', name:'courseId', type:'select', value:a.courseId??'', options:[{value:'',label:'College-wide'}].concat(state.myCourses.map(c=>({value:c.id,label:`${c.code} — ${c.name}`}))) },
          { label:'Title', name:'title', value:a.title },
          { label:'Content', name:'content', type:'textarea', value:a.content },
          { label:'Date', name:'date', type:'date', value:a.date },
        ], (data) => { Object.assign(a, { courseId: data.courseId || null, title:data.title, content:data.content, date:data.date }); saveDb(); toast('Saved'); apply(); });
      }
      if (del) {
        db.announcements = db.announcements.filter(x=>x.id!==del.dataset.del);
        saveDb(); toast('Deleted','warning'); apply();
      }
    });
    apply();
  };

  const renderMessages = () => {
    setPageTitle('Messages');
    const myStudents = [...new Set(state.myCourses.flatMap(c=>c.studentIds))].map(getStudent);
    const activeId = state.ui.messages.studentId || myStudents[0]?.id || null;
    state.ui.messages.studentId = activeId;

    byId('contentArea').innerHTML = `
      <div class="card">
        <div class="message-layout">
          <div class="student-list" id="msgStudentList">
            ${myStudents.map(s=>`<div class="student-list-item ${s.id===activeId?'active':''}" data-id="${s.id}">${s.name}</div>`).join('')}
          </div>
          <div class="chat-window">
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input">
              <input type="text" id="chatInput" placeholder="Type your message..." />
              <button class="btn primary" id="chatSend"><span class="material-icons-outlined">send</span>Send</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const loadThread = (sid) => {
      const thread = db.messages.find(m=>m.studentId===sid && m.teacherId===LOGGED_IN_TEACHER_ID) || { history: [] };
      const box = byId('chatMessages');
      box.innerHTML = thread.history.map(m=>`<div class="chat-bubble ${m.from===LOGGED_IN_TEACHER_ID?'sent':'received'}">${m.text}</div>`).join('');
      box.scrollTop = box.scrollHeight;
    };
    const ensureThread = (sid) => {
      let thr = db.messages.find(m=>m.studentId===sid && m.teacherId===LOGGED_IN_TEACHER_ID);
      if (!thr) { thr = { id: uid('msg'), studentId: sid, teacherId: LOGGED_IN_TEACHER_ID, history: [] }; db.messages.push(thr); }
      return thr;
    };

    byId('msgStudentList').addEventListener('click', (e) => {
      const item = e.target.closest('.student-list-item'); if (!item) return;
      $$('#msgStudentList .student-list-item').forEach(el=>el.classList.remove('active'));
      item.classList.add('active');
      state.ui.messages.studentId = item.dataset.id;
      loadThread(item.dataset.id);
    });
    byId('chatSend').onclick = () => {
      const input = byId('chatInput'); const text = input.value.trim(); if (!text) return;
      const thr = ensureThread(state.ui.messages.studentId);
      thr.history.push({ from: LOGGED_IN_TEACHER_ID, text });
      saveDb(); input.value=''; loadThread(state.ui.messages.studentId);
    };
    loadThread(activeId);
  };

  const renderReports = () => {
    setPageTitle('Reports');
    const courses = state.myCourses;
    byId('contentArea').innerHTML = `
      <div class="grid-2">
        <div class="card"><div class="card-header"><h3>Average Grades by Course</h3></div><canvas id="chartGrades"></canvas></div>
        <div class="card"><div class="card-header"><h3>Attendance Rate by Course</h3></div><canvas id="chartAttendance"></canvas></div>
      </div>
    `;
    const labels = courses.map(c=>c.code);
    const avgGrades = courses.map(c => {
      const assnIds = db.assignments.filter(a=>a.courseId===c.id).map(a=>a.id);
      const grades = db.submissions.filter(s=>assnIds.includes(s.assignmentId) && s.grade!=null).map(s=>s.grade);
      return grades.length ? Math.round(grades.reduce((a,b)=>a+b,0)/grades.length) : 0;
    });
    const attRates = courses.map(c => {
      const recs = db.attendance.filter(a=>a.courseId===c.id);
      const present = recs.filter(r=>r.status==='present').length;
      return recs.length ? Math.round((present/recs.length)*100) : 0;
    });

    chartInstances.chartGrades = new Chart(byId('chartGrades').getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Average Grade', data: avgGrades }]},
      options: { responsive: true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } }
    });
    chartInstances.chartAttendance = new Chart(byId('chartAttendance').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: 'Attendance %', data: attRates }]},
      options: { responsive: true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 } } }
    });
  };

  const renderCalendar = () => {
    setPageTitle('Calendar');
    const d = new Date(state.calendarDate);
    d.setDate(1);
    const month = d.getMonth(), year = d.getFullYear();
    const startDay = d.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    const events = [];
    db.assignments.forEach(a => events.push({ date: a.dueDate, type:'assignment', title: a.title }));
    db.announcements.forEach(a => events.push({ date: a.date, type:'announcement', title: a.title }));

    const grid = [];
    for (let i=0;i<startDay;i++) grid.push('');
    for (let day=1; day<=daysInMonth; day++) grid.push(day);

    byId('contentArea').innerHTML = `
      <div class="card">
        <div class="toolbar">
          <div class="table-actions">
            <button class="btn" id="prevMonth"><span class="material-icons-outlined">chevron_left</span>Prev</button>
            <div style="font-weight:700">${d.toLocaleString(undefined,{ month:'long', year:'numeric' })}</div>
            <button class="btn" id="nextMonth">Next<span class="material-icons-outlined">chevron_right</span></button>
          </div>
          <div class="table-actions">
            <button class="btn" id="btnNewAssn"><span class="material-icons-outlined">add</span>New Assignment</button>
            <button class="btn" id="btnNewAnn"><span class="material-icons-outlined">add</span>New Announcement</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:.5rem;">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(h=>`<div style="text-align:center;color:var(--muted);font-weight:700;">${h}</div>`).join('')}
          ${grid.map(cell => {
            const dateStr = cell ? `${year}-${String(month+1).padStart(2,'0')}-${String(cell).padStart(2,'0')}` : '';
            const dayEvents = cell ? events.filter(ev=>ev.date===dateStr) : [];
            return `<div style="min-height:90px;border:1px solid var(--border);border-radius:8px;padding:.4rem;background:var(--surface);">
              <div style="font-weight:700; opacity:.7">${cell||''}</div>
              ${dayEvents.map(ev=>`<div class="status-badge ${ev.type==='assignment'?'pending':'graded'}" style="display:inline-block;margin-top:.25rem;">${ev.type==='assignment'?'Due':''} ${ev.title}</div>`).join('')}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
    byId('prevMonth').onclick = () => { const nd=new Date(state.calendarDate); nd.setMonth(nd.getMonth()-1); state.calendarDate=nd; renderCalendar(); };
    byId('nextMonth').onclick = () => { const nd=new Date(state.calendarDate); nd.setMonth(nd.getMonth()+1); state.calendarDate=nd; renderCalendar(); };
    byId('btnNewAssn').onclick = () => navigate('my_classes');
    byId('btnNewAnn').onclick = () => openAnnouncementModal();
  };

  const renderProfile = () => {
    const t = state.teacher;
    openModal('Edit Profile', [
      { label:'Name', name:'name', value:t.name },
      { label:'Email', name:'email', type:'email', value:t.email },
      { label:'Department', name:'department', value:t.department || '' },
      { label:'Office Hours', name:'officeHours', value:t.officeHours || '' },
    ], (data) => {
      Object.assign(t, data); saveDb(); renderSidebarUser(); toast('Profile updated');
    });
  };

  /************************************************************************************************
   * GLOBAL EVENT LISTENERS & INIT
   ************************************************************************************************/
  // Topbar
  byId('themeToggle').addEventListener('click', () => {
    state.theme = (state.theme === 'light' ? 'dark' : 'light');
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem('theme', state.theme);
    byId('themeToggle').innerHTML = `<span class="material-icons-outlined">${state.theme==='dark'?'dark_mode':'light_mode'}</span>`;
  });
  byId('sidebarToggle').addEventListener('click', () => {
    const s = $('.sidebar');
    s.classList.toggle('open');
  });
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="edit-profile"]');
    if (btn) renderProfile();
  });

  // Sidebar nav
  byId('mainNav').addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item'); if (!item) return;
    const view = item.dataset.nav;
    navigate(view);
  });

  // Modal close buttons
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close="true"]')) closeModal();
  });

  // Initialize UI
  const init = () => {
    renderSidebarUser();
    navigate('dashboard');
    // Correct theme icon
    byId('themeToggle').innerHTML = `<span class="material-icons-outlined">${state.theme==='dark'?'dark_mode':'light_mode'}</span>`;
  };
  init();
})();