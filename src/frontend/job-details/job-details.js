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

    function normalizeStaff(job) {
        const staff = Array.isArray(job.staff) ? job.staff : [];
        return staff.length > 0 ? staff : ['Emri Mekanikut 1', 'Emri Mekanikut 2'];
    }

    function normalizeServices(job) {
        const services = Array.isArray(job.services) ? job.services : [];

        if (services.length > 0) {
            return services.map((service, index) => ({
                id: service.id ?? index + 1,
                name: service.name ?? service.title ?? 'Sherbim',
                completed: Boolean(service.completed)
            }));
        }

        return [
            { id: 'service-1', name: 'Servisim periodik', completed: false },
            { id: 'service-2', name: 'Kontroll automjeti', completed: false }
        ];
    }

    function folderIcon() {
        return `
            <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#2b2b2b" d="M5 14.5c0-2 1.5-3.5 3.5-3.5h10.9c1 0 1.9.4 2.5 1.2l2.5 3.1h15.1c2 0 3.5 1.5 3.5 3.5v16.7c0 2-1.5 3.5-3.5 3.5h-31c-2 0-3.5-1.5-3.5-3.5v-21z"/>
                <path fill="#eeeeee" d="M8 18.5h32v4.3h-32z"/>
                <path fill="#111111" d="M5 20h38l-2.8 18.4c-.3 1.5-1.7 2.6-3.3 2.6h-25.8c-1.6 0-3-1.1-3.3-2.6l-2.8-18.4z"/>
                <path fill="#3a3a3a" d="M8 22.5h32l-2.2 14.3c-.1.8-.8 1.2-1.6 1.2h-24.4c-.8 0-1.5-.4-1.6-1.2l-2.2-14.3z"/>
            </svg>
        `;
    }

    function createServiceButton(service) {
        return `
            <button
                class="job-details-service${service.completed ? ' is-complete' : ''}"
                type="button"
                data-service-id="${escapeHTML(service.id)}"
                aria-pressed="${service.completed ? 'true' : 'false'}"
            >
                <span>${service.completed ? '&#10003;' : ''}</span>
                <span>${escapeHTML(service.name)}</span>
            </button>
        `;
    }

    function showToast(message) {
        const toast = document.getElementById('job-details-toast');
        if (!toast) return;

        toast.innerHTML = message;
        toast.classList.add('is-visible');
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2200);
    }

    function updateStatus(button, status) {
        const isCompleted = status === 'Perfunduar';
        button.textContent = status;
        button.classList.toggle('is-completed', isCompleted);
        button.setAttribute('aria-pressed', String(isCompleted));
    }

    function createJobDetailsPage(container, job = {}, callbacks = {}) {
        if (!container) return null;

        const staff = normalizeStaff(job);
        const services = normalizeServices(job);
        const notes = job.notes == null
            ? 'Klienti ka k&euml;rkuar q&euml; t&euml; kontrollohet edhe sistemi i ftohjes. Automjeti ka mbi 150,000 km.'
            : escapeHTML(job.notes);
        const state = {
            status: job.status ?? 'Aktiv',
            selectedStaff: new Set()
        };

        container.innerHTML = `
            <section class="job-details-view">
                <div class="job-details-back" data-job-details-back></div>

                <section class="job-details-panel">
                    <h1>Sh&euml;rbimi</h1>

                    <div class="job-details-section-title">
                        <span></span>
                        <p>Detajet e sh&euml;rbimit</p>
                        <span></span>
                    </div>

                    <div class="job-details-summary">
                        <div class="job-details-folder">${folderIcon()}</div>
                        <div>
                            <h2 class="job-details-plate">${escapeHTML(job.plate ?? job.code ?? 'AB 123 CD')}</h2>
                            <p class="job-details-client">${escapeHTML(job.clientName ?? job.client ?? 'Emri i Klientit')}</p>
                        </div>
                        <button class="job-details-status" type="button" data-job-status aria-pressed="false"></button>
                    </div>

                    <hr />

                    <section class="job-details-fieldset job-details-title">
                        <h2>Titulli i Pun&euml;s</h2>
                        <p>${escapeHTML(job.title ?? 'Servisim Periodik')}</p>
                    </section>

                    <hr />

                    <section class="job-details-fieldset">
                        <h2>Detajet e Klientit</h2>
                        <div class="job-details-info-grid">
                            <div>
                                <span class="job-details-label">Email i Klientit</span>
                                <p class="job-details-value">${escapeHTML(job.email ?? 'klient1@email.com')}</p>
                            </div>
                            <div>
                                <span class="job-details-label">Telefoni</span>
                                <p class="job-details-value">${escapeHTML(job.phone ?? job.phoneNumber ?? '')}</p>
                            </div>
                            <div>
                                <span class="job-details-label">Data e Fillimit</span>
                                <p class="job-details-value">${escapeHTML(job.startDate ?? '25/09/2025')}</p>
                            </div>
                            <div>
                                <span class="job-details-label">Data e P&euml;rfundimit</span>
                                <p class="job-details-value">${escapeHTML(job.endDate ?? '30/09/2025')}</p>
                            </div>
                        </div>
                    </section>

                    <hr />

                    <section class="job-details-fieldset">
                        <h2>Sh&euml;nime</h2>
                        <p class="job-details-notes">${notes}</p>
                    </section>

                    <hr />

                    <section class="job-details-fieldset">
                        <h2>Stafi i caktuar</h2>
                        <div class="job-details-staff">
                            ${staff.map((member, index) => `
                                <button type="button" data-staff-index="${index}">
                                    ${escapeHTML(member)}
                                </button>
                            `).join('')}
                        </div>
                    </section>

                    <hr />

                    <section class="job-details-fieldset">
                        <h2>Sh&euml;rbimet e kryera deri m&euml; tani</h2>
                        <div class="job-details-services-list">
                            ${services.map(createServiceButton).join('')}
                        </div>
                    </section>
                </section>
            </section>
        `;

        const backSlot = container.querySelector('[data-job-details-back]');
        if (typeof window.createBackButton === 'function') {
            window.createBackButton(backSlot, {
                text: 'Kthehu te lista',
                ariaLabel: 'Kthehu te lista',
                onClick: () => {
                    if (typeof callbacks.onBack === 'function') {
                        callbacks.onBack();
                    } else {
                        window.history.back();
                    }
                }
            });
        }

        const statusButton = container.querySelector('[data-job-status]');
        updateStatus(statusButton, state.status);
        statusButton.addEventListener('click', () => {
            state.status = state.status === 'Aktiv' ? 'Perfunduar' : 'Aktiv';
            updateStatus(statusButton, state.status);
            showToast(`Statusi u ndryshua n&euml; ${escapeHTML(state.status)}.`);

            if (typeof callbacks.onStatusChange === 'function') {
                callbacks.onStatusChange(state.status, job);
            }
        });

        container.querySelectorAll('[data-staff-index]').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.staffIndex);
                if (state.selectedStaff.has(index)) {
                    state.selectedStaff.delete(index);
                    button.classList.remove('is-selected');
                } else {
                    state.selectedStaff.add(index);
                    button.classList.add('is-selected');
                }

                if (typeof callbacks.onStaffSelect === 'function') {
                    callbacks.onStaffSelect(staff[index], job);
                }
            });
        });

        container.querySelectorAll('[data-service-id]').forEach((button) => {
            button.addEventListener('click', () => {
                const isComplete = !button.classList.contains('is-complete');
                const check = button.querySelector('span:first-child');
                button.classList.toggle('is-complete', isComplete);
                button.setAttribute('aria-pressed', String(isComplete));
                check.innerHTML = isComplete ? '&#10003;' : '';

                const service = services.find((item) => String(item.id) === String(button.dataset.serviceId));
                if (service) {
                    service.completed = isComplete;
                }

                if (typeof callbacks.onServiceToggle === 'function') {
                    callbacks.onServiceToggle(service, job);
                }
            });
        });

        return container;
    }

    window.createJobDetailsPage = createJobDetailsPage;
}());
