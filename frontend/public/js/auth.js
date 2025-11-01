const API_URL = 'http://localhost:5000/api';

// Helper function to show alerts
function showAlert(message, type = 'error') {
  const container = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  container.innerHTML = '';
  container.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const loginText = document.getElementById('login-text');
    const loginLoading = document.getElementById('login-loading');
    
    loginText.classList.add('hidden');
    loginLoading.classList.remove('hidden');
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        showAlert(data.message || 'Login failed');
        loginText.classList.remove('hidden');
        loginLoading.classList.add('hidden');
      }
    } catch (error) {
      showAlert('Network error. Please try again.');
      loginText.classList.remove('hidden');
      loginLoading.classList.add('hidden');
    }
  });
}

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      showAlert('Passwords do not match');
      return;
    }
    
    const registerText = document.getElementById('register-text');
    const registerLoading = document.getElementById('register-loading');
    
    registerText.classList.add('hidden');
    registerLoading.classList.remove('hidden');
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showAlert('Account created! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        showAlert(data.message || 'Registration failed');
        registerText.classList.remove('hidden');
        registerLoading.classList.add('hidden');
      }
    } catch (error) {
      showAlert('Network error. Please try again.');
      registerText.classList.remove('hidden');
      registerLoading.classList.add('hidden');
    }
  });
}

// Check authentication on protected pages
function checkAuth() {
  const token = localStorage.getItem('token');
  const protectedPages = ['dashboard.html', 'create-quiz.html', 'take-quiz.html', 'profile.html', 'results.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage) && !token) {
    window.location.href = 'login.html';
  }
}

// Logout handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
}

// Run auth check
checkAuth();
