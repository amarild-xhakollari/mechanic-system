(function () {
    const JOB_ICON_SRC = '../../images/default-icons/staff-job-icon.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    /**
     * Creates a reusable mini job card component.
     * @param {HTMLElement} container - The container element.
     * @param {Object} data - Job data.
     * @param {Function} onClick - Callback function when card is clicked.
     * @param {Object} options - Optional configuration.
     * @param {boolean} options.selectable - Whether card can be selected.
     */
    function createJobMiniCard(container, data = {}, onClick, options = {}) {
        if (!container) {
            return null;
        }

        container.classList.add('job-minicard');
        container.innerHTML = `
            <div class="job-minicard__header">
                <div class="job-minicard__icon" aria-hidden="true">
                    <img src="${JOB_ICON_SRC}" alt="">
                </div>
                <div class="job-minicard__info">
                    <div class="job-minicard__code">${escapeHTML(data.code ?? '')}</div>
                    <div class="job-minicard__client">${escapeHTML(data.client ?? '')}</div>
                </div>
            </div>
            <div class="job-minicard__date">${escapeHTML(data.date ?? '')}</div>
        `;

        container.dataset.jobId = data.id ?? '';
        container.setAttribute('tabindex', '0');
        container.setAttribute('role', 'button');
        container.setAttribute('aria-label', `Job ${data.code ?? ''}, Client ${data.client ?? ''}, Date ${data.date ?? ''}`);

        function selectJob() {
            if (options.selectable) {
                toggleJobMiniCardSelection(container);
            }

            if (typeof onClick === 'function') {
                onClick(data);
            }
        }

        container.onclick = selectJob;
        container.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectJob();
            }
        };

        return container;
    }

    function toggleJobMiniCardSelection(card) {
        const allCards = document.querySelectorAll('.job-minicard');
        allCards.forEach((item) => item.classList.remove('job-minicard--selected'));
        card.classList.add('job-minicard--selected');
    }

    function setJobMiniCardLoading(card, isLoading) {
        card.classList.toggle('job-minicard--loading', Boolean(isLoading));
    }

    function updateJobMiniCard(container, newData = {}) {
        const codeEl = container.querySelector('.job-minicard__code');
        const clientEl = container.querySelector('.job-minicard__client');
        const dateEl = container.querySelector('.job-minicard__date');

        if (codeEl) codeEl.textContent = newData.code ?? '';
        if (clientEl) clientEl.textContent = newData.client ?? '';
        if (dateEl) dateEl.textContent = newData.date ?? '';

        container.dataset.jobId = newData.id ?? '';
        container.setAttribute('aria-label', `Job ${newData.code ?? ''}, Client ${newData.client ?? ''}, Date ${newData.date ?? ''}`);
    }

    window.createJobMiniCard = createJobMiniCard;
    window.toggleJobMiniCardSelection = toggleJobMiniCardSelection;
    window.setJobMiniCardLoading = setJobMiniCardLoading;
    window.updateJobMiniCard = updateJobMiniCard;

    // Backward-compatible aliases for older demos or pages.
    window.createSimpleJobCard = createJobMiniCard;
    window.toggleSelection = toggleJobMiniCardSelection;
    window.setCardLoading = setJobMiniCardLoading;
    window.updateSimpleJobCard = updateJobMiniCard;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createJobMiniCard,
            toggleJobMiniCardSelection,
            setJobMiniCardLoading,
            updateJobMiniCard
        };
    }
}());
