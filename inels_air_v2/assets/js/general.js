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

/*
 * Shared delete-confirmation modal, available app-wide as window.confirmDelete().
 * Usage:  if (await confirmDelete(`Delete ${name}?`)) { ... }
 *         if (await confirmDelete({ title: "Delete room", message: "Are you sure?" })) { ... }
 * Resolves to true when the user confirms, false when they close/cancel.
 */
(function () {
  const MODAL_ID = 'modal_confirm_delete';

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" role="dialog" tabindex="-1" id="${MODAL_ID}">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h4 class="modal-title" id="${MODAL_ID}_title">Delete</h4>
              <button class="btn-close" type="button" aria-label="Close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <h5 class="text-center" id="${MODAL_ID}_message">Are you sure?</h5>
            </div>
            <div class="modal-footer">
              <button class="btn btn-light" type="button" data-bs-dismiss="modal">Close</button>
              <button class="btn btn-danger btn-delete" type="button" id="${MODAL_ID}_confirm">Delete</button>
            </div>
          </div>
        </div>
      </div>`;
    modal = wrapper.firstElementChild;
    document.body.appendChild(modal);
    return modal;
  }

  window.confirmDelete = function (options) {
    const opts = typeof options === 'string' ? { message: options } : (options || {});

    // Fallback to native confirm if Bootstrap isn't available for some reason.
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
      return Promise.resolve(window.confirm(opts.message || 'Are you sure?'));
    }

    const modalEl = ensureModal();
    modalEl.querySelector(`#${MODAL_ID}_title`).textContent = opts.title || 'Delete';
    modalEl.querySelector(`#${MODAL_ID}_message`).textContent = opts.message || 'Are you sure?';

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    return new Promise((resolve) => {
      let confirmed = false;

      // Replace the confirm button to clear any listeners from previous calls.
      const oldBtn = modalEl.querySelector(`#${MODAL_ID}_confirm`);
      const confirmBtn = oldBtn.cloneNode(true);
      oldBtn.parentNode.replaceChild(confirmBtn, oldBtn);

      confirmBtn.addEventListener('click', () => {
        confirmed = true;
        modal.hide();
      }, { once: true });

      modalEl.addEventListener('hidden.bs.modal', function onHidden() {
        modalEl.removeEventListener('hidden.bs.modal', onHidden);
        resolve(confirmed);
      });

      modal.show();
    });
  };
})();