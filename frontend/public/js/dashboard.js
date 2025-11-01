const API_URL = 'http://localhost:5000/api';

// Get token
function getToken() {
  return localStorage.getItem('token');
}

// Fetch with auth
async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return null;
  }
  
  return response;
}

// Load Dashboard Data
async function loadDashboard() {
  try {
    const response = await fetchWithAuth(`${API_URL}/user/profile`);
    if (!response) return;
    
    const user = await response.json();
    
    document.getElementById('username').textContent = user.username;
    document.getElementById('total-earnings').textContent = `${user.totalEarnings.toFixed(2)}`;
    document.getElementById('quizzes-taken').textContent = user.quizzesTaken;
    
    const accuracy = user.totalQuestions > 0 
      ? ((user.correctAnswers / user.totalQuestions) * 100).toFixed(1)
      : 0;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('streak').textContent = user.streak;
    
    // Load recent quizzes
    loadRecentQuizzes();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Load Recent Quizzes
async function loadRecentQuizzes() {
  try {
    const response = await fetchWithAuth(`${API_URL}/quiz/my-quizzes`);
    if (!response) return;
    
    const quizzes = await response.json();
    const container = document.getElementById('recent-quizzes');
    const noQuizzes = document.getElementById('no-quizzes');
    
    if (quizzes.length === 0) {
      container.classList.add('hidden');
      if (noQuizzes) noQuizzes.classList.remove('hidden');
      return;
    }
    
    if (noQuizzes) noQuizzes.classList.add('hidden');
    container.classList.remove('hidden');
    
    container.innerHTML = quizzes.slice(0, 6).map(quiz => `
      <div class="card">
        <h3 style="margin-bottom: 0.5rem;">${quiz.topic}</h3>
        <p style="opacity: 0.7; font-size: 0.9rem; margin-bottom: 1rem;">
          ${new Date(quiz.createdAt).toLocaleDateString()}
        </p>
        ${quiz.completed ? `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Score: ${quiz.score}/${quiz.totalQuestions}</span>
            <span style="color: var(--accent); font-weight: bold;">${quiz.earnings.toFixed(2)}</span>
          </div>
        ` : `
          <a href="take-quiz.html?id=${quiz._id}" class="btn btn-primary">Continue Quiz</a>
        `}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading quizzes:', error);
  }
}

// Load Leaderboard
async function loadLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/user/leaderboard`);
    const users = await response.json();
    
    const container = document.getElementById('leaderboard-container');
    const loading = document.getElementById('loading-container');
    
    if (loading) loading.classList.add('hidden');
    
    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid rgba(255,255,255,0.2);">
            <th style="padding: 1rem; text-align: left;">Rank</th>
            <th style="padding: 1rem; text-align: left;">User</th>
            <th style="padding: 1rem; text-align: right;">Quizzes</th>
            <th style="padding: 1rem; text-align: right;">Correct</th>
            <th style="padding: 1rem; text-align: right;">Earnings</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 1rem;">${medal} ${index + 1}</td>
                <td style="padding: 1rem; font-weight: 500;">${user.username}</td>
                <td style="padding: 1rem; text-align: right;">${user.quizzesTaken}</td>
                <td style="padding: 1rem; text-align: right;">${user.correctAnswers}</td>
                <td style="padding: 1rem; text-align: right; color: var(--accent); font-weight: bold;">
                  ${user.totalEarnings.toFixed(2)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// Load Profile
async function loadProfile() {
  try {
    const response = await fetchWithAuth(`${API_URL}/user/profile`);
    if (!response) return;
    
    const user = await response.json();
    
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-earnings').textContent = `${user.totalEarnings.toFixed(2)}`;
    document.getElementById('profile-quizzes').textContent = user.quizzesTaken;
    document.getElementById('profile-correct').textContent = user.correctAnswers;
    document.getElementById('profile-total').textContent = user.totalQuestions;
    
    document.getElementById('new-username').value = user.username;
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Update Profile
const updateProfileForm = document.getElementById('update-profile-form');
if (updateProfileForm) {
  updateProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value;
    
    try {
      const response = await fetchWithAuth(`${API_URL}/user/profile`, {
        method: 'PUT',
        body: JSON.stringify({ username })
      });
      
      if (response && response.ok) {
        const alertContainer = document.getElementById('alert-container');
        alertContainer.innerHTML = '<div class="alert alert-success">Profile updated successfully!</div>';
        setTimeout(() => {
          alertContainer.innerHTML = '';
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  });
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();
  
  if (page === 'dashboard.html') {
    loadDashboard();
  } else if (page === 'leaderboard.html') {
    loadLeaderboard();
  } else if (page === 'profile.html') {
    loadProfile();
  }
});
