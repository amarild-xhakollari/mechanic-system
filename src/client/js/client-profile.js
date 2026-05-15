(function () {
    const CLIENT_ICON_SRC = '../../../assets/images/default-icons/client-icon.png';

    ClientPages.bindLogout();
    ClientPages.bindProfileDropdown();

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function valueOrEmpty(value) {
        return value ? escapeHTML(value) : '<span class="client-profile-card__muted">Nuk ka te dhena</span>';
    }

    function getClientCode(user = {}) {
        const source = String(user.name || 'Client').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const letters = `${source.slice(0, 2)}CL`.slice(0, 2);
        const id = String(user.id || 1).padStart(3, '0');

        return `${letters}${id}`;
    }

    function createField(label, value) {
        return `
            <div>
                <p class="client-profile-card__label">${escapeHTML(label)}</p>
                <p class="client-profile-card__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function renderProfile(container, data = {}) {
        const user = data.user ?? {};
        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        const activeJobs = Array.isArray(data.activeJobs) ? data.activeJobs : [];

        container.innerHTML = `
            <article class="client-profile-card">
                <h2 class="client-profile-card__title" id="client-profile-title">Klienti</h2>
                <div class="client-profile-card__rule" aria-hidden="true"></div>

                <header class="client-profile-card__header">
                    <div class="client-profile-card__avatar" aria-hidden="true">
                        <img src="${CLIENT_ICON_SRC}" alt="">
                    </div>
                    <div>
                        <h3 class="client-profile-card__name">${valueOrEmpty(user.name)}</h3>
                        <p class="client-profile-card__code">Kodi : ${escapeHTML(getClientCode(user))}</p>
                    </div>
                </header>

                <section class="client-profile-card__section">
                    <h3 class="client-profile-card__section-title">Detajet e klientit</h3>
                    <div class="client-profile-card__field-grid">
                        ${createField('Email', user.email)}
                        ${createField('Nr Telefonit', user.phone)}
                        ${createField('Punet Aktive', activeJobs.length)}
                        ${createField('Punet Totale', jobs.length)}
                    </div>
                </section>
            </article>
        `;
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="client-profile-empty">${escapeHTML(message)}</p>`;
    }

    async function initPage() {
        const mount = document.querySelector('#client-profile-panel');
        if (!mount) return;

        const data = await ClientPages.loadData();
        ClientPages.fillUser(data.user);
        renderProfile(mount, data);
    }

    initPage().catch((error) => {
        console.warn('Client profile could not load:', error);
        const mount = document.querySelector('#client-profile-panel');
        if (mount) {
            renderEmpty(mount, 'Detajet e klientit nuk u ngarkuan.');
        }
    });
}());
