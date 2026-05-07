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

    function normalizeItems(items) {
        return Array.isArray(items) && items.length > 0
            ? items
            : [
                { id: 'home', text: 'Faqja Kryesore' },
                { id: 'active', text: 'Punët Aktive' },
                { id: 'completed', text: 'Punët e Kompletuara' },
                { id: 'clients', text: 'Klientët' }
            ];
    }

    function createStaffNavbar(container, options = {}) {
        if (!container) {
            return null;
        }

        const items = normalizeItems(options.items);
        let activeId = options.activeId ?? items[0].id;
        let notificationCount = Number(options.notificationCount ?? 0);
        const profileItems = Array.isArray(options.profileItems) && options.profileItems.length > 0
            ? options.profileItems
            : [
                { id: 'profile', text: options.profileLabel ?? 'Profili' },
                { id: 'logout', text: options.logoutText ?? 'Dil nga llogaria' }
            ];

        container.classList.add('staff-navbar');
        container.innerHTML = `
            <div class="staff-navbar__inner">
                <nav class="staff-navbar__nav" aria-label="${escapeHTML(options.ariaLabel ?? 'Staff navigation')}">
                    <ul class="staff-navbar__menu">
                        ${items.map((item) => `
                            <li>
                                <button
                                    class="staff-navbar__tab"
                                    type="button"
                                    data-staff-nav-id="${escapeHTML(item.id)}"
                                    aria-current="false"
                                >
                                    ${escapeHTML(item.text)}
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </nav>

                <div class="staff-navbar__actions">
                    <button class="staff-navbar__notification" type="button" aria-label="${escapeHTML(options.notificationLabel ?? 'Njoftimet')}">
                        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                            <path d="M16 37h16M20 40.5c.9 1.6 2.2 2.5 4 2.5s3.1-.9 4-2.5M11.5 36.5c3-2.8 4.1-5.1 4.1-10.8v-4.2c0-5.1 3.7-9.7 8.4-9.7s8.4 4.6 8.4 9.7v4.2c0 5.7 1.1 8 4.1 10.8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                    <span class="staff-navbar__divider" aria-hidden="true"></span>
                    <div class="staff-navbar__profile">
                        <button class="staff-navbar__profile-button" type="button" aria-expanded="false">
                            <span>${escapeHTML(options.profileLabel ?? 'Profili')}</span>
                            <svg class="staff-navbar__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M6 9l6 6 6-6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                        <div class="staff-navbar__profile-menu" role="menu">
                            ${profileItems.map((item) => `
                                <button type="button" role="menuitem" data-profile-action="${escapeHTML(item.id)}">
                                    ${escapeHTML(item.text)}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const notificationButton = container.querySelector('.staff-navbar__notification');
        const profileButton = container.querySelector('.staff-navbar__profile-button');
        const profileMenu = container.querySelector('.staff-navbar__profile-menu');

        function getActiveItem() {
            return items.find((item) => item.id === activeId) ?? items[0];
        }

        function setActive(id) {
            const nextItem = items.find((item) => item.id === id) ?? items[0];
            activeId = nextItem.id;

            container.querySelectorAll('.staff-navbar__tab').forEach((button) => {
                const isActive = button.dataset.staffNavId === activeId;
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-current', isActive ? 'page' : 'false');
            });

            container.dispatchEvent(new CustomEvent('staff-navbar:change', {
                bubbles: true,
                detail: { item: nextItem }
            }));

            if (typeof options.onChange === 'function') {
                options.onChange(nextItem);
            }
        }

        function setNotificationCount(count) {
            notificationCount = Math.max(0, Number(count) || 0);
            const existingBadge = notificationButton.querySelector('.staff-navbar__badge');

            if (existingBadge) {
                existingBadge.remove();
            }

            if (notificationCount > 0) {
                const badge = document.createElement('span');
                badge.className = 'staff-navbar__badge';
                badge.textContent = String(notificationCount);
                notificationButton.appendChild(badge);
            }
        }

        function closeProfileMenu() {
            profileMenu.classList.remove('is-open');
            profileButton.setAttribute('aria-expanded', 'false');
        }

        container.querySelectorAll('.staff-navbar__tab').forEach((button) => {
            button.addEventListener('click', () => setActive(button.dataset.staffNavId));
        });

        notificationButton.addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('staff-navbar:notification', { bubbles: true }));
            if (typeof options.onNotification === 'function') {
                options.onNotification();
            }
        });

        profileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = profileMenu.classList.toggle('is-open');
            profileButton.setAttribute('aria-expanded', String(isOpen));
        });

        profileMenu.querySelectorAll('[data-profile-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.profileAction;
                closeProfileMenu();
                container.dispatchEvent(new CustomEvent('staff-navbar:profile-action', {
                    bubbles: true,
                    detail: { action }
                }));

                if (typeof options.onProfileAction === 'function') {
                    options.onProfileAction(action);
                }
            });
        });

        document.addEventListener('click', (event) => {
            if (!container.contains(event.target)) {
                closeProfileMenu();
            }
        });

        setActive(activeId);
        setNotificationCount(notificationCount);

        return {
            setActive,
            getActive: getActiveItem,
            setNotificationCount,
            closeProfileMenu
        };
    }

    window.createStaffNavbar = createStaffNavbar;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createStaffNavbar };
    }
}());