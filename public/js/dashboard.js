(function () {
    const state = {
        activeTab: "vehicles",
        vehicles: [],
        jobs: []
    };

    const statusLabels = {
        created: "Aktiv",
        in_progress: "Aktiv",
        completed: "Perfunduar",
        cancelled: "Anuluar"
    };

    const typeLabels = {
        maintenance: "Mirembajtje",
        damage_repair: "Riparim demtimi"
    };

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        }[character]));
    }

    function formatDate(value) {
        if (!value) return "Pa date";

        const date = new Date(String(value).replace(" ", "T"));
        if (Number.isNaN(date.getTime())) return value;

        return [
            String(date.getDate()).padStart(2, "0"),
            String(date.getMonth() + 1).padStart(2, "0"),
            date.getFullYear()
        ].join("/");
    }

    function renderVehicles() {
        const list = document.querySelector("[data-dashboard-list]");

        document.querySelector("[data-panel-title]").textContent = "Automjetet";
        document.querySelector("[data-panel-divider]").textContent = "Vehicle";
        document.querySelector("[data-panel-count]").textContent = `${state.vehicles.length} automjete`;

        if (state.vehicles.length === 0) {
            list.innerHTML = '<p class="dashboard-empty">Nuk ka automjete te regjistruara.</p>';
            return;
        }

        list.innerHTML = state.vehicles.map((vehicle) => {
            const model = [vehicle.company, vehicle.model].filter(Boolean).join(" ") || "Pa model";

            return `
                <article class="dashboard-card">
                    <div class="dashboard-card__top">
                        <div>
                            <h2 class="dashboard-card__title">${escapeHTML(vehicle.plate || "Pa targe")}</h2>
                            <p class="dashboard-card__meta">${escapeHTML(model)}</p>
                        </div>
                    </div>
                    <div class="dashboard-card__body">
                        <div>
                            <p class="dashboard-card__label">VIN</p>
                            <p class="dashboard-card__value">${escapeHTML(vehicle.vin || "Nuk ka te dhena")}</p>
                        </div>
                        <div>
                            <p class="dashboard-card__label">Karburanti</p>
                            <p class="dashboard-card__value">${escapeHTML(vehicle.fuel || "Nuk ka te dhena")}</p>
                        </div>
                        <div>
                            <p class="dashboard-card__label">Motorri</p>
                            <p class="dashboard-card__value">${escapeHTML(vehicle.engine || "Nuk ka te dhena")}</p>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function renderJobs() {
        const list = document.querySelector("[data-dashboard-list]");

        document.querySelector("[data-panel-title]").textContent = "Punet";
        document.querySelector("[data-panel-divider]").textContent = "Jobs";
        document.querySelector("[data-panel-count]").textContent = `${state.jobs.length} pune`;

        if (state.jobs.length === 0) {
            list.innerHTML = '<p class="dashboard-empty">Nuk ka pune te regjistruara.</p>';
            return;
        }

        list.innerHTML = state.jobs.map((job) => `
            <article class="dashboard-card">
                <div class="dashboard-card__top">
                    <div>
                        <h2 class="dashboard-card__title">${escapeHTML(job.plate || "Pa targe")}</h2>
                        <p class="dashboard-card__meta">${escapeHTML(job.staff || "Pa staf")}</p>
                    </div>
                    <span class="dashboard-card__status">${escapeHTML(statusLabels[job.status] || job.status || "Status")}</span>
                </div>
                <div class="dashboard-card__body">
                    <div>
                        <p class="dashboard-card__label">Sherbimi</p>
                        <p class="dashboard-card__value">${escapeHTML(typeLabels[job.type] || job.type || "Sherbim")}</p>
                    </div>
                    <div>
                        <p class="dashboard-card__label">Perditesuar</p>
                        <p class="dashboard-card__value">${escapeHTML(formatDate(job.updated_at))}</p>
                    </div>
                </div>
            </article>
        `).join("");
    }

    function renderActiveTab() {
        document.querySelectorAll("[data-tab]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
        });

        if (state.activeTab === "jobs") {
            renderJobs();
            return;
        }

        renderVehicles();
    }

    async function loadDashboard() {
        const response = await fetch("api/client_dashboard.php", {
            headers: { Accept: "application/json" },
            credentials: "same-origin"
        });

        if (response.status === 403) {
            window.location.href = "public-client.html";
            return;
        }

        const payload = await response.json();
        if (!payload.success) throw new Error(payload.message || "Dashboard failed");

        state.vehicles = Array.isArray(payload.vehicles) ? payload.vehicles : [];
        state.jobs = Array.isArray(payload.jobs) ? payload.jobs : [];

        document.querySelector("[data-user-name]").textContent = payload.user?.name || "Klient";
        renderActiveTab();
    }

    const profileButton = document.getElementById("profileBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const dropdownArrow = document.getElementById("dropdownArrow");

    if (profileButton && dropdownMenu && dropdownArrow) {
        profileButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = dropdownMenu.classList.toggle("show");
            dropdownArrow.classList.toggle("open", isOpen);
            profileButton.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", (event) => {
            if (!dropdownMenu.contains(event.target) && !profileButton.contains(event.target)) {
                dropdownMenu.classList.remove("show");
                dropdownArrow.classList.remove("open");
                profileButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        window.location.href = "/mechanic-system/src/auth/session.php?action=logout";
    });

    document.querySelectorAll("[data-tab]").forEach((button) => {
        button.addEventListener("click", () => {
            state.activeTab = button.dataset.tab;
            renderActiveTab();
        });
    });

    loadDashboard().catch((error) => {
        console.warn("Client dashboard failed:", error);
        document.querySelector("[data-dashboard-list]").innerHTML = '<p class="dashboard-empty">Paneli nuk u ngarkua.</p>';
    });
}());
