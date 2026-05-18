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

    function getAuditId() {
        return new URLSearchParams(window.location.search).get('audit_id');
    }

    function formatDate(value) {
        if (!value) return '-';

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

    function formatJson(value) {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        if (typeof value === 'string') {
            return value;
        }

        return JSON.stringify(value, null, 2);
    }

    function getActionLabel(action) {
        return {
            insert: 'Create',
            update: 'Update',
            delete: 'Delete',
            login: 'Login'
        }[String(action || '').toLowerCase()] ?? (action || 'Log');
    }

    function getEntityLabel(entityType) {
        return {
            auth: 'Hyrje ne sistem',
            jobs: 'Pune',
            job: 'Pune',
            job_services: 'Sherbim',
            service: 'Sherbim',
            users: 'Perdorues',
            user: 'Perdorues',
            client: 'Klient',
            staff: 'Staf',
            admin: 'Admin',
            vehicles: 'Makine',
            vehicle: 'Makine',
            actor: 'Aktori',
            system: 'Sistem'
        }[entityType] ?? (entityType || 'Log');
    }

    function getRoleLabel(role) {
        return {
            admin: 'Admin',
            staff: 'Staf',
            client: 'Klient',
            system: 'Sistem'
        }[String(role || '').toLowerCase()] ?? (role || '-');
    }

    function getStatusLabel(status) {
        return {
            success: 'Sukses',
            failed: 'Deshtoi'
        }[String(status || '').toLowerCase()] ?? (status || '-');
    }

    function field(label, value) {
        return `
            <div class="job-specification-panel__field">
                <p class="job-specification-panel__label">${escapeHTML(label)}</p>
                <p class="job-specification-panel__value">${escapeHTML(value || '-')}</p>
            </div>
        `;
    }

    function section(title, content) {
        return `
            <section class="job-specification-panel__section">
                <h2 class="job-specification-panel__section-title">${escapeHTML(title)}</h2>
                ${content}
            </section>
        `;
    }

    function jsonBlock(label, value) {
        return section(label, `<pre class="audit-log-details__json">${escapeHTML(formatJson(value))}</pre>`);
    }

    function getStatusClass(status) {
        return String(status || 'success').toLowerCase() === 'failed' ? 'failed' : 'success';
    }

    function relatedEntitiesSection(entities = []) {
        if (!Array.isArray(entities) || entities.length === 0) {
            return section('Entitetet e lidhura', '<p class="job-specification-panel__empty">Nuk ka entitete te lidhura per kete log.</p>');
        }

        return section('Entitetet e lidhura', `
            <div class="audit-log-related-grid" data-related-entities></div>
        `);
    }

    function openRelatedEntity(entity) {
        if (entity?.href) {
            window.location.href = entity.href;
        }
    }

    function createFallbackRelatedCard(entity) {
        const card = document.createElement(entity.href ? 'button' : 'article');
        card.className = 'audit-log-related-fallback';
        if (entity.href) {
            card.type = 'button';
            card.addEventListener('click', () => openRelatedEntity(entity));
        }
        card.innerHTML = `
            <span>${escapeHTML(entity.label || getEntityLabel(entity.type))}</span>
            <strong>${escapeHTML(entity.title || 'Entitet')}</strong>
            <small>${escapeHTML(entity.subtitle || entity.meta || 'I lidhur me audit log')}</small>
        `;
        return card;
    }

    function createRelatedEntityCard(entity) {
        const type = String(entity.type || '').toLowerCase();
        const data = entity.data || {};
        const wrapper = document.createElement('article');
        wrapper.className = 'audit-log-related-card-shell';

        if (type === 'job' && typeof window.createJobCard === 'function') {
            const normalizedJob = AdminPages.normalizeJob({
                ...data,
                code: data.code || data.plate_number || entity.title,
                client: data.client || data.client_name || entity.subtitle,
                mechanics: Array.isArray(data.mechanics) ? data.mechanics : [],
                status: data.status || entity.meta,
                updated_at: data.updated_at,
                dateLabel: entity.label || getEntityLabel(type)
            });
            createJobCard(wrapper, normalizedJob);
            if (entity.href) {
                wrapper.tabIndex = 0;
                wrapper.setAttribute('role', 'button');
                wrapper.addEventListener('click', () => openRelatedEntity(entity));
                wrapper.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    openRelatedEntity(entity);
                });
            }
            return wrapper;
        }

        if (type === 'staff' && typeof window.createStaffCard === 'function') {
            createStaffCard(wrapper, AdminPages.normalizeStaff({
                ...data,
                name: data.name || entity.title,
                tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : [entity.subtitle, entity.meta].filter(Boolean)
            }), () => openRelatedEntity(entity));
            return wrapper;
        }

        if (type === 'client' && typeof window.createClientMiniCard === 'function') {
            createClientMiniCard(wrapper, AdminPages.normalizeClient({
                ...data,
                name: data.name || entity.title,
                code: data.code || entity.subtitle,
                phone: data.phone || entity.meta || ''
            }), () => openRelatedEntity(entity));
            return wrapper;
        }

        if (type === 'service' && typeof window.createServiceCard === 'function') {
            createServiceCard(wrapper, {
                ...data,
                title: data.title || entity.title,
                description: data.description || entity.subtitle || entity.meta
            });
            return wrapper;
        }

        return createFallbackRelatedCard(entity);
    }

    function renderRelatedEntities(mount, entities = []) {
        const grid = mount.querySelector('[data-related-entities]');
        if (!grid || !Array.isArray(entities)) return;

        grid.innerHTML = '';
        entities.forEach((entity) => {
            grid.appendChild(createRelatedEntityCard(entity));
        });
    }

    function renderDetails(mount, log) {
        const entity = log.entity ?? {};
        const actor = log.actor ?? {};
        const request = log.request ?? {};

        const statusClass = getStatusClass(log.status);
        const actionLabel = getActionLabel(log.action);
        const entityLabel = entity.display_type || getEntityLabel(entity.type);

        mount.innerHTML = `
            <article class="job-specification-panel audit-log-details">
                <div class="job-specification-panel__panel-top">
                    <h2 class="job-specification-panel__section-title">Audit Log</h2>
                </div>
                <div class="job-specification-panel__topline">
                    <span>Detajet e audit log</span>
                </div>

                <header class="job-specification-panel__header">
                    <div class="job-specification-panel__identity">
                        <div class="audit-log-details__icon" aria-hidden="true">
                            <span>${escapeHTML(actionLabel.slice(0, 1).toUpperCase())}</span>
                        </div>
                        <div>
                            <h1 class="job-specification-panel__plate">${escapeHTML(actionLabel)} ${escapeHTML(entityLabel)}</h1>
                            <p class="job-specification-panel__client-name">${escapeHTML(entity.label || 'Audit log')}</p>
                        </div>
                    </div>
                    <span class="audit-log-details__status audit-log-details__status--${statusClass}">${escapeHTML(getStatusLabel(log.status || 'success'))}</span>
                </header>

                <p class="audit-log-details__description">${escapeHTML(log.description || 'Nuk ka pershkrim per kete log.')}</p>

                ${section('Informacion Kryesor', `
                    <div class="job-specification-panel__field-grid">
                        ${field('Koha', formatDate(log.created_at))}
                        ${field('Veprimi', actionLabel)}
                        ${field('Entiteti', entityLabel)}
                        ${field('Pershkrimi', entity.label)}
                        ${field('Status', getStatusLabel(log.status))}
                    </div>
                `)}

                ${section('Aktori', `
                    <div class="job-specification-panel__field-grid">
                        ${field('Emri', actor.name)}
                        ${field('Roli', getRoleLabel(actor.role))}
                        ${field('Email', actor.email)}
                        ${field('Telefon', actor.phone)}
                    </div>
                `)}

                ${relatedEntitiesSection(log.related_entities)}

                ${section('Kerkesa', `
                    <div class="job-specification-panel__field-grid">
                        ${field('Method', request.method)}
                        ${field('Path', request.path)}
                        ${field('IP Address', request.ip_address)}
                        ${field('Session Hash', request.session_id_hash)}
                    </div>
                    <div class="audit-log-details__field audit-log-details__field--wide">
                        <span>User Agent</span>
                        <strong>${escapeHTML(request.user_agent || '-')}</strong>
                    </div>
                `)}

                ${jsonBlock('Fushat e ndryshuara', log.changed_fields)}
                ${jsonBlock('Vlerat e vjetra', log.old_values)}
                ${jsonBlock('Vlerat e reja', log.new_values)}

                ${log.error_message ? `
                    ${section('Error', `
                        <p class="audit-log-details__error">${escapeHTML(log.error_message)}</p>
                    `)}
                ` : ''}
            </article>
        `;

        renderRelatedEntities(mount, log.related_entities);
    }

    async function fetchAuditLogDetails(auditId) {
        const response = await fetch(`../api/get_audit_log_details.php?audit_id=${encodeURIComponent(auditId)}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.replace('/mechanic-system/public/staff-page.html');
            throw new Error('Admin access required');
        }

        if (!response.ok) {
            throw new Error(`Audit log details API failed with ${response.status}`);
        }

        return response.json();
    }

    AdminPages.loadPage(async () => {
        const mount = document.querySelector('#audit-log-details-panel');
        createGoBackButton(document.querySelector('#audit-log-details-back'), {
            fallbackHref: 'admin-audit-logs.html'
        });

        const auditId = getAuditId();

        if (!auditId) {
            AdminPages.renderEmpty(mount, 'Mungon ID e audit log.');
            return;
        }

        mount.innerHTML = '<p class="empty-state">Duke ngarkuar detajet...</p>';

        try {
            const payload = await fetchAuditLogDetails(auditId);

            if (!payload.success) {
                AdminPages.renderEmpty(mount, payload.message || 'Audit log nuk u gjet.');
                return;
            }

            renderDetails(mount, payload.log);
        } catch (error) {
            console.warn('Audit log details could not be loaded:', error);
            AdminPages.renderEmpty(mount, 'Detajet e audit log nuk u ngarkuan.');
        }
    });
}());
