(function () {
    const state = {
        activeTab: "active",
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

    function isActiveJob(job) {
        return job.status === "created" || job.status === "in_progress";
    }

    function renderJobs() {
        const grid = document.querySelector("[data-staff-jobs]");
        const jobs = state.jobs.filter((job) => state.activeTab === "active" ? isActiveJob(job) : !isActiveJob(job));
        const title = state.activeTab === "active" ? "Active Jobs" : "Past Jobs";

        document.querySelector("[data-staff-divider]").textContent = title;
        document.querySelector("[data-job-count]").textContent = jobs.length;

        if (!Array.isArray(jobs) || jobs.length === 0) {
            grid.innerHTML = `<p class="dashboard-empty">Nuk ka ${state.activeTab === "active" ? "pune aktive" : "pune te kaluara"}.</p>`;
            return;
        }

        grid.innerHTML = jobs.map((job) => `
            <article class="dashboard-job-card">
                <div class="dashboard-job-card__top">
                    <div>
                        <h2 class="dashboard-job-card__plate">${escapeHTML(job.plate || "Pa targe")}</h2>
                        <p class="dashboard-job-card__meta">${escapeHTML(job.client || "Pa klient")}</p>
                    </div>
                    <span class="dashboard-job-card__status">${escapeHTML(statusLabels[job.status] || job.status || "Status")}</span>
                </div>
                <div class="dashboard-job-card__body">
                    <div>
                        <p class="dashboard-job-card__label">Sherbimi</p>
                        <p class="dashboard-job-card__value">${escapeHTML(typeLabels[job.type] || job.type || "Sherbim")}</p>
                    </div>
                    <div>
                        <p class="dashboard-job-card__label">Perditesuar</p>
                        <p class="dashboard-job-card__value">${escapeHTML(formatDate(job.updated_at))}</p>
                    </div>
                </div>
            </article>
        `).join("");
    }

    function renderActiveTab() {
        document.querySelectorAll("[data-staff-tab]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.staffTab === state.activeTab);
        });

        renderJobs();
    }

    async function loadDashboard() {
        const response = await fetch("api/staff_dashboard.php", {
            headers: { Accept: "application/json" },
            credentials: "same-origin"
        });

        if (response.status === 403) {
            window.location.href = "staff-page.html";
            return;
        }

        const payload = await response.json();
        if (!payload.success) throw new Error(payload.message || "Dashboard failed");

        document.querySelector("[data-staff-name]").textContent = payload.user?.name || "Punet e mia";
        document.querySelector("[data-profile-name]").textContent = payload.user?.name || "Staff";
        document.querySelector("[data-staff-code]").textContent = payload.user?.code || "-";
        state.jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
        renderActiveTab();
    }

    const profileButton = document.querySelector("[data-profile-button]");
    const profileDropdown = document.querySelector("[data-profile-dropdown]");

    if (profileButton && profileDropdown) {
        profileButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = profileDropdown.classList.toggle("is-open");
            profileButton.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", (event) => {
            if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
                profileDropdown.classList.remove("is-open");
                profileButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    document.querySelector("[data-logout]")?.addEventListener("click", () => {
        window.location.href = "/mechanic-system/src/auth/session.php?action=logout";
    });

    document.querySelectorAll("[data-staff-tab]").forEach((button) => {
        button.addEventListener("click", () => {
            state.activeTab = button.dataset.staffTab;
            renderActiveTab();
        });
    });

    loadDashboard().catch((error) => {
        console.warn("Staff dashboard failed:", error);
        document.querySelector("[data-staff-jobs]").innerHTML = '<p class="dashboard-empty">Paneli nuk u ngarkua.</p>';
    });
}());
