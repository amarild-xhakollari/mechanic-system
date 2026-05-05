(function () {
    const endpoints = {
        vehicles: '../api/search_vehicles.php',
        clients: '../api/search_user.php',
        cars: '../api/search_car_model.php',
        staff: '../api/search_staff_simple.php',
        create: '../actions/createJob.php'
    };

    const state = {
        vehicleMode: 'existing',
        clientMode: 'existing',
        selectedVehicle: null,
        selectedClient: null,
        selectedCar: null,
        selectedStaff: null,
        generatedClientCode: '',
        timers: {}
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

    function todayValue() {
        const date = new Date();
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function debounce(key, callback) {
        clearTimeout(state.timers[key]);
        state.timers[key] = setTimeout(callback, 250);
    }

    async function fetchJson(url) {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Request failed with ${response.status}`);
        }

        return response.json();
    }

    function field(container, selector) {
        return container.querySelector(selector);
    }

    function setMessage(container, message, type = '') {
        const element = field(container, '[data-message]');
        element.textContent = message;
        element.classList.toggle('is-error', type === 'error');
        element.classList.toggle('is-success', type === 'success');
    }

    function clearVehiclePreview(container) {
        field(container, '[data-vehicle-plate]').value = '';
        field(container, '[data-vehicle-vin]').value = '';
        field(container, '[data-vehicle-model]').value = '';
    }

    function clearClientPreview(container) {
        field(container, '[data-client-name]').value = '';
        field(container, '[data-client-email]').value = '';
        field(container, '[data-client-phone]').value = '';
    }

    function renderResults(container, target, items, renderer, onSelect) {
        const results = field(container, `[data-results="${target}"]`);

        if (!results) return;

        if (!Array.isArray(items) || items.length === 0) {
            results.innerHTML = '<div class="register-job-panel__result"><span class="register-job-panel__result-meta">Nuk u gjet asnje rezultat.</span></div>';
            return;
        }

        results.innerHTML = items.map((item, index) => renderer(item, index)).join('');
        results.querySelectorAll('[data-result-index]').forEach((button) => {
            button.addEventListener('click', () => {
                const item = items[Number(button.dataset.resultIndex)];
                onSelect(item);
                results.innerHTML = '';
            });
        });
    }

    function setMode(container, group, mode) {
        if (group === 'vehicle') {
            state.vehicleMode = mode;
            state.selectedVehicle = null;
            state.selectedCar = null;
            clearVehiclePreview(container);
            clearClientPreview(container);
            toggleClientControls(container);
        } else {
            state.clientMode = mode;
            state.selectedClient = null;
            state.generatedClientCode = '';
            clearClientPreview(container);
        }

        container.querySelectorAll(`[data-${group}-mode-button]`).forEach((button) => {
            button.classList.toggle('is-active', button.dataset[`${group}ModeButton`] === mode);
        });

        container.querySelectorAll(`[data-${group}-mode]`).forEach((panel) => {
            panel.hidden = panel.dataset[`${group}Mode`] !== mode;
        });

        if (group === 'client') {
            const codeField = field(container, '[data-generated-client-code]');
            if (codeField) codeField.value = '';
        }
    }

    function toggleClientControls(container) {
        const controls = field(container, '[data-client-controls]');
        const clientModeTitle = field(container, '[data-client-mode-title]');

        if (!controls) return;

        controls.hidden = state.vehicleMode === 'existing';
        if (clientModeTitle) {
            clientModeTitle.textContent = state.vehicleMode === 'existing'
                ? 'Klienti mbushet automatikisht nga automjeti'
                : 'Zgjidh ose krijo klientin per automjetin e ri';
        }
    }

    function fillSelectedVehicle(container, vehicle) {
        state.selectedVehicle = vehicle;
        state.selectedClient = vehicle.client;
        state.selectedCar = vehicle.model;

        field(container, '[data-existing-vehicle-search]').value = vehicle.plate_number || '';
        field(container, '[data-client-name]').value = vehicle.client?.name || '';
        field(container, '[data-client-email]').value = vehicle.client?.email || '';
        field(container, '[data-client-phone]').value = vehicle.client?.phone || '';
        field(container, '[data-vehicle-plate]').value = vehicle.plate_number || '';
        field(container, '[data-vehicle-vin]').value = vehicle.vin || '';
        field(container, '[data-vehicle-model]').value = [vehicle.model?.company_name, vehicle.model?.car_name].filter(Boolean).join(' ');
        toggleClientControls(container);
    }

    function fillSelectedClient(container, client) {
        state.selectedClient = {
            id: Number(client.user_id || client.id),
            name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim(),
            email: client.email,
            phone: client.phone_number || client.phone
        };

        field(container, '[data-existing-client-search]').value = state.selectedClient.name;
        field(container, '[data-client-name]').value = state.selectedClient.name;
        field(container, '[data-client-email]').value = state.selectedClient.email || '';
        field(container, '[data-client-phone]').value = state.selectedClient.phone || '';
    }

    function fillSelectedCar(container, car) {
        state.selectedCar = car;
        field(container, '[data-car-model-search]').value = `${car.company_name ?? ''} ${car.car_name ?? ''}`.trim();
        field(container, '[data-vehicle-model]').value = `${car.company_name ?? ''} ${car.car_name ?? ''}`.trim();
    }

    function generateClientCode(container) {
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        state.generatedClientCode = `KL${random}`;
        field(container, '[data-generated-client-code]').value = state.generatedClientCode;
        setMessage(container, 'Kodi u gjenerua dhe do te ruhet si fjalekalim i klientit.', 'success');
    }

    function syncNewClientPreview(container) {
        const update = () => {
            if (state.clientMode !== 'new' || state.vehicleMode !== 'new') return;

            const firstName = field(container, '[data-new-client-first]').value.trim();
            const lastName = field(container, '[data-new-client-last]').value.trim();
            field(container, '[data-client-name]').value = `${firstName} ${lastName}`.trim();
            field(container, '[data-client-email]').value = field(container, '[data-new-client-email]').value.trim();
            field(container, '[data-client-phone]').value = field(container, '[data-new-client-phone]').value.trim();
        };

        [
            '[data-new-client-first]',
            '[data-new-client-last]',
            '[data-new-client-email]',
            '[data-new-client-phone]'
        ].forEach((selector) => {
            field(container, selector).addEventListener('input', update);
        });
    }

    function fillSelectedStaff(container, staff) {
        state.selectedStaff = staff;
        field(container, '[data-staff-search]').value = staff.name || '';
        field(container, '[data-staff-selected]').value = `${staff.name || ''}${staff.code ? ` (${staff.code})` : ''}`;
    }

    function makeMarkup() {
        return `
            <form class="register-job-panel" data-register-job-form>
                <h2 class="register-job-panel__title">Regjistro Pune</h2>
                <div class="register-job-panel__topline"><span>Detajet e punes</span></div>

                <section class="register-job-panel__section">
                    <h3 class="register-job-panel__section-title">Detajet e Punes</h3>
                    <div class="register-job-panel__grid">
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Titulli / Pershkrimi</span>
                            <input class="register-job-panel__input" type="text" data-description placeholder="Defekt ne motor" required>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Lloji i punes</span>
                            <select class="register-job-panel__select" data-job-type required>
                                <option value="maintenance">Servisim periodik</option>
                                <option value="damage_repair">Riparim demtimi</option>
                            </select>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Data e fillimit</span>
                            <input class="register-job-panel__input" type="date" value="${todayValue()}" readonly>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Statusi</span>
                            <select class="register-job-panel__select" data-status>
                                <option value="created">Krijuar</option>
                                <option value="in_progress">Ne proces</option>
                            </select>
                        </label>
                    </div>
                </section>

                <section class="register-job-panel__section">
                    <h3 class="register-job-panel__section-title">Detajet e Automjetit</h3>
                    <div class="register-job-panel__segments">
                        <button class="register-job-panel__segment is-active" type="button" data-vehicle-mode-button="existing">Automjeti ekziston</button>
                        <button class="register-job-panel__segment" type="button" data-vehicle-mode-button="new">Automjet i ri</button>
                    </div>

                    <div class="register-job-panel__mode" data-vehicle-mode="existing">
                        <label class="register-job-panel__field register-job-panel__search-wrap">
                            <span class="register-job-panel__label">Kerko automjet</span>
                            <input class="register-job-panel__input" type="text" data-existing-vehicle-search placeholder="Targe, VIN, klient ose model">
                            <div class="register-job-panel__results" data-results="vehicles"></div>
                        </label>
                        <p class="register-job-panel__hint">Kur zgjidhet automjeti, klienti mbushet automatikisht.</p>
                    </div>

                    <div class="register-job-panel__mode" data-vehicle-mode="new" hidden>
                        <div class="register-job-panel__grid">
                            <label class="register-job-panel__field register-job-panel__search-wrap register-job-panel__field--wide">
                                <span class="register-job-panel__label">Kerko model automjeti</span>
                                <input class="register-job-panel__input" type="text" data-car-model-search placeholder="BMW, Golf, Toyota...">
                                <div class="register-job-panel__results" data-results="cars"></div>
                            </label>
                            <label class="register-job-panel__field">
                                <span class="register-job-panel__label">Targa</span>
                                <input class="register-job-panel__input" type="text" data-new-plate placeholder="AB 123 CD">
                            </label>
                            <label class="register-job-panel__field">
                                <span class="register-job-panel__label">VIN</span>
                                <input class="register-job-panel__input" type="text" data-new-vin placeholder="Vehicle Identification Number">
                            </label>
                        </div>
                    </div>

                    <div class="register-job-panel__grid">
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Targa</span>
                            <input class="register-job-panel__input" type="text" data-vehicle-plate readonly>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Marka / Modeli</span>
                            <input class="register-job-panel__input" type="text" data-vehicle-model readonly>
                        </label>
                        <label class="register-job-panel__field register-job-panel__field--wide">
                            <span class="register-job-panel__label">VIN</span>
                            <input class="register-job-panel__input" type="text" data-vehicle-vin readonly>
                        </label>
                    </div>
                </section>

                <section class="register-job-panel__section">
                    <h3 class="register-job-panel__section-title">Informacioni i Klientit</h3>
                    <p class="register-job-panel__hint" data-client-mode-title>Klienti mbushet automatikisht nga automjeti</p>

                    <div class="register-job-panel__client-controls" data-client-controls hidden>
                        <div class="register-job-panel__segments">
                            <button class="register-job-panel__segment is-active" type="button" data-client-mode-button="existing">Klienti ekziston</button>
                            <button class="register-job-panel__segment" type="button" data-client-mode-button="new">Klient i ri</button>
                        </div>

                        <div class="register-job-panel__mode" data-client-mode="existing">
                            <label class="register-job-panel__field register-job-panel__search-wrap">
                                <span class="register-job-panel__label">Kerko klient</span>
                                <input class="register-job-panel__input" type="text" data-existing-client-search placeholder="Emer, telefon ose email">
                                <div class="register-job-panel__results" data-results="clients"></div>
                            </label>
                        </div>

                        <div class="register-job-panel__mode" data-client-mode="new" hidden>
                            <div class="register-job-panel__grid">
                                <label class="register-job-panel__field">
                                    <span class="register-job-panel__label">Emri</span>
                                    <input class="register-job-panel__input" type="text" data-new-client-first placeholder="Emri i klientit">
                                </label>
                                <label class="register-job-panel__field">
                                    <span class="register-job-panel__label">Mbiemri</span>
                                    <input class="register-job-panel__input" type="text" data-new-client-last placeholder="Mbiemri i klientit">
                                </label>
                                <label class="register-job-panel__field">
                                    <span class="register-job-panel__label">Email</span>
                                    <input class="register-job-panel__input" type="email" data-new-client-email placeholder="klient@email.com">
                                </label>
                                <label class="register-job-panel__field">
                                    <span class="register-job-panel__label">Telefoni</span>
                                    <input class="register-job-panel__input" type="tel" data-new-client-phone placeholder="067 000 0000">
                                </label>
                                <label class="register-job-panel__field">
                                    <span class="register-job-panel__label">Kodi / Fjalekalimi</span>
                                    <input class="register-job-panel__input" type="text" data-generated-client-code readonly>
                                </label>
                                <div class="register-job-panel__field register-job-panel__field--button">
                                    <span class="register-job-panel__label">Gjenero kodin</span>
                                    <button class="register-job-panel__secondary" type="button" data-generate-client-code>Generate Code</button>
                                </div>
                            </div>
                            <p class="register-job-panel__hint">Ky kod do te ruhet si fjalekalim per hyrjen e klientit.</p>
                        </div>
                    </div>

                    <div class="register-job-panel__grid">
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Klienti i zgjedhur</span>
                            <input class="register-job-panel__input" type="text" data-client-name readonly>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Email</span>
                            <input class="register-job-panel__input" type="text" data-client-email readonly>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Telefoni</span>
                            <input class="register-job-panel__input" type="text" data-client-phone readonly>
                        </label>
                    </div>
                </section>

                <section class="register-job-panel__section">
                    <h3 class="register-job-panel__section-title">Stafi</h3>
                    <div class="register-job-panel__grid">
                        <label class="register-job-panel__field register-job-panel__search-wrap">
                            <span class="register-job-panel__label">Kerko staf</span>
                            <input class="register-job-panel__input" type="text" data-staff-search placeholder="Emer, kod ose telefon">
                            <div class="register-job-panel__results" data-results="staff"></div>
                        </label>
                        <label class="register-job-panel__field">
                            <span class="register-job-panel__label">Stafi i zgjedhur</span>
                            <input class="register-job-panel__input" type="text" data-staff-selected readonly>
                        </label>
                    </div>
                </section>

                <p class="register-job-panel__generated" data-generated-code hidden></p>
                <div class="register-job-panel__actions">
                    <p class="register-job-panel__message" data-message></p>
                    <button class="register-job-panel__submit" type="submit">Ruaj punen</button>
                </div>
            </form>
        `;
    }

    function bindSearch(container) {
        field(container, '[data-existing-vehicle-search]').addEventListener('input', (event) => {
            const query = event.target.value.trim();
            if (query.length < 2) {
                field(container, '[data-results="vehicles"]').innerHTML = '';
                return;
            }

            debounce('vehicles', async () => {
                const vehicles = await fetchJson(`${endpoints.vehicles}?q=${encodeURIComponent(query)}`);
                renderResults(container, 'vehicles', vehicles, (vehicle, index) => `
                    <button class="register-job-panel__result" type="button" data-result-index="${index}">
                        <span class="register-job-panel__result-title">${escapeHTML(vehicle.plate_number)} - ${escapeHTML(vehicle.client?.name)}</span>
                        <span class="register-job-panel__result-meta">${escapeHTML(vehicle.vin)} | ${escapeHTML(vehicle.model?.company_name)} ${escapeHTML(vehicle.model?.car_name)}</span>
                    </button>
                `, (vehicle) => fillSelectedVehicle(container, vehicle));
            });
        });

        field(container, '[data-existing-client-search]').addEventListener('input', (event) => {
            const query = event.target.value.trim();
            if (query.length < 2) {
                field(container, '[data-results="clients"]').innerHTML = '';
                return;
            }

            debounce('clients', async () => {
                const clients = await fetchJson(`${endpoints.clients}?q=${encodeURIComponent(query)}`);
                renderResults(container, 'clients', clients, (client, index) => `
                    <button class="register-job-panel__result" type="button" data-result-index="${index}">
                        <span class="register-job-panel__result-title">${escapeHTML(client.first_name)} ${escapeHTML(client.last_name)}</span>
                        <span class="register-job-panel__result-meta">${escapeHTML(client.phone_number)} | ${escapeHTML(client.email)}</span>
                    </button>
                `, (client) => fillSelectedClient(container, client));
            });
        });

        field(container, '[data-car-model-search]').addEventListener('input', (event) => {
            const query = event.target.value.trim();
            if (query.length < 2) {
                field(container, '[data-results="cars"]').innerHTML = '';
                return;
            }

            debounce('cars', async () => {
                const cars = await fetchJson(`${endpoints.cars}?q=${encodeURIComponent(query)}`);
                renderResults(container, 'cars', cars, (car, index) => `
                    <button class="register-job-panel__result" type="button" data-result-index="${index}">
                        <span class="register-job-panel__result-title">${escapeHTML(car.company_name)} ${escapeHTML(car.car_name)}</span>
                        <span class="register-job-panel__result-meta">${escapeHTML(car.engines)} | ${escapeHTML(car.fuel_type)}</span>
                    </button>
                `, (car) => fillSelectedCar(container, car));
            });
        });

        field(container, '[data-staff-search]').addEventListener('input', (event) => {
            const query = event.target.value.trim();
            if (query.length < 2) {
                field(container, '[data-results="staff"]').innerHTML = '';
                return;
            }

            debounce('staff', async () => {
                const staff = await fetchJson(`${endpoints.staff}?q=${encodeURIComponent(query)}`);
                renderResults(container, 'staff', staff, (member, index) => `
                    <button class="register-job-panel__result" type="button" data-result-index="${index}">
                        <span class="register-job-panel__result-title">${escapeHTML(member.name)}</span>
                        <span class="register-job-panel__result-meta">${escapeHTML(member.code)} | ${escapeHTML(member.phone)}</span>
                    </button>
                `, (member) => fillSelectedStaff(container, member));
            });
        });
    }

    function bindModes(container) {
        container.querySelectorAll('[data-client-mode-button]').forEach((button) => {
            button.addEventListener('click', () => setMode(container, 'client', button.dataset.clientModeButton));
        });

        container.querySelectorAll('[data-vehicle-mode-button]').forEach((button) => {
            button.addEventListener('click', () => setMode(container, 'vehicle', button.dataset.vehicleModeButton));
        });
    }

    function syncNewVehiclePreview(container) {
        field(container, '[data-new-plate]').addEventListener('input', (event) => {
            field(container, '[data-vehicle-plate]').value = event.target.value;
        });

        field(container, '[data-new-vin]').addEventListener('input', (event) => {
            field(container, '[data-vehicle-vin]').value = event.target.value;
        });
    }

    function buildPayload(container) {
        const payload = {
            description: field(container, '[data-description]').value.trim(),
            job_type: field(container, '[data-job-type]').value,
            status: field(container, '[data-status]').value,
            staff_id: state.selectedStaff?.id,
            vehicle_mode: state.vehicleMode,
            client_mode: state.clientMode
        };

        if (state.vehicleMode === 'existing') {
            payload.vehicle_id = state.selectedVehicle?.id;
            return payload;
        }

        if (state.clientMode === 'existing') {
            payload.client_id = state.selectedClient?.id;
        } else {
            payload.client = {
                first_name: field(container, '[data-new-client-first]').value.trim(),
                last_name: field(container, '[data-new-client-last]').value.trim(),
                email: field(container, '[data-new-client-email]').value.trim(),
                phone: field(container, '[data-new-client-phone]').value.trim(),
                generated_code: state.generatedClientCode
            };
        }

        payload.vehicle = {
            car_model_id: state.selectedCar?.id,
            plate_number: field(container, '[data-new-plate]').value.trim(),
            vin: field(container, '[data-new-vin]').value.trim()
        };

        return payload;
    }

    function bindSubmit(container) {
        const form = field(container, '[data-register-job-form]');
        const submit = field(container, '.register-job-panel__submit');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            submit.disabled = true;
            setMessage(container, 'Duke ruajtur punen...');

            try {
                const response = await fetch(endpoints.create, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(buildPayload(container))
                });
                const result = await response.json();

                if (!result.success) {
                    setMessage(container, result.message || 'Puna nuk u ruajt.', 'error');
                    return;
                }

                const generated = field(container, '[data-generated-code]');
                if (result.generated_client_code) {
                    generated.hidden = false;
                    generated.innerHTML = `
                        Kodi i klientit te ri: <strong>${escapeHTML(result.generated_client_code)}</strong>.
                        <a class="register-job-panel__generated-link" href="job-details.html?job_id=${encodeURIComponent(result.job_id)}">Hap detajet e punes</a>
                    `;
                    setMessage(container, result.message || 'Puna u regjistrua.', 'success');
                    return;
                }

                setMessage(container, result.message || 'Puna u regjistrua.', 'success');
                setTimeout(() => {
                    window.location.href = `job-details.html?job_id=${encodeURIComponent(result.job_id)}`;
                }, 900);
            } catch (error) {
                console.warn('Job creation failed:', error);
                setMessage(container, 'Puna nuk u ruajt.', 'error');
            } finally {
                submit.disabled = false;
            }
        });
    }

    function createRegisterJobPanel(container) {
        if (!container) return null;

        container.innerHTML = makeMarkup();
        bindModes(container);
        bindSearch(container);
        syncNewClientPreview(container);
        syncNewVehiclePreview(container);
        toggleClientControls(container);
        field(container, '[data-generate-client-code]').addEventListener('click', () => generateClientCode(container));
        bindSubmit(container);

        return container;
    }

    window.createRegisterJobPanel = createRegisterJobPanel;
}());
