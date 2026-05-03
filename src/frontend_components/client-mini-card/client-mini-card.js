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

    const CLIENT_ICON_SRC = '../../images/default-icons/client-icon.png';

    function createClientMiniCard(container, data = {}, onClick) {
        if (!container) {
            return null;
        }

        container.classList.add('client-mini-card');
        container.dataset.clientId = data.id ?? '';
        container.innerHTML = `
            <div class="client-mini-card__header">
                <div class="client-mini-card__avatar">
                    <img src="${CLIENT_ICON_SRC}" alt="" aria-hidden="true">
                </div>
                <div class="client-mini-card__identity">
                    <h2 class="client-mini-card__name">${escapeHTML(data.name ?? '')}</h2>
                    <p class="client-mini-card__code">${escapeHTML(data.code ?? '')}</p>
                </div>
                <svg class="client-mini-card__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="client-mini-card__divider"></div>
            <p class="client-mini-card__phone">${escapeHTML(data.phone ?? '')}</p>
        `;

        container.tabIndex = 0;
        container.setAttribute('role', 'button');
        container.setAttribute('aria-label', `Hap klientin ${data.name ?? ''}`);

        function selectClient() {
            if (typeof onClick === 'function') {
                onClick(data);
            }
        }

        container.addEventListener('click', selectClient);
        container.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectClient();
            }
        });

        return container;
    }

    window.createClientMiniCard = createClientMiniCard;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createClientMiniCard };
    }
}());
