(function () {
    const AUDIT_LOGS_ENDPOINT = '../api/get_audit_logs.php';
    const PAGE_SIZE = 25;
    let loadedLogs = [];
    let currentPage = 0;
    let totalLogs = 0;
    let hasMoreLogs = true;
    let isLoadingLogs = false;
    let requestToken = 0;
    let searchTimer = null;
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
            summary: log.summary ?? '',
            type: log.type ?? ''
        };
    }

    function getLogType(log) {
        const action = String(log.action ?? '').toLowerCase();
        const entity = String(log.entity ?? '').toLowerCase();

        if (log.type) {
            return log.type;
        }

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

    function updateCount() {
        const count = document.querySelector('[data-audit-logs-count]');
        if (!count) return;

        if (totalLogs === 0) {
            count.textContent = '0 logs ne total';
            return;
        }

        count.textContent = `${loadedLogs.length} nga ${totalLogs} logs`;
    }

    function renderLogs(logs, append = false) {
        const panel = document.querySelector('[data-audit-logs-panel]');
        const label = document.querySelector('[data-audit-logs-label]');
        const normalizedLogs = logs.map(normalizeLog);

        if (label) {
            label.textContent = hasActiveFilters() ? 'Rezultatet e filtrimit' : 'Aktivitetet e fundit';
        }

        const options = {
            emptyMessage: hasActiveFilters() ? 'Nuk u gjet asnje log.' : 'Nuk ka audit logs per momentin.',
            onOpen: (log) => {
                window.location.href = `audit-log-details.html?audit_id=${encodeURIComponent(log.auditId)}`;
            }
        };

        if (append && typeof LogsPanel.appendLogs === 'function') {
            LogsPanel.appendLogs(normalizedLogs.map(toPanelLog), panel, options);
        } else {
            LogsPanel.renderLogs(normalizedLogs.map(toPanelLog), panel, options);
        }

        updateCount();
    }

    function hasActiveFilters() {
        return searchTerm.trim().length >= 2
            || filters.type !== 'all'
            || filters.actorRole !== 'all'
            || filters.time !== 'all'
            || filters.fromDate
            || filters.toDate;
    }

    function buildFilterParams() {
        const params = new URLSearchParams();
        const value = searchTerm.trim();

        if (value.length >= 2) {
            params.set('q', value);
        }

        if (filters.type !== 'all') {
            params.set('type', filters.type);
        }

        if (filters.actorRole !== 'all') {
            params.set('actorRole', filters.actorRole);
        }

        if (filters.time !== 'all') {
            params.set('time', filters.time);
        }

        if (filters.fromDate) {
            params.set('fromDate', filters.fromDate);
        }

        if (filters.toDate) {
            params.set('toDate', filters.toDate);
        }

        return params;
    }

    function buildExportUrl() {
        const params = buildFilterParams();
        const query = params.toString();
        return query ? `../api/export_audit_logs.php?${query}` : '../api/export_audit_logs.php';
    }

    function buildLogsUrl(page) {
        const params = buildFilterParams();
        params.set('page', String(page));
        params.set('perPage', String(PAGE_SIZE));

        return `${AUDIT_LOGS_ENDPOINT}?${params.toString()}`;
    }

    function populateTypeFilter(types = []) {
        const typeSelect = document.querySelector('[data-audit-filter="type"]');
        if (!typeSelect) return;

        const selectedType = typeSelect.value;
        typeSelect.innerHTML = '<option value="all">Te gjitha</option>';

        [...new Set(types)]
            .sort((a, b) => (typeLabels[a] ?? a).localeCompare(typeLabels[b] ?? b))
            .forEach((type) => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = typeLabels[type] ?? type;
                typeSelect.appendChild(option);
            });

        if ([...typeSelect.options].some((option) => option.value === selectedType)) {
            typeSelect.value = selectedType;
        }
    }

    async function fetchAuditLogs(page) {
        const response = await fetch(buildLogsUrl(page), {
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

    async function loadLogsPage(page = 1, append = false) {
        if (append && (isLoadingLogs || !hasMoreLogs)) {
            return;
        }

        const token = append ? requestToken : ++requestToken;
        isLoadingLogs = true;

        try {
            const data = await fetchAuditLogs(page);
            if (token !== requestToken) {
                return;
            }

            const nextLogs = Array.isArray(data.logs) ? data.logs : [];
            const pagination = data.pagination || {};

            currentPage = Number(pagination.page || page);
            totalLogs = Number(pagination.total || 0);
            hasMoreLogs = Boolean(pagination.hasMore);

            if (Array.isArray(data.availableTypes)) {
                populateTypeFilter(data.availableTypes);
            }

            loadedLogs = append ? [...loadedLogs, ...nextLogs] : nextLogs;
            renderLogs(nextLogs, append);
            if (hasMoreLogs) {
                setTimeout(maybeLoadMoreLogs, 0);
            }
        } catch (error) {
            if (token !== requestToken) {
                return;
            }

            console.warn('Audit logs could not be loaded:', error);
            AdminPages.showToast('Audit logs nuk u ngarkuan');
            if (!append) {
                loadedLogs = [];
                totalLogs = 0;
                hasMoreLogs = false;
                renderLogs([]);
            }
        } finally {
            if (token === requestToken) {
                isLoadingLogs = false;
            }
        }
    }

    function resetAndLoadLogs() {
        loadedLogs = [];
        currentPage = 0;
        totalLogs = 0;
        hasMoreLogs = true;
        loadLogsPage(1, false);
    }

    function maybeLoadMoreLogs() {
        const scroll = document.querySelector('.audit-logs-page-panel__scroll');
        if (!scroll || isLoadingLogs || !hasMoreLogs) return;

        const distanceFromBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight;
        if (distanceFromBottom <= 160) {
            loadLogsPage(currentPage + 1, true);
        }
    }

    function bindInfiniteScroll() {
        const scroll = document.querySelector('.audit-logs-page-panel__scroll');
        if (!scroll) return;

        scroll.addEventListener('scroll', maybeLoadMoreLogs, { passive: true });
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

                resetAndLoadLogs();
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

            resetAndLoadLogs();
        });

        document.querySelector('[data-export-logs]')?.addEventListener('click', () => {
            const exportUrl = buildExportUrl();

            if (!window.ExportLogsPopup) {
                window.location.href = exportUrl;
                return;
            }

            window.ExportLogsPopup.open({
                onExport: () => {
                    window.location.href = exportUrl;
                }
            });
        });
    }

    AdminPages.loadPage(async () => {
        createSearchBar(document.querySelector('#audit-logs-search'), {
            placeholder: 'Kerko audit logs',
            onSearch: (query) => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    searchTerm = query;
                    resetAndLoadLogs();
                }, 250);
            }
        });
        bindFilters();
        bindInfiniteScroll();
        resetAndLoadLogs();
    });
}());
