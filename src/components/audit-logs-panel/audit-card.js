(function () {
    const userIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    const clockIconSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function createAuditCard(log, options = {}) {
        const card = document.createElement('article');
        card.className = 'audit-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Hap audit log ${log.id ?? ''}`);

        card.innerHTML = `
            <div class="audit-card__type">
                <span class="audit-card__badge ${escapeHTML(log.badgeClass ?? 'audit-card__badge--default')}">${escapeHTML(log.typeLabel ?? 'Log')}</span>
            </div>

            <div class="audit-card__id">
                <span>${escapeHTML(log.id)}</span>
            </div>

            <div class="audit-card__creator">
                <div class="audit-card__avatar">${userIconSVG}</div>
                <div class="audit-card__creator-info">
                    <div class="audit-card__creator-name">${escapeHTML(log.creator?.name ?? 'System')}</div>
                    <div class="audit-card__creator-role">${escapeHTML(log.creator?.role ?? 'System')}</div>
                </div>
            </div>

            <div class="audit-card__description">
                <p>${escapeHTML(log.description)}</p>
            </div>

            <div class="audit-card__timestamp">
                ${clockIconSVG}
                <span>${escapeHTML(log.timestamp)}</span>
            </div>
        `;

        const open = () => {
            if (typeof options.onOpen === 'function') {
                options.onOpen(log);
            }
        };

        card.addEventListener('click', open);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });

        return card;
    }

    window.AuditCard = {
        createAuditCard
    };
}());
