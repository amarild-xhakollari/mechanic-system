<?php

function staff_service_fail($message, $status = 200) {
    http_response_code($status);
    echo json_encode([
        "success" => false,
        "message" => $message
    ]);
    exit;
}

function staff_owns_job($conn, $jobId, $staffId) {
    $stmt = $conn->prepare("SELECT job_id, status FROM jobs WHERE job_id = ? AND staff_id = ? LIMIT 1");
    if (!$stmt) {
        staff_service_fail("Job query failed.");
    }

    $stmt->bind_param("ii", $jobId, $staffId);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function staff_update_image_column_exists($conn) {
    static $exists = null;

    if ($exists !== null) {
        return $exists;
    }

    $result = $conn->query("SHOW COLUMNS FROM job_updates LIKE 'image_path'");
    $exists = $result && $result->num_rows > 0;

    if (!$exists) {
        $conn->query("ALTER TABLE job_updates ADD COLUMN image_path VARCHAR(255) NULL AFTER note");
        $result = $conn->query("SHOW COLUMNS FROM job_updates LIKE 'image_path'");
        $exists = $result && $result->num_rows > 0;
    }

    return $exists;
}

function staff_get_service_update($conn, $updateId, $staffId) {
    $selectImage = staff_update_image_column_exists($conn) ? "ju.image_path," : "NULL AS image_path,";
    $sql = "
        SELECT
            ju.update_id,
            ju.job_id,
            ju.old_status,
            ju.new_status,
            ju.note,
            $selectImage
            ju.updated_at
        FROM job_updates ju
        INNER JOIN jobs j ON j.job_id = ju.job_id
        WHERE ju.update_id = ?
          AND j.staff_id = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        staff_service_fail("Service query failed.");
    }

    $stmt->bind_param("ii", $updateId, $staffId);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function staff_format_service_update($row) {
    $imagePath = $row["image_path"] ?? "";

    return [
        "id" => (int) $row["update_id"],
        "job_id" => (int) $row["job_id"],
        "old_status" => $row["old_status"],
        "new_status" => $row["new_status"],
        "note" => $row["note"],
        "image_path" => $imagePath,
        "image_url" => $imagePath ? "/mechanic-system/" . ltrim($imagePath, "/") : "",
        "updated_at" => $row["updated_at"]
    ];
}

function staff_save_uploaded_image($fieldName = "image") {
    if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]["error"] === UPLOAD_ERR_NO_FILE) {
        return "";
    }

    if ($_FILES[$fieldName]["error"] !== UPLOAD_ERR_OK) {
        staff_service_fail("Imazhi nuk u ngarkua me sukses.");
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
        staff_service_fail("Formati i imazhit nuk eshte i vlefshem.");
    }

    $uploadDir = __DIR__ . "/../../../public/uploads/job-updates";
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true)) {
        staff_service_fail("Dosja e imazheve nuk u krijua.");
    }

    $fileName = "service-" . date("YmdHis") . "-" . bin2hex(random_bytes(6)) . "." . $extensions[$mime];
    $target = $uploadDir . "/" . $fileName;

    if (!move_uploaded_file($tmpName, $target)) {
        staff_service_fail("Imazhi nuk u ruajt.");
    }

    return "public/uploads/job-updates/" . $fileName;
}

?>
