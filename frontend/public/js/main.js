// Main JavaScript for public pages
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Check if user is already logged in
  const token = localStorage.getItem('token');
  if (token && window.location.pathname.includes('index.html')) {
    // Optionally redirect to dashboard if on home page
    // window.location.href = 'dashboard.html';
  }
});
