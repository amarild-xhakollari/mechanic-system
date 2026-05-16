(function () {
    const logTypeConfig = {
        'log-in': { label: 'Log In', className: 'type-log-in' },
        'create-user': { label: 'Create User', className: 'type-create' },
        'create-job': { label: 'Create Job', className: 'type-create' },
        'create-client': { label: 'Create Client', className: 'type-create' },
        'create-staff': { label: 'Create Staff', className: 'type-create' },
        'create-vehicle': { label: 'Create Vehicle', className: 'type-create' },
        'create-service': { label: 'Create Service', className: 'type-create' },
        'update-user': { label: 'Update User', className: 'type-update' },
        'update-job': { label: 'Update Job', className: 'type-update' },
        'update-client': { label: 'Update Client', className: 'type-update' },
        'update-staff': { label: 'Update Staff', className: 'type-update' },
        'update-vehicle': { label: 'Update Vehicle', className: 'type-update' },
        'update-service': { label: 'Update Service', className: 'type-update' },
        'delete-user': { label: 'Delete User', className: 'type-delete' },
        'delete-job': { label: 'Delete Job', className: 'type-delete' },
        'delete-client': { label: 'Delete Client', className: 'type-delete' },
        'delete-staff': { label: 'Delete Staff', className: 'type-delete' },
        'delete-vehicle': { label: 'Delete Vehicle', className: 'type-delete' },
        'delete-service': { label: 'Delete Service', className: 'type-delete' },
        default: { label: 'Log', className: 'type-default' }
    };

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function getConfig(type) {
        return logTypeConfig[type] ?? logTypeConfig.default;
    }

    function getBadgeClass(type) {
        const className = getConfig(type).className;

        return {
            'type-log-in': 'audit-card__badge--login',
            'type-create': 'audit-card__badge--create',
            'type-update': 'audit-card__badge--update',
            'type-delete': 'audit-card__badge--delete',
            'type-default': 'audit-card__badge--default'
        }[className] ?? 'audit-card__badge--default';
    }

    function createLogCard(log, options = {}) {
        const config = getConfig(log.type);
        return AuditCard.createAuditCard({
            ...log,
            typeLabel: config.label,
            badgeClass: getBadgeClass(log.type)
        }, options);
    }

    function renderEmpty(logsList, message) {
        logsList.innerHTML = `<p class="logs-panel__empty">${escapeHTML(message)}</p>`;
    }

    function renderLogs(logsData, target, options = {}) {
        const panel = target instanceof Element ? target : document.querySelector('[data-audit-logs-panel]');
        const logsList = panel?.querySelector('[data-logs-list]');

        if (!logsList) {
            return;
        }

        logsList.innerHTML = '';

        if (!Array.isArray(logsData) || logsData.length === 0) {
            renderEmpty(logsList, options.emptyMessage ?? 'Nuk ka audit logs per momentin.');
            return;
        }

        logsData.forEach((log) => {
            logsList.appendChild(createLogCard(log, options));
        });
    }

    window.LogsPanel = {
        renderLogs,
        createLogCard
    };
}());
