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

    function normalizeTags(data) {
        return Array.isArray(data.tags) ? data.tags : [];
    }

    function isHexColor(value) {
        return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(value ?? ''));
    }

    function createStaffCard(container, data = {}, onClick) {
        if (!container) {
            return null;
        }

        const member = {
            id: data.id ?? '',
            name: data.name ?? '',
            tags: normalizeTags(data),
            iconBg: isHexColor(data.iconBg) ? data.iconBg : '#f8b7ba',
            iconColor: isHexColor(data.iconColor) ? data.iconColor : '#ec2a2f'
        };

        container.classList.add('staff-card');
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `Open staff member ${member.name}`.trim());
        container.style.setProperty('--staff-icon-bg', member.iconBg);
        container.style.setProperty('--staff-icon-color', member.iconColor);

        container.innerHTML = `
            <span class="staff-card__icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" focusable="false">
                    <path d="M51.5 8.8 44 16.3l-5.1-5.1 7.5-7.5c-6.3-1.5-13.2.2-18.1 5.1-5.7 5.7-6.9 14.2-3.7 21.1L6.5 48c-2.4 2.4-2.4 6.3 0 8.7s6.3 2.4 8.7 0l18.1-18.1c6.9 3.2 15.4 2 21.1-3.7 4.9-4.9 6.6-11.8 5.1-18.1l-7.5 7.5-5.1-5.1 7.5-7.5c-.8-1.1-1.7-2.1-2.9-2.9Z"></path>
                    <path d="M11.6 51.1 28.8 34" opacity=".45"></path>
                </svg>
            </span>
            <p class="staff-card__name">${escapeHTML(member.name)}</p>
            <span class="staff-card__divider" aria-hidden="true"></span>
            <span class="staff-card__tags">
                ${member.tags.map((tag) => `<span class="staff-card__tag">${escapeHTML(tag)}</span>`).join('')}
            </span>
            <svg class="staff-card__arrow" viewBox="0 0 24 40" fill="none" aria-hidden="true">
                <path d="M6 4l13 16L6 36" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        `;

        function selectMember() {
            container.dispatchEvent(new CustomEvent('staff-card:select', {
                bubbles: true,
                detail: { staff: member }
            }));

            if (typeof onClick === 'function') {
                onClick(member);
            }
        }

        container.onclick = selectMember;
        container.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectMember();
            }
        };

        return container;
    }

    function createStaffPanel(container, data = {}) {
        if (!container) {
            return null;
        }

        const staff = Array.isArray(data.staff) ? data.staff : [];

        container.classList.add('staff-panel');
        container.innerHTML = `
            <div class="staff-panel__header">
                <div>
                    <h2 class="staff-panel__title">${escapeHTML(data.title ?? 'Staff')}</h2>
                    <p class="staff-panel__subtitle">${escapeHTML(data.subtitle ?? 'Shikoni anëtarët e stafit')}</p>
                </div>
                <button class="staff-panel__action" type="button">
                    <span>${escapeHTML(data.actionText ?? 'Anëtarët e stafit')}</span>
                    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                        <path d="M15 8H32V25" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M31 9 11 29" stroke-width="3.3" stroke-linecap="round"></path>
                        <path d="M28 30H8V10" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </button>
            </div>
            <div class="staff-panel__list"></div>
        `;

        const list = container.querySelector('.staff-panel__list');
        staff.forEach((member) => {
            const card = document.createElement('article');
            list.appendChild(card);
            createStaffCard(card, member, data.onStaffClick);
        });

        container.querySelector('.staff-panel__action').onclick = () => {
            container.dispatchEvent(new CustomEvent('staff-panel:action', { bubbles: true }));
            if (typeof data.onAction === 'function') {
                data.onAction();
            }
        };

        return container;
    }

    window.createStaffCard = createStaffCard;
    window.createStaffPanel = createStaffPanel;
}());
