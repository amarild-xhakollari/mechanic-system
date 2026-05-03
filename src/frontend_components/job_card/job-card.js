(function () {
    const JOB_ICON_SRC = '../../images/default-icons/job-icon.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function normalizeMechanics(data) {
        if (Array.isArray(data.mechanics)) {
            return data.mechanics;
        }

        return [data.mechanic1, data.mechanic2].filter(Boolean);
    }

    function createJobCard(container, data = {}) {
        if (!container) {
            return null;
        }

        const status = data.status ?? '';
        const mechanics = normalizeMechanics(data);

        container.innerHTML = `
            <div class="job-card__top">
                <div class="job-card__identity">
                    <div class="job-card__icon" aria-hidden="true">
                        <img src="${JOB_ICON_SRC}" alt="">
                    </div>
                    <div class="job-card__heading">
                        <h2 class="job-card__title">${escapeHTML(data.code ?? '')}</h2>
                        <p class="job-card__client">${escapeHTML(data.client ?? '')}</p>
                    </div>
                </div>
                ${status ? `
                    <div class="job-card__status" aria-label="Status: ${escapeHTML(status)}">
                        <span class="job-card__status-dot"></span>
                        <span>${escapeHTML(status)}</span>
                    </div>
                ` : ''}
            </div>

            <div class="job-card__content">
                <p class="job-card__label">${escapeHTML(data.mechanicsLabel ?? 'Mekaniket')}</p>
                <div class="job-card__mechanics">
                    ${mechanics.map((mechanic) => `<p class="job-card__mechanic">${escapeHTML(mechanic)}</p>`).join('')}
                </div>
                <p class="job-card__label job-card__date-label">${escapeHTML(data.dateLabel ?? 'Data')}</p>
                <p class="job-card__date">${escapeHTML(data.date ?? '')}</p>
            </div>
        `;

        return container;
    }

    window.createJobCard = createJobCard;
}());
