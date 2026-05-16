<?php

function audit_json_or_null($value) {
    if ($value === null || $value === []) {
        return null;
    }

    return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function audit_current_path() {
    $uri = $_SERVER["REQUEST_URI"] ?? "";
    return substr($uri, 0, 255);
}

function audit_session_hash() {
    if (session_status() === PHP_SESSION_NONE) {
        return null;
    }

    $sessionId = session_id();
    return $sessionId ? hash("sha256", $sessionId) : null;
}

function audit_log_event(mysqli $conn, array $event): void {
    try {
        if (array_key_exists("actor_user_id", $event)) {
            $actorUserId = $event["actor_user_id"] !== null ? (int) $event["actor_user_id"] : null;
        } else {
            $actorUserId = isset($_SESSION["user_id"]) ? (int) $_SESSION["user_id"] : null;
        }
        $actorRole = $event["actor_role"] ?? ($_SESSION["role"] ?? null);
        $action = strtoupper($event["action"] ?? "LOG");
        $entityType = $event["entity_type"] ?? "system";
        $entityId = isset($event["entity_id"]) && $event["entity_id"] !== null ? (int) $event["entity_id"] : null;
        $entityLabel = $event["entity_label"] ?? null;
        $description = $event["description"] ?? null;
        $oldValues = audit_json_or_null($event["old_values"] ?? null);
        $newValues = audit_json_or_null($event["new_values"] ?? null);
        $changedFields = audit_json_or_null($event["changed_fields"] ?? null);
        $requestMethod = substr($_SERVER["REQUEST_METHOD"] ?? "", 0, 10);
        $requestPath = audit_current_path();
        $ipAddress = substr($_SERVER["REMOTE_ADDR"] ?? "", 0, 45);
        $userAgent = $_SERVER["HTTP_USER_AGENT"] ?? null;
        $sessionHash = audit_session_hash();
        $status = $event["status"] ?? "success";
        $errorMessage = $event["error_message"] ?? null;

        $stmt = $conn->prepare("
            INSERT INTO audit_log
                (actor_user_id, actor_role, action, entity_type, entity_id, entity_label, description, old_values, new_values, changed_fields, request_method, request_path, ip_address, user_agent, session_id_hash, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        if (!$stmt) {
            return;
        }

        $stmt->bind_param(
            "isssissssssssssss",
            $actorUserId,
            $actorRole,
            $action,
            $entityType,
            $entityId,
            $entityLabel,
            $description,
            $oldValues,
            $newValues,
            $changedFields,
            $requestMethod,
            $requestPath,
            $ipAddress,
            $userAgent,
            $sessionHash,
            $status,
            $errorMessage
        );
        $stmt->execute();
    } catch (Throwable $error) {
        error_log("Audit log failed: " . $error->getMessage());
    }
}

?>
