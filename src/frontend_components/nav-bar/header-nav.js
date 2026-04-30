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

    function createHeaderNav(container, data = {}) {
        if (!container) {
            return null;
        }

        const navItems = data.navItems ?? [
            { id: 'home', text: data.brandText ?? 'Faqja Kryesore', content: '' },
            { id: 'jobs', text: 'Punët', content: '' },
            { id: 'staff', text: 'Staff', content: '' },
            { id: 'clients', text: 'Klientet', content: '' }
        ];
        const user = data.user ?? {};
        const dashboardTarget = typeof data.dashboardTarget === 'string'
            ? document.querySelector(data.dashboardTarget)
            : data.dashboardTarget;
        let activeId = data.activeId ?? navItems[0]?.id;

        function getActiveItem() {
            return navItems.find((item) => item.id === activeId) ?? navItems[0];
        }

        function updateDashboard(item) {
            if (!dashboardTarget || !item) {
                return;
            }

            dashboardTarget.innerHTML = item.content || `
                <h1>${escapeHTML(item.text)}</h1>
                <p>${escapeHTML(item.text)} dashboard content.</p>
            `;
        }

        function setActiveItem(id) {
            activeId = id;
            const activeItem = getActiveItem();

            container.querySelectorAll('.header-nav__menu-button').forEach((button) => {
                const isActive = button.dataset.navId === activeItem.id;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-current', isActive ? 'page' : 'false');
            });

            updateDashboard(activeItem);
            container.dispatchEvent(new CustomEvent('header-nav:change', {
                bubbles: true,
                detail: { item: activeItem }
            }));

            if (typeof data.onChange === 'function') {
                data.onChange(activeItem);
            }
        }

        container.innerHTML = `
            <div class="header-nav__container">
                <nav class="header-nav__left" aria-label="Main navigation">
                    <ul class="header-nav__menu">
                        ${navItems.map((item) => `
                            <li>
                                <button
                                    class="header-nav__menu-button"
                                    type="button"
                                    data-nav-id="${escapeHTML(item.id)}"
                                    aria-current="false"
                                >
                                    ${escapeHTML(item.text)}
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </nav>

                <div class="header-nav__actions">
                    <button class="header-nav__notification" type="button" aria-label="Notifications">
                        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                            <path d="M16 37h16M20 40.5c.9 1.6 2.2 2.5 4 2.5s3.1-.9 4-2.5M11.5 36.5c3-2.8 4.1-5.1 4.1-10.8v-4.2c0-5.1 3.7-9.7 8.4-9.7s8.4 4.6 8.4 9.7v4.2c0 5.7 1.1 8 4.1 10.8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        ${Number(data.notificationCount) > 0 ? `<span class="header-nav__notification-badge">${escapeHTML(data.notificationCount)}</span>` : ''}
                    </button>
                    <span class="header-nav__divider" aria-hidden="true"></span>
                    <div class="header-nav__profile">
                        <button class="header-nav__profile-button" type="button" aria-expanded="${data.profileOpen ? 'true' : 'false'}">
                            <span>Profili</span>
                            <svg class="header-nav__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 15l7-7 7 7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                        <div class="header-nav__dropdown${data.profileOpen ? ' is-open' : ''}" role="menu">
                            <p class="header-nav__user-name">${escapeHTML(user.name ?? 'User Name')}</p>
                            <p class="header-nav__user-role">${escapeHTML(user.role ?? 'Administrator')}</p>
                            <button class="header-nav__logout" type="button" role="menuitem">${escapeHTML(user.logoutText ?? 'Dil nga llogaria')}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const notificationButton = container.querySelector('.header-nav__notification');
        const profileButton = container.querySelector('.header-nav__profile-button');
        const dropdown = container.querySelector('.header-nav__dropdown');

        container.querySelectorAll('.header-nav__menu-button').forEach((button) => {
            button.addEventListener('click', () => setActiveItem(button.dataset.navId));
        });

        notificationButton.addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('header-nav:notification', { bubbles: true }));
            if (typeof data.onNotification === 'function') {
                data.onNotification();
            }
        });

        profileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = dropdown.classList.toggle('is-open');
            profileButton.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!container.contains(event.target)) {
                dropdown.classList.remove('is-open');
                profileButton.setAttribute('aria-expanded', 'false');
            }
        });

        container.querySelector('.header-nav__logout').addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('header-nav:logout', { bubbles: true }));
            if (typeof data.onLogout === 'function') {
                data.onLogout();
            }
        });

        setActiveItem(activeId);
        return {
            setActive: setActiveItem,
            getActive: getActiveItem
        };
    }

    window.createHeaderNav = createHeaderNav;
}());
