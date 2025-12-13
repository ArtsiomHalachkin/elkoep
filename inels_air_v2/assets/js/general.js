document.addEventListener('DOMContentLoaded', function () {
  const addButtons = document.querySelectorAll('.btn-circle');

  addButtons.forEach(button => {
    button.addEventListener('click', function () {
      button.classList.add('expanded');
    });

    const modalSelector = button.getAttribute('data-bs-target');
    if (modalSelector) {
      const modalElement = document.querySelector(modalSelector);
      if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', function () {
          button.classList.remove('expanded');
        });
      }
    }
  });
});