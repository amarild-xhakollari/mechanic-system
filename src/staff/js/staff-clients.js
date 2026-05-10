(function () {
    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

    let allClients = [];

    function goToClientDetails(client) {
        window.location.href = `staff-client-details.html?client_id=${encodeURIComponent(client.id)}`;
    }

    function bindClientNavigation(card, client) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Shiko detajet per ${client.name}`);
        card.addEventListener('click', () => goToClientDetails(client));
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            goToClientDetails(client);
        });
    }

    function renderClients(clients) {
        const container = document.querySelector('#clients-list');
        container.innerHTML = '';

        if (clients.length === 0) {
            container.innerHTML = '<p class="empty-state">Nuk ka kliente per punet tuaja.</p>';
        } else {
            clients.forEach((client) => {
                const card = document.createElement('article');
                container.appendChild(card);
                createClientMiniCard(card, client);
                bindClientNavigation(card, client);
            });
        }

        document.querySelector('[data-clients-count]').textContent = `${clients.length} kliente ne total`;
    }

    function getSearchText(client) {
        return [client.name, client.code, client.phone].join(' ').toLowerCase();
    }

    function searchClients(query = '') {
        const value = query.trim().toLowerCase();
        const clients = value.length < 2
            ? allClients
            : allClients.filter((client) => getSearchText(client).includes(value));

        renderClients(clients);
    }

    async function initPage() {
        const data = await StaffPages.loadData();
        allClients = data.clients;

        StaffPages.fillUser(data.user);
        createSearchBar(document.querySelector('#clients-search'), {
            placeholder: 'Kerko klient sipas emrit ose telefonit',
            onSearch: searchClients
        });
        renderClients(allClients);
    }

    initPage().catch((error) => console.warn('Staff clients could not load:', error));
}());
