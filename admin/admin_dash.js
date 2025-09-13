(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- State ---------- */
  const state = {
    users: JSON.parse(localStorage.getItem('adminUsers_v3')) || [
      { id:'s101', name:'Arjun Verma', role:'student', email:'arjun@example.com', createdAt:'2025-03-15' },
      { id:'s102', name:'Priya Singh', role:'student', email:'priya@example.com', createdAt:'2025-04-20' },
      { id:'s103', name:'Rohan Mehta', role:'student', email:'rohan@example.com', createdAt:'2025-04-22' },
      { id:'t01', name:'Prof. Anjali Sharma', role:'teacher', email:'anjali@example.edu', createdAt:'2025-02-01', department:'CSE' },
      { id:'t02', name:'Dr. Vikram Rathod', role:'teacher', email:'vikram@example.edu', createdAt:'2025-01-25', department:'ME' }
    ],
    courses: JSON.parse(localStorage.getItem('adminCourses_v3')) || [
      { id:'c1', name:'Data Structures & Algo', code:'CS201', department:'CSE', credits:4 },
      { id:'c2', name:'Thermodynamics', code:'ME305', department:'ME', credits:3 },
      { id:'c3', name:'Database Management', code:'CS310', department:'CSE', credits:3 },
      { id:'c4', name:'Digital Electronics', code:'EE202', department:'EE', credits:4 },
    ],
    settings: JSON.parse(localStorage.getItem('adminSettings_v1')) || {
      academicYear: '2025-2026',
      enrollmentOpen: true,
    },
    theme: localStorage.getItem('theme') || 'light',
    chartInstances: {},
    ui: { userFilter:'all', userSearchQuery:'', modalContext: null },
    attendanceData: {},
    editingId: null,
  };
  document.documentElement.dataset.theme = state.theme;

  /* ---------- Persistence ---------- */
  const persist = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  /* ---------- Utilities ---------- */
  const toast = (msg) => {
    const stack = $('#toastStack');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    stack.appendChild(el);
    setTimeout(()=>el.remove(),3000);
  };
  const getVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const getTextColor = () => getVar('--text');
  const getPrimary = () => getVar('--primary');
  const getGrid = () => document.documentElement.dataset.theme==='dark'?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)';
  const destroyCharts = () => { for(const k in state.chartInstances){state.chartInstances[k]?.destroy();} state.chartInstances={}; };

  /* ---------- Dashboard ---------- */
  function renderDashboard(){
    destroyCharts();
    $('#pageTitle').textContent='Dashboard';
    $('#contentArea').innerHTML=`
      <div class="widgets">
        <div class="widget"><span class="material-icons-outlined" style="font-size:34px;color:var(--primary);">school</span><h3>Total Students</h3><p>${state.users.filter(u=>u.role==='student').length}</p></div>
        <div class="widget"><span class="material-icons-outlined" style="font-size:34px;color:var(--primary);">person</span><h3>Total Teachers</h3><p>${state.users.filter(u=>u.role==='teacher').length}</p></div>
        <div class="widget"><span class="material-icons-outlined" style="font-size:34px;color:var(--primary);">menu_book</span><h3>Active Courses</h3><p>${state.courses.length}</p></div>
      </div>
      <div class="card"><div class="card-header"><h3>Registrations Overview</h3></div><canvas id="trendChart" height="150"></canvas></div>
    `;
    const reg={}; state.users.forEach(u=>{ const k=u.createdAt.slice(0,7); reg[k]=(reg[k]||0)+1; });
    const months=Object.keys(reg).sort(); const labels=months.map(m=>m+'-01'); const data=months.map(m=>reg[m]);
    const ctx=$('#trendChart').getContext('2d'); const gradient=ctx.createLinearGradient(0,0,0,200);
    gradient.addColorStop(0,getPrimary()+'33'); gradient.addColorStop(1,'transparent');
    state.chartInstances.trend=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'Registrations',data,fill:true,backgroundColor:gradient,borderColor:getPrimary(),tension:.4,pointBackgroundColor:getPrimary(),borderWidth:2}]},options:{plugins:{legend:{labels:{color:getTextColor()}}},scales:{x:{ticks:{color:getTextColor()},grid:{color:getGrid()}},y:{ticks:{color:getTextColor()},grid:{color:getGrid()},beginAtZero:true}}}});
  }

  /* ---------- Users ---------- */
  function renderUsers(){
    destroyCharts();
    $('#pageTitle').textContent='User Management';
    $('#contentArea').innerHTML=`
      <div class="card">
        <div class="toolbar">
          <div class="filter-tabs" id="userRoleFilter">
            <button data-filter="all" class="${state.ui.userFilter==='all'?'active':''}">All (${state.users.length})</button>
            <button data-filter="student" class="${state.ui.userFilter==='student'?'active':''}">Students (${state.users.filter(u=>u.role==='student').length})</button>
            <button data-filter="teacher" class="${state.ui.userFilter==='teacher'?'active':''}">Teachers (${state.users.filter(u=>u.role==='teacher').length})</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div class="search-bar"><span class="material-icons-outlined">search</span><input id="userSearchInput" placeholder="Search..." value="${state.ui.userSearchQuery}"></div>
            <button class="btn primary" data-action="add-user"><span class="material-icons-outlined">add</span> Add User</button>
          </div>
        </div>
        <table class="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Registered</th><th>Actions</th></tr></thead><tbody id="userTableBody"></tbody></table>
      </div>
    `;
    const q=state.ui.userSearchQuery.toLowerCase();
    const filtered=state.users.filter(u=>(u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q))&&(state.ui.userFilter==='all'||u.role===state.ui.userFilter));
    $('#userTableBody').innerHTML=filtered.map(u=>`
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td><span class="role-badge ${u.role}">${u.role}</span></td>
        <td>${u.createdAt}</td>
        <td class="table-actions">
          ${u.role==='student'?`<button class="btn" data-action="view-attendance" data-id="${u.id}"><span class="material-icons-outlined">bar_chart</span></button>`:''}
          <button class="btn" data-action="edit-user" data-id="${u.id}"><span class="material-icons-outlined">edit</span></button>
          <button class="btn danger" data-action="delete-user" data-id="${u.id}"><span class="material-icons-outlined">delete</span></button>
        </td>
      </tr>
    `).join('')||`<tr><td colspan="5" style="text-align:center;padding:1rem;">No users found</td></tr>`;
  }

  function showUserForm(userId = null) {
    state.editingId = userId;
    state.ui.modalContext = 'user';
    const user = userId ? state.users.find(u => u.id === userId) : {};
    const title = userId ? 'Edit User' : 'Add New User';
    $('#modalTitle').textContent = title;
    $('#modalForm').innerHTML = `
      <div class="form-grid">
        <div class="field"><label for="userName">Full Name</label><input type="text" id="userName" name="name" required value="${user.name || ''}"></div>
        <div class="field"><label for="userEmail">Email</label><input type="email" id="userEmail" name="email" required value="${user.email || ''}"></div>
        <div class="field"><label for="userRole">Role</label>
          <select id="userRole" name="role" onchange="document.getElementById('deptField').style.display = this.value === 'teacher' ? 'grid' : 'none'">
            <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
            <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
          </select>
        </div>
        <div class="field" id="deptField" style="display: ${user.role === 'teacher' ? 'grid' : 'none'}"><label for="userDept">Department</label><input type="text" id="userDept" name="department" value="${user.department || ''}"></div>
      </div>
    `;
    $('#formModal').classList.add('open');
  }

  /* ---------- Courses ---------- */
  function renderCourses() {
    destroyCharts();
    $('#pageTitle').textContent = 'Course Management';
    $('#contentArea').innerHTML = `
      <div class="card"><div class="toolbar"><h2>All Courses (${state.courses.length})</h2><button class="btn primary" data-action="add-course"><span class="material-icons-outlined">add</span> Add Course</button></div><table class="table"><thead><tr><th>Course Name</th><th>Code</th><th>Department</th><th>Credits</th><th>Actions</th></tr></thead><tbody id="courseTableBody"></tbody></table></div>
    `;
    $('#courseTableBody').innerHTML = state.courses.map(c => `<tr><td><strong>${c.name}</strong></td><td>${c.code}</td><td>${c.department}</td><td>${c.credits}</td><td class="table-actions"><button class="btn" data-action="edit-course" data-id="${c.id}"><span class="material-icons-outlined">edit</span></button><button class="btn danger" data-action="delete-course" data-id="${c.id}"><span class="material-icons-outlined">delete</span></button></td></tr>`).join('') || `<tr><td colspan="5" style="text-align:center;padding:1rem;">No courses found</td></tr>`;
  }

  function showCourseForm(courseId = null) {
    state.editingId = courseId;
    state.ui.modalContext = 'course';
    const course = courseId ? state.courses.find(c => c.id === courseId) : {};
    $('#modalTitle').textContent = courseId ? 'Edit Course' : 'Add New Course';
    $('#modalForm').innerHTML = `<div class="form-grid"><div class="field"><label for="courseName">Course Name</label><input type="text" id="courseName" name="name" required value="${course.name || ''}"></div><div class="field"><label for="courseCode">Course Code</label><input type="text" id="courseCode" name="code" required value="${course.code || ''}"></div><div class="field"><label for="courseDept">Department</label><input type="text" id="courseDept" name="department" required value="${course.department || ''}"></div><div class="field"><label for="courseCredits">Credits</label><input type="number" id="courseCredits" name="credits" required value="${course.credits || ''}"></div></div>`;
    $('#formModal').classList.add('open');
  }

  /* ---------- Analytics (UPDATED) ---------- */
  function renderAnalytics() {
    destroyCharts();
    $('#pageTitle').textContent = 'System Analytics';
    $('#contentArea').innerHTML = `
      <div class="widgets">
        <div class="card">
          <div class="card-header"><h3>Role Distribution</h3></div>
          <div style="position: relative; height: 300px;">
             <canvas id="roleChart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Courses per Department</h3></div>
           <div style="position: relative; height: 300px;">
             <canvas id="deptChart"></canvas>
           </div>
        </div>
      </div>
    `;

    // Role Distribution Chart
    const roles = { student: 0, teacher: 0 };
    state.users.forEach(u => roles[u.role]++);
    const roleCtx = $('#roleChart').getContext('2d');
    state.chartInstances.roles = new Chart(roleCtx, {
      type: 'doughnut',
      data: {
        labels: ['Students', 'Teachers'],
        datasets: [{ data: [roles.student, roles.teacher], backgroundColor: [getPrimary(), getVar('--accent')] }]
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: getTextColor() } } } 
      }
    });

    // Department Chart
    const depts = {};
    state.courses.forEach(c => { depts[c.department] = (depts[c.department] || 0) + 1; });
    const deptLabels = Object.keys(depts);
    const deptData = Object.values(depts);
    const deptCtx = $('#deptChart').getContext('2d');
    state.chartInstances.depts = new Chart(deptCtx, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [{ label: '# of Courses', data: deptData, backgroundColor: getPrimary() + '80' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins:{legend:{display:false}},
        scales:{x:{ticks:{color:getTextColor()},grid:{color:getGrid()}},y:{ticks:{color:getTextColor()},grid:{color:getGrid()},beginAtZero:true}}
      }
    });
  }

  /* ---------- Settings ---------- */
  function renderSettings() {
    destroyCharts();
    $('#pageTitle').textContent = 'System Settings';
    $('#contentArea').innerHTML = `
      <div class="card" style="max-width: 600px; margin: auto;">
        <div class="card-header"><h3>General Settings</h3></div>
        <form id="settingsForm">
          <div class="field" style="margin-bottom: 1rem;"><label for="academicYear">Academic Year</label><input type="text" id="academicYear" name="academicYear" value="${state.settings.academicYear}"></div>
          <div class="field" style="margin-bottom: 1rem;"><label for="enrollmentStatus">Enrollment Status</label><select id="enrollmentStatus" name="enrollmentOpen"><option value="true" ${state.settings.enrollmentOpen ? 'selected' : ''}>Open</option><option value="false" ${!state.settings.enrollmentOpen ? 'selected' : ''}>Closed</option></select></div>
          <button type="submit" class="btn primary">Save Settings</button>
        </form>
      </div>
    `;
  }

  /* ---------- Attendance Modal ---------- */
  let attendanceChart=null;
  function showAttendanceReport(userId){
    const user=state.users.find(u=>u.id===userId);
    const months=['Apr','May','Jun','Jul','Aug','Sep'];
    const data=months.map(()=>Math.floor(Math.random()*20)+80);
    state.attendanceData={user,months,data};
    $('#attendanceTitle').textContent=`Attendance: ${user.name}`;
    $('#attendanceModal').classList.add('open');
    const ctx=$('#attendanceChart').getContext('2d');
    if(attendanceChart) attendanceChart.destroy();
    attendanceChart=new Chart(ctx,{type:'bar',data:{labels:months,datasets:[{label:'Attendance %',data,backgroundColor:getPrimary()}]},options:{plugins:{legend:{labels:{color:getTextColor()}}},scales:{x:{ticks:{color:getTextColor()},grid:{color:getGrid()}},y:{ticks:{color:getTextColor()},grid:{color:getGrid()},beginAtZero:true,max:100}}}});
  }
  $('#downloadAttendancePDF').addEventListener('click',()=>{
    const {user,months,data}=state.attendanceData;
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF();
    doc.setFontSize(16); doc.text('Attendance Report',14,20); doc.setFontSize(12);
    doc.text(`Name: ${user.name}`,14,30); doc.text(`ID: ${user.id}`,14,38); doc.text(`Generated: ${new Date().toLocaleString()}`,14,46);
    doc.autoTable({startY:54,head:[['Month','Attendance %']],body:months.map((m,i)=>[m,data[i]+'%'])});
    doc.save(`${user.name.replace(/\s+/g,'_')}_Attendance.pdf`);
  });

  /* ---------- Event Handlers ---------- */
  function handleFormSubmits(e) {
    if (e.target.id === 'settingsForm') {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.settings.academicYear = fd.get('academicYear');
      state.settings.enrollmentOpen = fd.get('enrollmentOpen') === 'true';
      persist('adminSettings_v1', state.settings);
      toast('Settings saved successfully');
      return;
    }

    if (e.target.id === 'modalForm') {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      const closeModal = () => $('#formModal').classList.remove('open');

      if (state.ui.modalContext === 'course') {
        if (state.editingId) {
          const index = state.courses.findIndex(c => c.id === state.editingId);
          state.courses[index] = { ...state.courses[index], ...data };
          toast('Course updated');
        } else {
          state.courses.push({ id: `c${Date.now()}`, ...data });
          toast('Course added');
        }
        persist('adminCourses_v3', state.courses);
        renderCourses();
        closeModal();
      } else if (state.ui.modalContext === 'user') {
        if (state.editingId) {
          const index = state.users.findIndex(u => u.id === state.editingId);
          state.users[index] = { ...state.users[index], ...data };
          toast('User updated');
        } else {
          const prefix = data.role === 'teacher' ? 't' : 's';
          const today = new Date().toISOString().slice(0, 10);
          state.users.push({ id: `${prefix}${Date.now()}`, ...data, createdAt: today });
          toast('User added');
        }
        persist('adminUsers_v3', state.users);
        renderUsers();
        closeModal();
      }
    }
  }

  function handleClicks(e) {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      const { action, id } = actionEl.dataset;
      const actions = {
        'view-attendance': () => showAttendanceReport(id),
        'add-user': () => showUserForm(),
        'edit-user': () => showUserForm(id),
        'delete-user': () => { if(confirm('Are you sure?')){ state.users = state.users.filter(u => u.id !== id); persist('adminUsers_v3', state.users); renderUsers(); toast('User deleted'); }},
        'add-course': () => showCourseForm(),
        'edit-course': () => showCourseForm(id),
        'delete-course': () => { if(confirm('Are you sure?')){ state.courses = state.courses.filter(c => c.id !== id); persist('adminCourses_v3', state.courses); renderCourses(); toast('Course deleted'); }}
      };
      if (actions[action]) actions[action]();
      return;
    }

    const filter = e.target.closest('#userRoleFilter button');
    if (filter) { state.ui.userFilter = filter.dataset.filter; renderUsers(); return; }

    if (e.target.closest('[data-close="true"]')) {
      $('.modal.open')?.classList.remove('open');
      state.editingId = null; state.ui.modalContext = null;
      return;
    }
    
    const nav = e.target.closest('.nav-item');
    if (nav) {
      $$('.nav-item').forEach(n => n.classList.remove('active'));
      nav.classList.add('active');
      const renderers = {'dashboard': renderDashboard, 'users': renderUsers, 'courses': renderCourses, 'analytics': renderAnalytics, 'settings': renderSettings};
      if (renderers[nav.dataset.nav]) renderers[nav.dataset.nav]();
    }
  }

  /* ---------- Event Listeners ---------- */
  document.addEventListener('click', handleClicks);
  document.addEventListener('submit', handleFormSubmits);
  document.addEventListener('input', (e) => { if(e.target.id === 'userSearchInput') { state.ui.userSearchQuery = e.target.value; renderUsers(); }});

  $('#themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem('theme', state.theme);
    const activeNav = $('.nav-item.active')?.dataset.nav;
    if (activeNav) {
      document.querySelector(`[data-nav="${activeNav}"]`).click();
    }
  });
  
  $('#sidebarToggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

  /* ---------- Init ---------- */
  renderDashboard();
})();