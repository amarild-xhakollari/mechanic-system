(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';
    const CLIENT_ICON_SRC = '../../../assets/images/default-icons/client-icon.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function externalLinkIcon() {
        return `
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14 4h6v6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M20 4 10 14" stroke-width="2.2" stroke-linecap="round"></path>
                <path d="M18 14v5H5V6h5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;
    }

    function renderJobCard(job) {
        const staff = Array.isArray(job.staff) ? job.staff.filter(Boolean) : [];
        const detailRows = [];

        if (staff.length > 0) {
            detailRows.push(`
                <div class="staff-home-job-card__staff">
                    ${staff.map((name) => `<p class="staff-home-job-card__muted">${escapeHTML(name)}</p>`).join('')}
                </div>
            `);
        }

        if (job.date) {
            detailRows.push(`<p class="staff-home-job-card__muted">${escapeHTML(job.date)}</p>`);
        }

        return `
            <article class="staff-home-job-card">
                <div class="staff-home-job-card__top">
                    <div class="staff-home-job-card__identity">
                        <span class="staff-home-job-card__icon" aria-hidden="true">
                            <img src="${JOB_ICON_SRC}" alt="">
                        </span>
                        <div>
                            ${job.code ? `<h3 class="staff-home-job-card__title">${escapeHTML(job.code)}</h3>` : ''}
                            ${job.client ? `<p class="staff-home-job-card__muted">${escapeHTML(job.client)}</p>` : ''}
                        </div>
                    </div>
                    ${job.status ? `
                        <span class="staff-home-job-card__status">
                            <span class="staff-home-job-card__status-dot"></span>
                            <span>${escapeHTML(job.status)}</span>
                        </span>
                    ` : ''}
                </div>
                ${detailRows.length > 0 ? `
                    <div class="staff-home-job-card__divider"></div>
                    <div class="staff-home-job-card__details">${detailRows.join('')}</div>
                ` : ''}
            </article>
        `;
    }

    function renderClientCard(client) {
        return `
            <article class="staff-home-client-card" tabindex="0" role="button" aria-label="Hap klientin ${escapeHTML(client.name || '')}">
                <div class="staff-home-client-card__top">
                    <div class="staff-home-client-card__identity">
                        <span class="staff-home-client-card__icon" aria-hidden="true">
                            <img src="${CLIENT_ICON_SRC}" alt="">
                        </span>
                        <div>
                            ${client.name ? `<h3 class="staff-home-client-card__name">${escapeHTML(client.name)}</h3>` : ''}
                            ${client.code ? `<p class="staff-home-client-card__muted">${escapeHTML(client.code)}</p>` : ''}
                        </div>
                    </div>
                    <svg class="staff-home-client-card__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </div>
                ${client.phone ? `
                    <div class="staff-home-client-card__divider"></div>
                    <p class="staff-home-client-card__muted">${escapeHTML(client.phone)}</p>
                ` : ''}
            </article>
        `;
    }

    function createStaffHomePanel(container, options = {}) {
        if (!container) {
            return null;
        }

        const type = options.type === 'clients' ? 'clients' : 'jobs';
        const items = Array.isArray(options.items) ? options.items.slice(0, 2) : [];

        container.className = `staff-home-panel staff-home-panel--${type}`;
        container.innerHTML = `
            <div class="staff-home-panel__header">
                <h2 class="staff-home-panel__title">${escapeHTML(options.title || '')}</h2>
                ${options.href ? `
                    <a class="staff-home-panel__link" href="${escapeHTML(options.href)}">
                        <span>${escapeHTML(options.linkText || 'Shiko te gjitha')}</span>
                        ${externalLinkIcon()}
                    </a>
                ` : ''}
            </div>
            <div class="staff-home-panel__grid staff-home-panel__grid--${type}">
                ${items.length > 0
                    ? items.map(type === 'clients' ? renderClientCard : renderJobCard).join('')
                    : `<p class="staff-home-panel__empty">${escapeHTML(options.emptyText || 'Nuk ka te dhena.')}</p>`}
            </div>
        `;

        return container;
    }

    window.createStaffHomePanel = createStaffHomePanel;
}());
