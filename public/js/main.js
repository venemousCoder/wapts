document.addEventListener('DOMContentLoaded', () => {
  // Highlight active nav link based on current URL
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
  
  // Add interactive hover effects to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    });
  });
});
