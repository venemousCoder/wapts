document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Mobile Toggle
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('show');
    });
  }

  if (sidebarCloseBtn && sidebar) {
    sidebarCloseBtn.addEventListener('click', () => {
      sidebar.classList.remove('show');
    });
  }

  // Initialize Bootstrap Toasts
  const toastElList = document.querySelectorAll('.toast');
  const toastList = [...toastElList].map(toastEl => new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 5000
  }));
  toastList.forEach(toast => toast.show());

  // Initialize Bootstrap Tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // Card Hover Effects (Fallback for older CSS if needed)
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.add('card-hover'); // Let CSS handle the hover
  });

  // Global Chart.js Defaults if Chart is defined
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
    Chart.defaults.color = "#64748b"; // text-muted
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 61, 129, 0.9)";
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
  }
});
