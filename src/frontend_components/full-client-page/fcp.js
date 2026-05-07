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

    function clientMatchesQuery(client, query) {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return true;
        }

        return [client.name, client.code, client.phone]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
    }

    function createFullClientCard(container, client = {}, options = {}) {
        if (!container) {
            return null;
        }

        const name = client.name ?? '';
        const code = client.code ?? '';
        const phone = client.phone ?? '';

        container.classList.add('fcp-card');
        container.dataset.clientId = client.id ?? '';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `Hap klientin ${name}`.trim());
        container.innerHTML = `
            <div class="fcp-card__top">
                <span class="fcp-card__avatar" aria-hidden="true">${client.iconHTML ?? renderClientIcon()}</span>
                <div class="fcp-card__identity">
                    <h3 class="fcp-card__name">${escapeHTML(name)}</h3>
                    <p class="fcp-card__code">${escapeHTML(code)}</p>
                </div>
                <svg class="fcp-card__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="fcp-card__divider"></div>
            <p class="fcp-card__phone">${escapeHTML(phone)}</p>
        `;

        function selectClient() {
            container.dispatchEvent(new CustomEvent('fcp:client-select', {
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

    function createFullClientPage(container, data = {}) {
        if (!container) {
            return null;
        }

        const clients = Array.isArray(data.clients) ? data.clients : [];
        let query = '';

        container.classList.add('fcp');
        container.innerHTML = `
            <div class="fcp__header">
                <div class="fcp__top">
                    <h2 class="fcp__title">${escapeHTML(data.title ?? 'Të gjithë klientët tanë')}</h2>
                    <label class="fcp__search">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m21 21-4.35-4.35M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6z" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <input class="fcp__search-input" type="search" placeholder="${escapeHTML(data.searchPlaceholder ?? 'Kërko klientë sipas numrit të telefonit')}" aria-label="${escapeHTML(data.searchLabel ?? 'Kërko klientë')}">
                    </label>
                </div>
                <div class="fcp__divider-row" aria-hidden="true">
                    <span class="fcp__divider"></span>
                    <span class="fcp__section-label">${escapeHTML(data.sectionLabel ?? 'Të gjithë pjesëtarët')}</span>
                    <span class="fcp__divider"></span>
                </div>
            </div>
            <div class="fcp__content">
                <div class="fcp__grid"></div>
            </div>
            <p class="fcp__footer" aria-live="polite"></p>
        `;

        const grid = container.querySelector('.fcp__grid');
        const input = container.querySelector('.fcp__search-input');
        const footer = container.querySelector('.fcp__footer');

        function render() {
            const filteredClients = clients.filter((client) => clientMatchesQuery(client, query));
            grid.innerHTML = '';

            if (filteredClients.length === 0) {
                grid.innerHTML = `<div class="fcp__empty">${escapeHTML(data.emptyText ?? 'Nuk u gjet asnjë klient')}</div>`;
            } else {
                filteredClients.forEach((client) => {
                    const card = document.createElement('article');
                    grid.appendChild(card);
                    createFullClientCard(card, client, {
                        onClientClick: data.onClientClick
                    });
                });
            }

            footer.textContent = data.totalText ?? `${filteredClients.length} klientë në total`;
            container.dispatchEvent(new CustomEvent('fcp:filter', {
                bubbles: true,
                detail: { query, clients: filteredClients }
            }));
        }

        input.addEventListener('input', () => {
            query = input.value;
            render();
        });

        render();

        return {
            render,
            setQuery(value) {
                query = String(value ?? '');
                input.value = query;
                render();
            },
            getQuery() {
                return query;
            },
            getClients() {
                return clients.slice();
            }
        };
    }

    window.createFullClientCard = createFullClientCard;
    window.createFullClientPage = createFullClientPage;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createFullClientCard,
            createFullClientPage
        };
    }
}());
