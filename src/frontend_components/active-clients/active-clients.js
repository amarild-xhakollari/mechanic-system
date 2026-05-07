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

    function renderClientIcon() {
        return `
            <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M34.4 14.6c4.4 1.1 7.4 5.1 7.4 9.7 0 4.3-2.8 8-6.6 9.4l2 12.7h7.7c2.1 0 3.9 1.7 3.9 3.9v2.2H15.2v-2.2c0-2.1 1.7-3.9 3.9-3.9h7.7l2-12.7c-3.9-1.4-6.6-5.1-6.6-9.4 0-4.6 3.1-8.6 7.4-9.7V11h4.8v3.6z" fill="#44200f"></path>
                <path d="M24.6 49.1h14.8" stroke="#9f5730" stroke-width="2.4" stroke-linecap="round"></path>
                <path d="M28.6 22.5c0-2 1.5-3.8 3.4-3.8s3.4 1.7 3.4 3.8" stroke="#7b4326" stroke-width="2.4" stroke-linecap="round"></path>
                <path d="M20.6 53h22.8" stroke="#2b1309" stroke-width="3" stroke-linecap="round"></path>
            </svg>
        `;
    }

    function createActiveClientCard(container, client = {}, options = {}) {
        if (!container) {
            return null;
        }

        const name = client.name ?? '';
        const code = client.code ?? '';
        const phone = client.phone ?? '';

        container.classList.add('active-client-card');
        container.dataset.clientId = client.id ?? '';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `Hap klientin ${name}`.trim());
        container.innerHTML = `
            <div class="active-client-card__top">
                <span class="active-client-card__avatar" aria-hidden="true">
                    ${client.iconHTML ?? renderClientIcon()}
                </span>
                <div class="active-client-card__identity">
                    <h3 class="active-client-card__name">${escapeHTML(name)}</h3>
                    <p class="active-client-card__code">${escapeHTML(code)}</p>
                </div>
                <svg class="active-client-card__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="active-client-card__divider"></div>
            <p class="active-client-card__phone">${escapeHTML(phone)}</p>
        `;

        function selectClient() {
            container.dispatchEvent(new CustomEvent('active-client-card:select', {
                bubbles: true,
                detail: { client }
            }));

            if (typeof options.onClientClick === 'function') {
                options.onClientClick(client);
            }
        }

        container.onclick = selectClient;
        container.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectClient();
            }
        };

        return container;
    }

    function createActiveClientsPanel(container, data = {}) {
        if (!container) {
            return null;
        }

        const clients = Array.isArray(data.clients) ? data.clients : [];

        container.classList.add('active-clients-panel');
        container.innerHTML = `
            <div class="active-clients-panel__header">
                <div>
                    <h2 class="active-clients-panel__title">${escapeHTML(data.title ?? 'Klientët Aktivë')}</h2>
                    <p class="active-clients-panel__subtitle">${escapeHTML(data.subtitle ?? 'Klientë aktivë aktualisht')}</p>
                </div>
                <button class="active-clients-panel__action" type="button">
                    <span>${escapeHTML(data.actionText ?? 'Shiko të gjitha punët')}</span>
                    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                        <path d="M15 8H32V25" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M31 9 11 29" stroke-width="3.3" stroke-linecap="round"></path>
                        <path d="M28 30H8V10" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </button>
            </div>
            ${clients.length > 0
                ? '<div class="active-clients-panel__list"></div>'
                : `<div class="active-clients-panel__empty">${escapeHTML(data.emptyText ?? 'Nuk ka klientë aktivë')}</div>`}
        `;

        const list = container.querySelector('.active-clients-panel__list');
        if (list) {
            clients.forEach((client) => {
                const card = document.createElement('article');
                list.appendChild(card);
                createActiveClientCard(card, client, {
                    onClientClick: data.onClientClick
                });
            });
        }

        container.querySelector('.active-clients-panel__action').addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('active-clients-panel:action', { bubbles: true }));

            if (typeof data.onAction === 'function') {
                data.onAction();
            }
        });

        return container;
    }

    window.createActiveClientCard = createActiveClientCard;
    window.createActiveClientsPanel = createActiveClientsPanel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createActiveClientCard,
            createActiveClientsPanel
        };
    }
}());
