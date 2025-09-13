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
      const API_BASE_URL = 'http://localhost:5000/api';
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
        if (users.some(u => u.email === email)) {
          throw new Error('Email already registered. Please use a different email or try logging in.');
        }
        const newUser = { id: Date.now().toString(), ...signupData };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        ok = true;
      }

      if (ok) {
        // Show success message
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
          messageContainer.textContent = 'Sign-up successful! Redirecting to login page...';
          messageContainer.className = 'message-container success';
          messageContainer.style.display = 'block';
        }
        
        // Reset form
        signupForm.reset();
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
        
        // Redirect to login page after a short delay with success parameter
        setTimeout(() => {
          window.location.href = 'index.html?signup=success';
        }, 2000);
      }
    } catch (error) {
      alert(`Signup Failed: ${error.message}`);
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
    }
  });
});
