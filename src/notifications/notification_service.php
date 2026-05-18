<?php

function notifications_config(): array {
    $defaults = [
        "app_name" => "Mechanic System",
        "app_public_url" => "/mechanic-system",
        "sms_enabled" => false,
        "email_enabled" => false,
        "twilio_account_sid" => "",
        "twilio_auth_token" => "",
        "twilio_from_phone" => "",
        "email_from" => "no-reply@mechanic-system.local",
        "email_from_name" => "Mechanic System"
    ];

    $localPath = __DIR__ . "/../config/notification_config.php";
    if (is_file($localPath)) {
        $local = require $localPath;
        if (is_array($local)) {
            return array_merge($defaults, $local);
        }
    }

    return $defaults;
}

function notifications_ensure_table(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id INT AUTO_INCREMENT PRIMARY KEY,
            recipient_user_id INT NOT NULL,
            recipient_role ENUM('admin', 'staff', 'client') NOT NULL,
            job_id INT NULL,
            channel ENUM('in_app', 'sms', 'email') NOT NULL DEFAULT 'in_app',
            event_type VARCHAR(80) NOT NULL,
            title VARCHAR(180) NOT NULL,
            message TEXT NOT NULL,
            recipient VARCHAR(255) NULL,
            status ENUM('pending', 'sent', 'failed', 'skipped', 'read') NOT NULL DEFAULT 'pending',
            provider_sid VARCHAR(120) NULL,
            error_message TEXT NULL,
            metadata JSON NULL,
            read_at TIMESTAMP NULL,
            sent_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notifications_user_created (recipient_user_id, created_at),
            INDEX idx_notifications_user_status (recipient_user_id, status),
            INDEX idx_notifications_job (job_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function notifications_json_or_null($value): ?string {
    if ($value === null || $value === []) {
        return null;
    }

    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function notifications_normalize_phone(string $phone): string {
    $value = trim($phone);
    if ($value === "") {
        return "";
    }

    $value = preg_replace("/[\\s\\-().]/", "", $value);
    if (str_starts_with($value, "+")) {
        return $value;
    }

    if (str_starts_with($value, "00")) {
        return "+" . substr($value, 2);
    }

    if (str_starts_with($value, "0")) {
        return "+355" . substr($value, 1);
    }

    return $value;
}

function notifications_create(mysqli $conn, array $data): int {
    notifications_ensure_table($conn);

    $recipientUserId = (int) ($data["recipient_user_id"] ?? 0);
    $recipientRole = $data["recipient_role"] ?? "client";
    $jobId = isset($data["job_id"]) && $data["job_id"] ? (int) $data["job_id"] : null;
    $channel = $data["channel"] ?? "in_app";
    $eventType = $data["event_type"] ?? "general";
    $title = $data["title"] ?? "Notification";
    $message = $data["message"] ?? "";
    $recipient = $data["recipient"] ?? null;
    $status = $data["status"] ?? "pending";
    $providerSid = $data["provider_sid"] ?? null;
    $errorMessage = $data["error_message"] ?? null;
    $metadata = notifications_json_or_null($data["metadata"] ?? null);
    $sentAt = in_array($status, ["sent", "skipped", "failed"], true) ? date("Y-m-d H:i:s") : null;

    $stmt = $conn->prepare("
        INSERT INTO notifications
            (recipient_user_id, recipient_role, job_id, channel, event_type, title, message, recipient, status, provider_sid, error_message, metadata, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        return 0;
    }

    $stmt->bind_param(
        "isissssssssss",
        $recipientUserId,
        $recipientRole,
        $jobId,
        $channel,
        $eventType,
        $title,
        $message,
        $recipient,
        $status,
        $providerSid,
        $errorMessage,
        $metadata,
        $sentAt
    );
    $stmt->execute();
    $notificationId = (int) $conn->insert_id;

    return $notificationId;
}

function notifications_update_delivery(mysqli $conn, int $notificationId, string $status, ?string $providerSid = null, ?string $errorMessage = null): void {
    if ($notificationId <= 0) {
        return;
    }

    $sentAt = in_array($status, ["sent", "skipped", "failed"], true) ? date("Y-m-d H:i:s") : null;
    $stmt = $conn->prepare("
        UPDATE notifications
        SET status = ?, provider_sid = ?, error_message = ?, sent_at = ?
        WHERE notification_id = ?
    ");

    if (!$stmt) {
        return;
    }

    $stmt->bind_param("ssssi", $status, $providerSid, $errorMessage, $sentAt, $notificationId);
    $stmt->execute();
}

function notifications_send_sms(mysqli $conn, int $notificationId, string $to, string $message): void {
    $config = notifications_config();
    if (!$config["sms_enabled"]) {
        notifications_update_delivery($conn, $notificationId, "skipped", null, "SMS is disabled.");
        return;
    }

    if ($to === "" || $config["twilio_account_sid"] === "" || $config["twilio_auth_token"] === "" || $config["twilio_from_phone"] === "") {
        notifications_update_delivery($conn, $notificationId, "failed", null, "Missing SMS recipient or Twilio config.");
        return;
    }

    try {
        require_once __DIR__ . "/../../vendor/autoload.php";
        $client = new Twilio\Rest\Client($config["twilio_account_sid"], $config["twilio_auth_token"]);
        $result = $client->messages->create($to, [
            "from" => $config["twilio_from_phone"],
            "body" => $message
        ]);
        notifications_update_delivery($conn, $notificationId, "sent", $result->sid ?? null, null);
    } catch (Throwable $error) {
        notifications_update_delivery($conn, $notificationId, "failed", null, $error->getMessage());
    }
}

function notifications_send_email(mysqli $conn, int $notificationId, string $to, string $subject, string $message): void {
    $config = notifications_config();
    if (!$config["email_enabled"]) {
        notifications_update_delivery($conn, $notificationId, "skipped", null, "Email is disabled.");
        return;
    }

    if ($to === "") {
        notifications_update_delivery($conn, $notificationId, "failed", null, "Missing email recipient.");
        return;
    }

    $headers = [
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "From: " . $config["email_from_name"] . " <" . $config["email_from"] . ">"
    ];

    $sent = @mail($to, $subject, $message, implode("\r\n", $headers));
    notifications_update_delivery($conn, $notificationId, $sent ? "sent" : "failed", null, $sent ? null : "PHP mail() failed.");
}

function notifications_dispatch(mysqli $conn, array $recipient, string $eventType, string $title, string $message, array $options = []): void {
    $userId = (int) ($recipient["user_id"] ?? 0);
    $role = $recipient["role"] ?? "client";
    $jobId = isset($options["job_id"]) ? (int) $options["job_id"] : null;
    $metadata = $options["metadata"] ?? [];

    if ($userId <= 0) {
        return;
    }

    notifications_create($conn, [
        "recipient_user_id" => $userId,
        "recipient_role" => $role,
        "job_id" => $jobId,
        "channel" => "in_app",
        "event_type" => $eventType,
        "title" => $title,
        "message" => $message,
        "status" => "pending",
        "metadata" => $metadata
    ]);

    if (!empty($options["send_sms"]) && !empty($recipient["phone_number"])) {
        $phoneNumber = notifications_normalize_phone($recipient["phone_number"]);
        $smsId = notifications_create($conn, [
            "recipient_user_id" => $userId,
            "recipient_role" => $role,
            "job_id" => $jobId,
            "channel" => "sms",
            "event_type" => $eventType,
            "title" => $title,
            "message" => $message,
            "recipient" => $phoneNumber,
            "status" => "pending",
            "metadata" => $metadata
        ]);
        notifications_send_sms($conn, $smsId, $phoneNumber, $message);
    }

    if (!empty($options["send_email"]) && !empty($recipient["email"])) {
        $emailId = notifications_create($conn, [
            "recipient_user_id" => $userId,
            "recipient_role" => $role,
            "job_id" => $jobId,
            "channel" => "email",
            "event_type" => $eventType,
            "title" => $title,
            "message" => $message,
            "recipient" => $recipient["email"],
            "status" => "pending",
            "metadata" => $metadata
        ]);
        notifications_send_email($conn, $emailId, $recipient["email"], $title, $message);
    }
}

function notifications_get_user(mysqli $conn, int $userId): ?array {
    $stmt = $conn->prepare("
        SELECT user_id, first_name, last_name, phone_number, email, login_identifier, role
        FROM users
        WHERE user_id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        return null;
    }

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    return $user ?: null;
}

function notifications_get_job_context(mysqli $conn, int $jobId): ?array {
    $stmt = $conn->prepare("
        SELECT
            j.job_id,
            j.status,
            j.job_type,
            j.description,
            v.plate_number,
            cm.company_name,
            cm.car_name,
            client_user.user_id AS client_id,
            client_user.first_name AS client_first_name,
            client_user.last_name AS client_last_name,
            client_user.phone_number AS client_phone,
            client_user.email AS client_email,
            staff_user.user_id AS staff_id,
            staff_user.first_name AS staff_first_name,
            staff_user.last_name AS staff_last_name,
            staff_user.phone_number AS staff_phone,
            staff_user.email AS staff_email
        FROM jobs j
        LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
        LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
        LEFT JOIN users client_user ON client_user.user_id = j.client_id
        LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
        WHERE j.job_id = ?
        LIMIT 1
    ");

    if (!$stmt) {
        return null;
    }

    $stmt->bind_param("i", $jobId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        return null;
    }

    return [
        "job_id" => (int) $row["job_id"],
        "plate" => $row["plate_number"] ?: "pa targe",
        "vehicle" => trim(($row["company_name"] ?? "") . " " . ($row["car_name"] ?? "")),
        "client" => [
            "user_id" => (int) $row["client_id"],
            "role" => "client",
            "first_name" => $row["client_first_name"],
            "last_name" => $row["client_last_name"],
            "phone_number" => $row["client_phone"],
            "email" => $row["client_email"]
        ],
        "staff" => [
            "user_id" => (int) $row["staff_id"],
            "role" => "staff",
            "first_name" => $row["staff_first_name"],
            "last_name" => $row["staff_last_name"],
            "phone_number" => $row["staff_phone"],
            "email" => $row["staff_email"]
        ]
    ];
}

function notifications_name(array $user): string {
    $name = trim(($user["first_name"] ?? "") . " " . ($user["last_name"] ?? ""));
    return $name !== "" ? $name : "User";
}

function notify_user_profile_created(mysqli $conn, int $userId, string $plainCredential, string $loginLabel = ""): void {
    $user = notifications_get_user($conn, $userId);
    if (!$user) {
        return;
    }

    $role = $user["role"] ?? "client";
    $title = $role === "staff" ? "Profili i stafit u krijua" : "Profili juaj u krijua";
    $loginValue = $loginLabel !== "" ? $loginLabel : ($role === "staff" ? ($user["login_identifier"] ?? $user["email"] ?? "") : ($user["phone_number"] ?? $user["email"] ?? ""));
    $message = "Pershendetje " . notifications_name($user) . ", profili juaj ne Mechanic System u krijua. Per hyrje perdorni: " . $loginValue . ". Fjalekalimi/kodi: " . $plainCredential . ".";

    notifications_dispatch($conn, $user, "profile_created", $title, $message, [
        "send_sms" => $role === "client",
        "send_email" => true,
        "metadata" => ["login" => $loginValue]
    ]);
}

function notify_job_created(mysqli $conn, int $jobId): void {
    $context = notifications_get_job_context($conn, $jobId);
    if (!$context) {
        return;
    }

    $plate = $context["plate"];
    $clientMessage = "Pershendetje " . notifications_name($context["client"]) . ", puna per makinen " . $plate . " u regjistrua. Do ju njoftojme per cdo perditesim.";
    notifications_dispatch($conn, $context["client"], "job_created", "Puna u regjistrua", $clientMessage, [
        "job_id" => $jobId,
        "send_sms" => true,
        "send_email" => true
    ]);

    $staffMessage = "Pershendetje " . notifications_name($context["staff"]) . ", ju jeni caktuar ne punen per makinen " . $plate . ".";
    notifications_dispatch($conn, $context["staff"], "job_assigned", "Ju eshte caktuar nje pune", $staffMessage, [
        "job_id" => $jobId,
        "send_email" => true
    ]);
}

function notify_client_job_event(mysqli $conn, int $jobId, string $eventType, array $details = []): void {
    $context = notifications_get_job_context($conn, $jobId);
    if (!$context) {
        return;
    }

    $plate = $context["plate"];
    $title = "Perditesim per makinen " . $plate;
    $message = "Ka nje perditesim per makinen " . $plate . ".";

    if ($eventType === "service_added") {
        $title = "Sherbim i ri u shtua";
        $message = "U shtua nje sherbim per makinen " . $plate . ": " . ($details["title"] ?? "Sherbim") . ".";
    } elseif ($eventType === "service_updated") {
        $title = "Sherbimi u perditesua";
        $message = "U perditesua sherbimi per makinen " . $plate . ". " . ($details["note"] ?? "");
    } elseif ($eventType === "service_deleted") {
        $title = "Sherbimi u fshi";
        $message = "U fshi nje sherbim per makinen " . $plate . ": " . ($details["title"] ?? "Sherbim") . ".";
    } elseif ($eventType === "job_completed") {
        $title = "Puna perfundoi";
        $message = "Puna per makinen " . $plate . " perfundoi. Faleminderit qe zgjodhet servisin tone.";
    }

    notifications_dispatch($conn, $context["client"], $eventType, $title, trim($message), [
        "job_id" => $jobId,
        "send_sms" => true,
        "send_email" => true,
        "metadata" => $details
    ]);
}
