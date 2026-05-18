(function () {
    ClientPages.bindLogout();
    ClientPages.bindProfileDropdown();

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function statusIsActive(status) {
        return status === 'created' || status === 'in_progress';
    }

    function getClientCode(user = {}) {
        const id = String(user.id || 1).padStart(3, '0');
        return `KL-${id}`;
    }

    function normalizeVehicle(vehicle = {}) {
        return {
            id: vehicle.id,
            plate_number: vehicle.plate,
            vin: vehicle.vin,
            company_name: vehicle.company,
            car_name: vehicle.model,
            fuel_type: vehicle.fuel
        };
    }

    function normalizeJob(job = {}) {
        return {
            id: job.id,
            code: job.code || job.vehicle?.plate || '',
            staff: Array.isArray(job.staff) ? job.staff.join(', ') : (job.staff || ''),
            date: job.updatedAt || job.date || '',
            status: job.rawStatus || job.status || ''
        };
    }

    function toClientDetailsPayload(data = {}) {
        const user = data.user ?? {};
        const vehicles = Array.isArray(data.vehicles) ? data.vehicles.map(normalizeVehicle) : [];
        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        const activeJobs = jobs
            .filter((job) => statusIsActive(job.rawStatus))
            .map(normalizeJob);

        return {
            id: user.id,
            name: user.name,
            code: getClientCode(user),
            email: user.email,
            phone: user.phone,
            vehicle_count: vehicles.length,
            total_jobs: jobs.length,
            vehicles,
            active_jobs: activeJobs
        };
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="client-profile-empty">${escapeHTML(message)}</p>`;
    }

    async function initPage() {
        const mount = document.querySelector('#client-profile-panel');
        if (!mount) return;

        const data = await ClientPages.loadData();
        ClientPages.fillUser(data.user);

        if (typeof window.createClientSpecificationPanel !== 'function') {
            renderEmpty(mount, 'Komponenti i detajeve nuk u ngarkua.');
            return;
        }

        createClientSpecificationPanel(mount, toClientDetailsPayload(data), {
            jobDetailsBase: 'client-job-details.html'
        });

        mount.querySelectorAll('[data-job-id]').forEach((card) => {
            const jobId = card.dataset.jobId;
            if (!jobId) return;

            const openClientJob = () => {
                window.location.href = `client-job-details.html?job_id=${encodeURIComponent(jobId)}&from=active`;
            };

            card.onclick = openClientJob;
            card.onkeydown = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openClientJob();
                }
            };
        });
    }

    initPage().catch((error) => {
        console.warn('Client profile could not load:', error);
        const mount = document.querySelector('#client-profile-panel');
        if (mount) {
            renderEmpty(mount, 'Detajet e klientit nuk u ngarkuan.');
        }
    });
}());
