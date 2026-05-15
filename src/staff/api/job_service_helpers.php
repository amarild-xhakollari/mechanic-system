<?php

function job_service_fail($message, $status = 200) {
    http_response_code($status);
    echo json_encode([
        "success" => false,
        "message" => $message
    ]);
    exit;
}

function job_services_table_exists($conn) {
    static $exists = null;

    if ($exists !== null) {
        return $exists;
    }

    $result = $conn->query("SHOW TABLES LIKE 'job_services'");
    $exists = $result && $result->num_rows > 0;

    return $exists;
}

function job_services_ensure_table($conn) {
    if (job_services_table_exists($conn)) {
        return;
    }

    $conn->query("
        CREATE TABLE job_services (
            service_id INT AUTO_INCREMENT PRIMARY KEY,
            job_id INT NOT NULL,
            created_by INT NOT NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NOT NULL,
            image_path VARCHAR(255) NULL,
            status ENUM('active', 'deleted') NOT NULL DEFAULT 'active',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            CONSTRAINT fk_job_services_job
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
                ON DELETE CASCADE
                ON UPDATE CASCADE,
            CONSTRAINT fk_job_services_created_by
                FOREIGN KEY (created_by) REFERENCES users(user_id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE,
            INDEX idx_job_services_job_id (job_id),
            INDEX idx_job_services_created_by (created_by),
            INDEX idx_job_services_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function job_services_get_owned_job($conn, $jobId, $staffId) {
    $stmt = $conn->prepare("SELECT job_id, status FROM jobs WHERE job_id = ? AND staff_id = ? LIMIT 1");
    if (!$stmt) {
        job_service_fail("Job query failed.");
    }

    $stmt->bind_param("ii", $jobId, $staffId);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function job_services_get_service($conn, $serviceId, $staffId) {
    $stmt = $conn->prepare("
        SELECT js.*
        FROM job_services js
        INNER JOIN jobs j ON j.job_id = js.job_id
        WHERE js.service_id = ?
          AND j.staff_id = ?
          AND js.status <> 'deleted'
        LIMIT 1
    ");

    if (!$stmt) {
        job_service_fail("Service query failed.");
    }

    $stmt->bind_param("ii", $serviceId, $staffId);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function job_services_format($row) {
    $imagePath = $row["image_path"] ?? "";
    $imageUrl = $imagePath ? "/mechanic-system/" . ltrim($imagePath, "/") : "";

    return [
        "id" => (int) $row["service_id"],
        "service_id" => (int) $row["service_id"],
        "job_id" => (int) $row["job_id"],
        "created_by" => (int) $row["created_by"],
        "title" => $row["title"],
        "description" => $row["description"],
        "note" => $row["description"],
        "image_path" => $imagePath,
        "image_url" => $imageUrl,
        "image" => $imageUrl,
        "status" => $row["status"],
        "created_at" => $row["created_at"],
        "updated_at" => $row["updated_at"],
        "deleted_at" => $row["deleted_at"] ?? null
    ];
}

function job_services_save_uploaded_image($fieldName = "image") {
    if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]["error"] === UPLOAD_ERR_NO_FILE) {
        return "";
    }

    if ($_FILES[$fieldName]["error"] !== UPLOAD_ERR_OK) {
        job_service_fail("Imazhi nuk u ngarkua me sukses.");
    }

    $tmpName = $_FILES[$fieldName]["tmp_name"];
    $mime = mime_content_type($tmpName);
    $extensions = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif"
    ];

    if (!isset($extensions[$mime])) {
        job_service_fail("Formati i imazhit nuk eshte i vlefshem.");
    }

    $uploadDir = __DIR__ . "/../../../public/uploads/job-services";
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        job_service_fail("Dosja e imazheve nuk u krijua.");
    }

    $fileName = "service-" . date("YmdHis") . "-" . bin2hex(random_bytes(6)) . "." . $extensions[$mime];
    $target = $uploadDir . "/" . $fileName;

    if (!move_uploaded_file($tmpName, $target)) {
        job_service_fail("Imazhi nuk u ruajt.");
    }

    return "public/uploads/job-services/" . $fileName;
}

function job_services_log_update($conn, $jobId, $staffId, $oldStatus, $newStatus, $note) {
    $stmt = $conn->prepare("
        INSERT INTO job_updates (job_id, updated_by, old_status, new_status, note)
        VALUES (?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        job_service_fail("Service history insert failed.");
    }

    $stmt->bind_param("iisss", $jobId, $staffId, $oldStatus, $newStatus, $note);
    $stmt->execute();
}

?>
