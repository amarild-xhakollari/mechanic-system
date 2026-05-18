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

    function renderAvatar() {
        return `
            <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="37" cy="20" r="9"></circle>
                <circle cx="32" cy="39" r="13"></circle>
            </svg>
        `;
    }

    function createUserStaffHorizontalCard(container, data = {}) {
        if (!container) {
            return null;
        }

        const name = data.name || 'Staff';
        const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['Staff'];
        const activeJobs = Number(data.activeJobs ?? 0);
        const totalJobs = Number(data.totalJobs ?? 0);

        container.classList.add('user-staff-horizontal-card');
        container.innerHTML = `
            <div class="user-staff-horizontal-card__content">
                <h2 class="user-staff-horizontal-card__title">${escapeHTML(data.title ?? 'Profili i perdoruesit')}</h2>
                <p class="user-staff-horizontal-card__subtitle">${escapeHTML(data.subtitle ?? 'Ne kete panel mund te shikosh te detajet e profilit tend')}</p>
                <div class="user-staff-horizontal-card__identity">
                    <span class="user-staff-horizontal-card__avatar">${renderAvatar()}</span>
                    <div class="user-staff-horizontal-card__details">
                        <p class="user-staff-horizontal-card__name">${escapeHTML(name)}</p>
                        <div class="user-staff-horizontal-card__tags">
                            ${roles.map((role) => `<span class="user-staff-horizontal-card__tag">${escapeHTML(role)}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <span class="user-staff-horizontal-card__divider" aria-hidden="true"></span>
            <div class="user-staff-horizontal-card__side">
                <a class="user-staff-horizontal-card__link" href="${escapeHTML(data.profileHref ?? 'staff-clients.html')}">
                    <span>${escapeHTML(data.profileText ?? 'Shiko profilin')}</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M14 4h6v6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M20 4 10 14" stroke-width="2.2" stroke-linecap="round"></path>
                        <path d="M18 14v5H5V6h5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </a>
                <div class="user-staff-horizontal-card__stats">
                    <div class="user-staff-horizontal-card__stat">
                        <span class="user-staff-horizontal-card__stat-label">Punet Aktive</span>
                        <span class="user-staff-horizontal-card__stat-value">${escapeHTML(activeJobs)}</span>
                    </div>
                    <div class="user-staff-horizontal-card__stat">
                        <span class="user-staff-horizontal-card__stat-label">Punet Totale</span>
                        <span class="user-staff-horizontal-card__stat-value">${escapeHTML(totalJobs)}</span>
                    </div>
                </div>
            </div>
        `;

        return container;
    }

    window.createUserStaffHorizontalCard = createUserStaffHorizontalCard;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createUserStaffHorizontalCard };
    }
}());
