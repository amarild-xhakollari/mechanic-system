(function () {
    const AUDIT_LOGS_ENDPOINT = '../api/get_audit_logs.php';
    let allLogs = [];
    let searchTerm = '';
    const filters = {
        type: 'all',
        actorRole: 'all',
        time: 'all',
        fromDate: '',
        toDate: ''
    };

    const typeLabels = {
        'log-in': 'Log In',
        'create-user': 'Create User',
        'create-job': 'Create Job',
        'create-client': 'Create Client',
        'create-staff': 'Create Staff',
        'create-vehicle': 'Create Vehicle',
        'create-service': 'Create Service',
        'update-user': 'Update User',
        'update-job': 'Update Job',
        'update-client': 'Update Client',
        'update-staff': 'Update Staff',
        'update-vehicle': 'Update Vehicle',
        'update-service': 'Update Service',
        'delete-user': 'Delete User',
        'delete-job': 'Delete Job',
        'delete-client': 'Delete Client',
        'delete-staff': 'Delete Staff',
        'delete-vehicle': 'Delete Vehicle',
        'delete-service': 'Delete Service',
        default: 'Log'
    };

    function formatDate(value) {
        if (!value) return '';

        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('sq-AL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function normalizeLog(log = {}) {
        return {
            id: log.id ?? log.audit_id ?? '',
            entity: log.entity ?? log.entity_name ?? '',
            entityId: log.entityId ?? log.entity_id ?? '',
            contextLabel: log.contextLabel ?? log.context_label ?? log.entityLabel ?? log.entity_label ?? '',
            targetRole: log.targetRole ?? log.target_role ?? '',
            serviceTitle: log.serviceTitle ?? log.service_title ?? '',
            action: log.action ?? '',
            actor: log.actor ?? log.user_name ?? 'System',
            actorRole: log.actorRole ?? log.actor_role ?? 'User',
            status: log.status ?? 'success',
            date: log.date ?? log.created_at ?? '',
            summary: log.summary ?? ''
        };
    }

    function getLogType(log) {
        const action = String(log.action ?? '').toLowerCase();
        const entity = String(log.entity ?? '').toLowerCase();

        if (action === 'login') {
            return 'log-in';
        }

        const mappedEntityType = {
            users: 'user',
            auth: 'user',
            jobs: 'job',
            job_updates: 'job',
            vehicles: 'vehicle',
            job_services: 'service'
        }[entity];
        let entityType = mappedEntityType ?? (entity.replace(/s$/, '') || 'log');

        if (entityType === 'user' && log.targetRole) {
            entityType = log.targetRole;
        }

        if (action === 'insert') {
            return `create-${entityType}`;
        }

        if (action === 'update') {
            return `update-${entityType}`;
        }

        if (action === 'delete') {
            return `delete-${entityType}`;
        }

        return 'default';
    }

    function toPanelLog(log) {
        const logType = getLogType(log);
        const fallbackContext = getFallbackContext(log);

        return {
            auditId: log.id,
            id: log.contextLabel || fallbackContext,
            type: logType,
            creator: {
                name: log.actor || 'System',
                role: log.actorRole || 'User'
            },
            timestamp: formatDate(log.date),
            description: buildDescription(log, logType)
        };
    }

    function getFallbackContext(log) {
        if (log.entity === 'auth') {
            return 'Login ne sistem';
        }

        if (log.entity === 'jobs' || log.entity === 'job_services') {
            return 'Job: pa targe';
        }

        if (log.entity === 'vehicles') {
            return 'Makina';
        }

        return log.entity || 'Log';
    }

    function buildDescription(log, logType) {
        const actionLabel = typeLabels[logType] ?? typeLabels.default;
        const summary = String(log.summary || '').trim();

        if (logType === 'log-in') {
            if (String(log.status || '').toLowerCase() === 'failed') {
                return summary || 'Tentative login e pasuksesshme.';
            }

            return `${log.actor || 'User'} hyri ne sistem.`;
        }

        if (summary && !/#\d+/.test(summary)) {
            return summary;
        }

        if (log.entity === 'job_services') {
            return log.serviceTitle || `${actionLabel} per ${log.contextLabel || 'nje job'}.`;
        }

        return `${actionLabel} - ${log.contextLabel || log.entity || 'system'}.`;
    }

    function getLogText(log) {
        return [
            log.id,
            log.entity,
            log.entityId,
            log.action,
            log.actor,
            log.actorRole,
            log.status,
            log.contextLabel,
            log.date,
            log.summary
        ].join(' ').toLowerCase();
    }

    function parseLogDate(log) {
        const date = new Date(String(log.date || '').replace(' ', 'T'));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function startOfDay(date) {
        const nextDate = new Date(date);
        nextDate.setHours(0, 0, 0, 0);
        return nextDate;
    }

    function dateInputToDate(value, endOfDay = false) {
        if (!value) return null;

        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return null;

        if (endOfDay) {
            date.setHours(23, 59, 59, 999);
        }

        return date;
    }

    function matchesTimeFilter(log) {
        const logDate = parseLogDate(log);
        if (!logDate) return filters.time === 'all';

        const now = new Date();

        if (filters.time === 'all') {
            return true;
        }

        if (filters.time === 'today') {
            return logDate >= startOfDay(now);
        }

        if (filters.time === '7days') {
            const threshold = new Date(now);
            threshold.setDate(threshold.getDate() - 7);
            return logDate >= threshold;
        }

        if (filters.time === '30days') {
            const threshold = new Date(now);
            threshold.setDate(threshold.getDate() - 30);
            return logDate >= threshold;
        }

        const fromDate = dateInputToDate(filters.fromDate);
        const toDate = dateInputToDate(filters.toDate, true);

        if (fromDate && logDate < fromDate) return false;
        if (toDate && logDate > toDate) return false;

        return true;
    }

    function filterLogs(logs) {
        const value = searchTerm.trim().toLowerCase();
        const normalizedLogs = logs.map((log) => ({
            ...log,
            type: getLogType(log)
        }));

        return normalizedLogs.filter((log) => {
            if (value.length >= 2 && !getLogText(log).includes(value)) {
                return false;
            }

            if (filters.type !== 'all' && log.type !== filters.type) {
                return false;
            }

            if (filters.actorRole !== 'all' && String(log.actorRole || '').toLowerCase() !== filters.actorRole) {
                return false;
            }

            return matchesTimeFilter(log);
        });
    }

    function renderLogs(logs) {
        const panel = document.querySelector('[data-audit-logs-panel]');
        const count = document.querySelector('[data-audit-logs-count]');
        const label = document.querySelector('[data-audit-logs-label]');
        const visibleLogs = filterLogs(logs.map(normalizeLog));

        if (label) {
            label.textContent = hasActiveFilters() ? 'Rezultatet e filtrimit' : 'Aktivitetet e fundit';
        }

        LogsPanel.renderLogs(visibleLogs.map(toPanelLog), panel, {
            emptyMessage: hasActiveFilters() ? 'Nuk u gjet asnje log.' : 'Nuk ka audit logs per momentin.',
            onOpen: (log) => {
                window.location.href = `audit-log-details.html?audit_id=${encodeURIComponent(log.auditId)}`;
            }
        });

        if (count) {
            count.textContent = `${visibleLogs.length} logs ne total`;
        }
    }

    function hasActiveFilters() {
        return searchTerm.trim().length >= 2
            || filters.type !== 'all'
            || filters.actorRole !== 'all'
            || filters.time !== 'all'
            || filters.fromDate
            || filters.toDate;
    }

    function populateTypeFilter(logs) {
        const typeSelect = document.querySelector('[data-audit-filter="type"]');
        if (!typeSelect) return;

        const existingTypes = new Set(logs.map((log) => getLogType(normalizeLog(log))));
        typeSelect.innerHTML = '<option value="all">Te gjitha</option>';

        [...existingTypes]
            .sort((a, b) => (typeLabels[a] ?? a).localeCompare(typeLabels[b] ?? b))
            .forEach((type) => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = typeLabels[type] ?? type;
                typeSelect.appendChild(option);
            });
    }

    function bindFilters() {
        document.querySelectorAll('[data-audit-filter]').forEach((control) => {
            control.addEventListener('change', () => {
                filters[control.dataset.auditFilter] = control.value;

                if (control.dataset.auditFilter === 'time' && control.value !== 'range') {
                    filters.fromDate = '';
                    filters.toDate = '';
                    document.querySelector('[data-audit-filter="fromDate"]').value = '';
                    document.querySelector('[data-audit-filter="toDate"]').value = '';
                }

                if (control.dataset.auditFilter === 'fromDate' || control.dataset.auditFilter === 'toDate') {
                    filters.time = 'range';
                    const timeSelect = document.querySelector('[data-audit-filter="time"]');
                    if (timeSelect) timeSelect.value = 'range';
                }

                renderLogs(allLogs);
            });
        });

        document.querySelector('[data-clear-audit-filters]')?.addEventListener('click', () => {
            filters.type = 'all';
            filters.actorRole = 'all';
            filters.time = 'all';
            filters.fromDate = '';
            filters.toDate = '';

            document.querySelectorAll('[data-audit-filter]').forEach((control) => {
                control.value = control.tagName === 'SELECT' ? 'all' : '';
            });

            renderLogs(allLogs);
        });

        document.querySelector('[data-export-logs]')?.addEventListener('click', () => {
            if (!window.ExportLogsPopup) {
                window.location.href = '../api/export_audit_logs.php';
                return;
            }

            window.ExportLogsPopup.open({
                onExport: () => {
                    window.location.href = '../api/export_audit_logs.php';
                }
            });
        });
    }

    async function fetchAuditLogs() {
        const response = await fetch(AUDIT_LOGS_ENDPOINT, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.replace('/mechanic-system/public/staff-page.html');
            throw new Error('Admin access required');
        }

        if (!response.ok) {
            throw new Error(`Audit logs API failed with ${response.status}`);
        }

        return response.json();
    }

    AdminPages.loadPage(async () => {
        createSearchBar(document.querySelector('#audit-logs-search'), {
            placeholder: 'Kerko audit logs',
            onSearch: (query) => {
                searchTerm = query;
                renderLogs(allLogs);
            }
        });
        bindFilters();

        try {
            const data = await fetchAuditLogs();
            allLogs = Array.isArray(data.logs) ? data.logs : [];
            populateTypeFilter(allLogs);
            renderLogs(allLogs);
        } catch (error) {
            console.warn('Audit logs could not be loaded:', error);
            AdminPages.showToast('Audit logs nuk u ngarkuan');
            renderLogs([]);
        }
    });
}());
