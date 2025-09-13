document.addEventListener('DOMContentLoaded', () => {
  // Elements for role selection modal
  const roleModal = document.getElementById('roleModal');
  const roleSelect = document.getElementById('roleSelect');
  const roleConfirmBtn = document.getElementById('roleConfirmBtn');

  let selectedRole = null;

  // Initially hide signup form until role selected
  const signupForm = document.getElementById('signupForm');
  signupForm.style.display = 'none';

  // Enable confirm button when a role is selected
  roleSelect.addEventListener('change', () => {
    selectedRole = roleSelect.value;
    roleConfirmBtn.disabled = !selectedRole;
  });

  // Confirm selected role and show signup form
  roleConfirmBtn.addEventListener('click', () => {
    if (!selectedRole) return;
    roleModal.style.display = 'none';
    signupForm.style.display = 'block';
  });

  // Signup form submit handler (localStorage only, backend disabled)
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = document.getElementById('submitBtn');
    const name = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    const signupData = { name, email, password, role: selectedRole };

    try {
      // Try backend signup first
      const API_BASE_URL = 'http://localhost:4000/api';
      let ok = false;
      try {
        const resp = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupData)
        });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j.message || 'Signup failed.');
        }
        ok = true;
      } catch (apiErr) {
        // Fallback to localStorage user creation
        const usersRaw = localStorage.getItem('users');
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        if (users.some(u => u.email === email)) throw apiErr;
        const newUser = { id: Date.now().toString(), ...signupData };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        ok = true;
      }

      if (ok) {
        alert('Sign-up successful! Please log in to continue.');
        window.location.href = './index.html';
      }
    } catch (error) {
      alert(`Signup Failed: ${error.message}`);
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
    }
  });
});
