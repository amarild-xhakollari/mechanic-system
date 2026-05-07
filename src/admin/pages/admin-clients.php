<?php

require_once __DIR__ . "/../../auth/session.php";
startSessionIfNeeded();

if (!isAdmin()) {
    header("Location: /mechanic-system/public/staff-page.html");
    exit;
}

$conn = require __DIR__ . "/../../config/db.php";
$query = trim($_GET["q"] ?? "");

function escape_html($value) {
    return htmlspecialchars((string) ($value ?? ""), ENT_QUOTES, "UTF-8");
}

function get_logged_admin($conn) {
    $user_id = (int) ($_SESSION["user_id"] ?? 0);

    if ($user_id <= 0) {
        return [
            "name" => "Administrator",
            "role" => "admin"
        ];
    }

    $sql = "
        SELECT first_name, last_name, role
        FROM users
        WHERE user_id = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return [
            "name" => "Administrator",
            "role" => "admin"
        ];
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        return [
            "name" => "Administrator",
            "role" => "admin"
        ];
    }

    return [
        "name" => trim($user["first_name"] . " " . $user["last_name"]),
        "role" => $user["role"]
    ];
}

function get_client_code($client) {
    if (!empty($client["login_identifier"])) {
        return $client["login_identifier"];
    }

    return "KL-" . $client["user_id"];
}

function get_clients($conn, $query) {
    $clients = [];
    $search = "%" . $query . "%";

    $sql = "
        SELECT
            u.user_id,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.email,
            u.login_identifier,
            COUNT(DISTINCT v.vehicle_id) AS vehicle_count,
            COUNT(DISTINCT j.job_id) AS total_jobs,
            COUNT(DISTINCT CASE WHEN j.status IN ('created', 'in_progress') THEN j.job_id END) AS active_jobs
        FROM users u
        LEFT JOIN vehicles v ON v.client_id = u.user_id
        LEFT JOIN jobs j ON j.client_id = u.user_id
        WHERE u.role = 'client'
    ";

    if ($query !== "") {
        $sql .= "
          AND (
            u.first_name LIKE ?
            OR u.last_name LIKE ?
            OR u.phone_number LIKE ?
            OR u.email LIKE ?
            OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
          )
        ";
    }

    $sql .= "
        GROUP BY
            u.user_id,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.email,
            u.login_identifier
        ORDER BY u.first_name, u.last_name
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return $clients;
    }

    if ($query !== "") {
        $stmt->bind_param("sssss", $search, $search, $search, $search, $search);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $clients[] = $row;
    }

    return $clients;
}

$admin = get_logged_admin($conn);
$clients = get_clients($conn, $query);
$client_count = count($clients);

?>
<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Clients</title>
    <link rel="stylesheet" href="../../components/nav-bar/header-nav.css">
    <link rel="stylesheet" href="../../components/clinet-mini-card/client-mini-card.css">
    <link rel="stylesheet" href="../../components/search-bar/search-bar.css">
    <link rel="stylesheet" href="../css/admin_dashboard.css">
    <link rel="stylesheet" href="../css/admin_pages.css?v=compact-4">
</head>
<body>
    <div class="admin-dashboard">
        <header class="header-nav">
            <div class="header-nav__container">
                <nav class="header-nav__left" aria-label="Admin navigation">
                    <ul class="header-nav__menu">
                        <li><a class="header-nav__menu-button" href="admin-home.html">Faqja Kryesore</a></li>
                        <li><a class="header-nav__menu-button" href="admin-jobs.html">Punet</a></li>
                        <li><a class="header-nav__menu-button" href="admin-staff.html">Staff</a></li>
                        <li><a class="header-nav__menu-button is-active" aria-current="page" href="admin-clients.php">Klientet</a></li>
                    </ul>
                </nav>
                <div class="header-nav__actions">
                    <button class="header-nav__notification" type="button" aria-label="Notifications">
                        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                            <path d="M16 37h16M20 40.5c.9 1.6 2.2 2.5 4 2.5s3.1-.9 4-2.5M11.5 36.5c3-2.8 4.1-5.1 4.1-10.8v-4.2c0-5.1 3.7-9.7 8.4-9.7s8.4 4.6 8.4 9.7v4.2c0 5.7 1.1 8 4.1 10.8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                    <span class="header-nav__divider" aria-hidden="true"></span>
                    <div class="header-nav__profile">
                        <button class="header-nav__profile-button" type="button" aria-expanded="false" data-profile-button>
                            <span>Profili</span>
                            <svg class="header-nav__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 15l7-7 7 7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                        <div class="header-nav__dropdown" role="menu" data-profile-dropdown>
                            <p class="header-nav__user-name"><?php echo escape_html($admin["name"]); ?></p>
                            <p class="header-nav__user-role"><?php echo escape_html($admin["role"]); ?></p>
                            <a class="header-nav__logout" role="menuitem" href="../../auth/session.php?action=logout">Dil nga llogaria</a>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main class="dashboard-shell">
            <section class="dashboard-hero clients-page-hero">
                <div>
                    <h1 class="dashboard-title">Shiko te gjithe klientet</h1>
                </div>
            </section>

            <section class="dashboard-panel clients-page-panel">
                <div class="clients-page-panel__header">
                    <h2 class="panel-title">Te gjithe klientet tane</h2>
                    <form class="service-search" action="admin-clients.php" method="get" role="search">
                        <svg class="service-search__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" stroke-width="2"></circle>
                            <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"></path>
                        </svg>
                        <input
                            class="service-search__input"
                            type="search"
                            name="q"
                            value="<?php echo escape_html($query); ?>"
                            placeholder="Kerko klient sipas emrit, emailit ose telefonit"
                            autocomplete="off"
                        >
                    </form>
                </div>
                <div class="clients-page-panel__divider">
                    <span><?php echo $query === "" ? "Te gjithe pjesetaret" : "Rezultatet e kerkimit"; ?></span>
                </div>
                <div class="clients-page-panel__scroll">
                    <div class="clients-page-grid" id="clients-list">
                        <?php if ($client_count === 0): ?>
                            <p class="empty-state">Nuk ka kliente te regjistruar.</p>
                        <?php else: ?>
                            <?php foreach ($clients as $client): ?>
                                <?php
                                    $client_name = trim($client["first_name"] . " " . $client["last_name"]);
                                    $active_jobs = (int) ($client["active_jobs"] ?? 0);
                                    $vehicle_count = (int) ($client["vehicle_count"] ?? 0);
                                ?>
                                <a class="client-mini-card" href="client-details.html?client_id=<?php echo (int) $client["user_id"]; ?>">
                                    <div class="client-mini-card__header">
                                        <div class="client-mini-card__avatar">
                                            <img src="../../../assets/images/default-icons/client-icon.png" alt="" aria-hidden="true">
                                        </div>
                                        <div class="client-mini-card__identity">
                                            <h2 class="client-mini-card__name"><?php echo escape_html($client_name); ?></h2>
                                            <p class="client-mini-card__code"><?php echo escape_html(get_client_code($client)); ?></p>
                                        </div>
                                        <svg class="client-mini-card__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <path d="m9 18 6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </div>
                                    <div class="client-mini-card__divider"></div>
                                    <p class="client-mini-card__phone"><?php echo escape_html($client["phone_number"]); ?></p>
                                    <p class="client-mini-card__phone"><?php echo escape_html($vehicle_count . " automjete, " . $active_jobs . " pune aktive"); ?></p>
                                </a>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
                <p class="clients-page-panel__count"><?php echo escape_html($client_count); ?> kliente ne total</p>
            </section>
        </main>
    </div>

    <script>
        const profileButton = document.querySelector('[data-profile-button]');
        const profileDropdown = document.querySelector('[data-profile-dropdown]');

        if (profileButton && profileDropdown) {
            profileButton.addEventListener('click', function (event) {
                event.stopPropagation();
                const isOpen = profileDropdown.classList.toggle('is-open');
                profileButton.setAttribute('aria-expanded', String(isOpen));
            });

            document.addEventListener('click', function (event) {
                if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
                    profileDropdown.classList.remove('is-open');
                    profileButton.setAttribute('aria-expanded', 'false');
                }
            });
        }
    </script>
</body>
</html>
