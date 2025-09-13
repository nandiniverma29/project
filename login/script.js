document.addEventListener('DOMContentLoaded', () => {

  feather.replace();
  
  // Ensure login form is always shown when page loads
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  loginForm.classList.add('active');
  signupForm.classList.remove('active');
  const messageContainer = document.getElementById('message-container');
  const roleButtons = loginForm.querySelectorAll('.role-btn');

  let selectedRole = 'student'; // default

  // Handle role button selection for login
  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      roleButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      selectedRole = button.dataset.role;
    });
  });

  const API_BASE_URL = 'http://localhost:4000/api';

  // Seed demo users if none exist
  (function seedUsers(){
    try {
      const existing = localStorage.getItem('users');
      if (!existing) {
        const demoUsers = [
          { id: 'u-student', name: 'Demo Student', email: 'student@example.com', password: '123456', role: 'student' },
          { id: 'u-teacher', name: 'Demo Teacher', email: 'teacher@example.com', password: '123456', role: 'teacher' },
          { id: 'u-admin', name: 'Demo Admin', email: 'admin@example.com', password: '123456', role: 'admin' }
        ];
        localStorage.setItem('users', JSON.stringify(demoUsers));
      }
    } catch {}
  })();

  // Login form submission: try backend first, fallback to localStorage
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    messageContainer.style.display = 'none';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      // Attempt backend login
      let data = null;
      try {
        const resp = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.message || 'Login failed.');
        data = json;
      } catch (apiErr) {
        // Fallback to localStorage auth
        const usersRaw = localStorage.getItem('users');
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
          // Check if user exists in localStorage but with wrong password
          const userExists = users.find(u => u.email === email);
          if (userExists) {
            throw new Error('Invalid password. Please try again.');
          } else {
            throw new Error('User not found. Please sign up first.');
          }
        }
        data = { id: user.id || Date.now().toString(), name: user.name, email: user.email, role: user.role, token: 'local-' + (user.id || Date.now().toString()) };
      }

      if (selectedRole !== data.role) throw new Error('Invalid role selected for this user.');

      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);

      messageContainer.textContent = 'Login successful! Redirecting...';
      messageContainer.className = 'message-container success';
      messageContainer.style.display = 'block';

      setTimeout(() => {
        switch (selectedRole) {
          case 'student':
            window.location.href = '../student/student_dash.html';
            break;
          case 'teacher':
            window.location.href = '../teacher/teacher_dash.html';
            break;
          case 'admin':
            window.location.href = '../admin/admin_dash.html';
            break;
          default:
            window.location.href = '../student/student_dash.html';
        }
      }, 1000);

    } catch (err) {
      messageContainer.textContent = err.message;
      messageContainer.className = 'message-container error';
      messageContainer.style.display = 'block';
    }
  });

  // Signup form submission can remain as-is or be updated as needed
});
