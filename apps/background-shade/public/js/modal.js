// Modal functionality
export function setupModal() {
    const modal = document.getElementById('howItWorksModal');
    const btn = document.getElementById('howItWorksBtn');
    const closeBtn = document.getElementById('closeModal');

    if (!modal || !btn || !closeBtn) {
        console.error('Modal elements not found');
        return;
    }

    function openModal() {
        modal.hidden = false;
        modal.offsetHeight;
        modal.classList.add('show');
    }

    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.hidden = true;
        }, 300);
    }

    btn.onclick = openModal;
    closeBtn.onclick = closeModal;

    window.onclick = function(event) {
        if (event.target === modal) closeModal();
    };

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
}

document.addEventListener('DOMContentLoaded', setupModal);
