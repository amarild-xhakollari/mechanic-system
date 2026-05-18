(function () {
    const SEARCH_ENDPOINT = '../api/search_clients.php';
    let allClients = [];
    let visibleClients = [];
    let activeFilter = 'all';
    let searchTimer = null;
    let controller = null;

    function getActiveJobCount(client) {
        if (Number.isFinite(Number(client.activeJobs))) {
            return Number(client.activeJobs);
        }

        if (Number.isFinite(Number(client.active_jobs))) {
            return Number(client.active_jobs);
        }

        const detailMatch = String(client.detail ?? '').match(/\d+/);
        return detailMatch ? Number(detailMatch[0]) : 0;
    }

    function filterClients(clients) {
        if (activeFilter === 'inactive') {
            return clients.filter((client) => getActiveJobCount(client) === 0);
        }

        if (activeFilter === 'active') {
            return clients.filter((client) => getActiveJobCount(client) > 0);
        }

        return clients;
    }

    function getEmptyMessage() {
        if (activeFilter === 'inactive') {
            return 'Nuk ka kliente jo aktiv.';
        }

        if (activeFilter === 'active') {
            return 'Nuk ka kliente aktiv.';
        }

        return 'Nuk ka kliente te regjistruar.';
    }

    function updateFilterLabel() {
        const label = document.querySelector('[data-client-filter-label]');

        if (!label) return;

        const labels = {
            all: 'Te gjithe klientet',
            active: 'Klientet aktiv',
            inactive: 'Klientet jo aktiv'
        };

        label.textContent = labels[activeFilter] ?? labels.all;
    }

    function renderClients(clients) {
        const container = document.querySelector('#clients-list');
        const filteredClients = filterClients(clients);
        const normalizedClients = filteredClients.map(AdminPages.normalizeClient);

        container.innerHTML = '';
        updateFilterLabel();

        if (normalizedClients.length === 0) {
            AdminPages.renderEmpty(container, getEmptyMessage());
        } else {
            normalizedClients.forEach((client) => {
                const card = document.createElement('article');
                container.appendChild(card);
                createClientMiniCard(card, client, () => {
                    window.location.href = `client-details.html?client_id=${encodeURIComponent(client.id)}`;
                });
            });
        }

        document.querySelector('[data-clients-count]').textContent = `${normalizedClients.length} kliente ne total`;
    }

    function setActiveFilter(nextFilter) {
        activeFilter = nextFilter;

        document.querySelectorAll('[data-client-filter]').forEach((button) => {
            const isActive = button.dataset.clientFilter === activeFilter;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        renderClients(visibleClients);
    }

    function bindClientFilters() {
        document.querySelectorAll('[data-client-filter]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.clientFilter === activeFilter));
            button.addEventListener('click', () => setActiveFilter(button.dataset.clientFilter));
        });
    }

    async function searchClients(query) {
        const value = query.trim();
        clearTimeout(searchTimer);

        if (controller) {
            controller.abort();
        }

        if (value.length < 2) {
            visibleClients = allClients;
            renderClients(visibleClients);
            return;
        }

        searchTimer = setTimeout(async () => {
            controller = new AbortController();

            try {
                const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(value)}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal
                });

                if (!response.ok) throw new Error(`Search failed with ${response.status}`);
                visibleClients = await response.json();
                renderClients(visibleClients);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('Client search failed:', error);
                    AdminPages.showToast('Kerkimi i klienteve deshtoi');
                }
            }
        }, 250);
    }

    AdminPages.loadPage((data) => {
        allClients = Array.isArray(data.clients) ? data.clients : [];
        visibleClients = allClients;

        createSearchBar(document.querySelector('#clients-search'), {
            placeholder: 'Kerko klient sipas emrit ose telefonit',
            onSearch: searchClients
        });

        bindClientFilters();
        renderClients(visibleClients);
    });
}());
