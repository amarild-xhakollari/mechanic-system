(function () {
    const SEARCH_ENDPOINT = '../api/search_clients.php';
    let allClients = [];
    let searchTimer = null;
    let controller = null;

    function renderClients(clients) {
        const container = document.querySelector('#clients-list');
        const normalizedClients = clients.map(AdminPages.normalizeClient);

        container.innerHTML = '';

        if (normalizedClients.length === 0) {
            AdminPages.renderEmpty(container, 'Nuk ka kliente te regjistruar.');
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

    async function searchClients(query) {
        const value = query.trim();
        clearTimeout(searchTimer);

        if (controller) {
            controller.abort();
        }

        if (value.length < 2) {
            renderClients(allClients);
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
                renderClients(await response.json());
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

        createSearchBar(document.querySelector('#clients-search'), {
            placeholder: 'Kerko klient sipas emrit ose telefonit',
            onSearch: searchClients
        });

        renderClients(allClients);
    });
}());
