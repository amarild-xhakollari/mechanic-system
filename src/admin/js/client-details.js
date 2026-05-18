(function () {
    function getClientId() {
        return new URLSearchParams(window.location.search).get('client_id');
    }

    async function fetchClientDetails(clientId) {
        const response = await fetch(`../api/get_client_details.php?client_id=${encodeURIComponent(clientId)}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Client details API failed with ${response.status}`);
        }

        return response.json();
    }

    AdminPages.loadPage(async () => {
        const mount = document.querySelector('#client-details-panel');
        createGoBackButton(document.querySelector('#client-details-back'), {
            fallbackHref: 'admin-clients.html'
        });

        const clientId = getClientId();

        if (!clientId) {
            AdminPages.renderEmpty(mount, 'Mungon ID e klientit.');
            return;
        }

        mount.innerHTML = '<p class="empty-state">Duke ngarkuar detajet...</p>';

        try {
            const payload = await fetchClientDetails(clientId);

            if (!payload.success) {
                AdminPages.renderEmpty(mount, payload.message || 'Klienti nuk u gjet.');
                return;
            }

            createClientSpecificationPanel(mount, payload.client);
        } catch (error) {
            console.warn('Client details could not be loaded:', error);
            AdminPages.renderEmpty(mount, 'Detajet e klientit nuk u ngarkuan.');
        }
    });
}());
