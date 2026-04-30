(function () {
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
                        <svg viewBox="0 0 64 64" role="img" focusable="false">
                            <path fill="#333333" d="M9 20.5c0-3.3 2.7-6 6-6h12.4l5 5H49c3.3 0 6 2.7 6 6v2.7H9v-7.7Z"></path>
                            <path fill="#ededed" d="M12.5 24.5c0-2.1 1.7-3.8 3.8-3.8h31.4c2.1 0 3.8 1.7 3.8 3.8v8.2h-39v-8.2Z"></path>
                            <path fill="#242424" d="M8.5 28.8c0-2.1 1.7-3.8 3.8-3.8h39.4c2.1 0 3.8 1.7 3.8 3.8v20.4c0 2.1-1.7 3.8-3.8 3.8H12.3c-2.1 0-3.8-1.7-3.8-3.8V28.8Z"></path>
                            <path fill="#161616" opacity=".35" d="M9.5 47.5h45v2.2c0 1.5-1.3 2.8-2.8 2.8H12.3c-1.5 0-2.8-1.3-2.8-2.8v-2.2Z"></path>
                        </svg>
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
