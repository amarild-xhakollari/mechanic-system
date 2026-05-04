(function () {
    function getStaffId() {
        return new URLSearchParams(window.location.search).get('staff_id');
    }

    async function fetchStaffDetails(staffId) {
        const response = await fetch(`../api/get_staff_details.php?staff_id=${encodeURIComponent(staffId)}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Staff details API failed with ${response.status}`);
        }

        return response.json();
    }

    AdminPages.loadPage(async () => {
        const mount = document.querySelector('#staff-details-panel');
        createGoBackButton(document.querySelector('#staff-details-back'), {
            fallbackHref: 'admin-staff.html'
        });

        const staffId = getStaffId();

        if (!staffId) {
            AdminPages.renderEmpty(mount, 'Mungon ID e stafit.');
            return;
        }

        mount.innerHTML = '<p class="empty-state">Duke ngarkuar detajet...</p>';

        try {
            const payload = await fetchStaffDetails(staffId);

            if (!payload.success) {
                AdminPages.renderEmpty(mount, payload.message || 'Stafi nuk u gjet.');
                return;
            }

            createStaffSpecificationPanel(mount, payload.staff);
        } catch (error) {
            console.warn('Staff details could not be loaded:', error);
            AdminPages.renderEmpty(mount, 'Detajet e stafit nuk u ngarkuan.');
        }
    });
}());
