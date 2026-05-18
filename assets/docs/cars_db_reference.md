# Cars DB Reference

This file is the shared reference for the `cars_db` database. Use it when writing SQL queries, API code, seed scripts, migrations, and debugging data flows for this project.

Last updated: 2026-05-18

## Database Overview

Database name: `cars_db`

Main business flow:

1. `users` stores admins, staff, and clients.
2. `vehicles` links a client to a specific entry in `carsmodels`.
3. `jobs` links a client, vehicle, assigned staff member, and creator.
4. `job_updates` stores job history notes, status changes, and optional service/update images.
5. `job_services` stores staff-created service cards for a job, including optional images and soft-delete state.
6. `notifications` stores in-app, SMS, and email notifications for users.
7. `audit_log` stores detailed audit events for inserts, updates, deletes, logins, and other actions.
8. `job_history_view` is a ready-made reporting view joining jobs, updates, and user names.

## Entity Relationship Map

```text
users
  user_id PK
    |--< vehicles.client_id
    |--< jobs.client_id
    |--< jobs.staff_id
    |--< jobs.created_by
    |--< job_updates.updated_by
    |--< job_services.created_by
    |--< notifications.recipient_user_id
    |--< audit_log.actor_user_id

carsmodels
  id PK
    |--< vehicles.car_model_id

vehicles
  vehicle_id PK
    |--< jobs.vehicle_id

jobs
  job_id PK
    |--< job_updates.job_id
    |--< job_services.job_id
    |--< notifications.job_id

job_updates
  update_id PK

job_services
  service_id PK

notifications
  notification_id PK

audit_log
  standalone audit/event table

job_history_view
  reporting view built from jobs + job_updates + users
```

## Tables

### `users`

Purpose: Stores system users across all roles.

Columns:

- `user_id` `int` PK, auto increment
- `first_name` `varchar(50)`
- `last_name` `varchar(50)`
- `phone_number` `varchar(20)` unique
- `email` `varchar(100)` unique
- `login_identifier` `varchar(50)` unique
- `role` `enum('admin','staff','client')`
- `password_hash` `varchar(255)`

Important notes:

- A single table is used for admins, staff, and clients.
- Role filtering is important in queries, especially when joining `jobs.staff_id` and `jobs.client_id`.
- Client login uses `phone_number`; staff/admin login uses `login_identifier`.

### `carsmodels`

Purpose: Master lookup table of car makes and models.

Columns:

- `id` `int` PK, auto increment
- `company_name` `varchar(100)`
- `car_name` `varchar(100)`
- `engines` `varchar(100)`
- `capacity` `varchar(50)`
- `horsepower` `varchar(50)`
- `total_speed` `varchar(50)`
- `performance` `varchar(50)`
- `fuel_type` `varchar(50)`
- `seats` `int`
- `torque` `varchar(50)`

Important notes:

- Dump shows `AUTO_INCREMENT=1207`, so the dataset currently contains about 1206 model rows.
- This table is descriptive lookup data and is normally joined through `vehicles.car_model_id`.

### `vehicles`

Purpose: Stores customer vehicles.

Columns:

- `vehicle_id` `int` PK, auto increment
- `client_id` `int` FK -> `users.user_id`
- `car_model_id` `int` FK -> `carsmodels.id`
- `plate_number` `varchar(20)` unique
- `vin` `varchar(50)` unique

Important notes:

- Every vehicle belongs to one client.
- Every vehicle points to one row in `carsmodels`.
- When creating a job, the vehicle should belong to the same client referenced by `jobs.client_id`.

### `jobs`

Purpose: Stores repair or maintenance jobs.

Columns:

- `job_id` `int` PK, auto increment
- `client_id` `int` FK -> `users.user_id`
- `vehicle_id` `int` FK -> `vehicles.vehicle_id`
- `staff_id` `int` FK -> `users.user_id`
- `created_by` `int` FK -> `users.user_id`
- `description` `text`
- `job_type` `enum('maintenance','damage_repair')`
- `status` `enum('created','in_progress','completed','cancelled')` default `'created'`
- `created_at` `datetime` default `CURRENT_TIMESTAMP`
- `updated_at` `datetime` default `CURRENT_TIMESTAMP`, auto-updated on row update

Important notes:

- `client_id`, `staff_id`, and `created_by` all point to `users`, but each means something different.
- Staff service APIs only allow access when `jobs.staff_id` matches the logged-in staff user.
- Completing a job changes `jobs.status` to `completed` and writes a `job_updates` history row.

### `job_updates`

Purpose: Stores timeline entries for job status changes, notes, and staff service/update image uploads.

Columns:

- `update_id` `int` PK, auto increment
- `job_id` `int` FK -> `jobs.job_id`
- `updated_by` `int` FK -> `users.user_id`
- `old_status` `varchar(20)`
- `new_status` `varchar(20)`
- `note` `text`
- `image_path` `varchar(255)` nullable, added lazily by `staff_update_image_column_exists()`
- `updated_at` `datetime` default `CURRENT_TIMESTAMP`

Important notes:

- A job can have many updates.
- `image_path` is used by staff service update uploads and is stored as a project-relative path such as `public/uploads/job-updates/...`.
- `job_services_log_update()` also writes history rows here when a service card is added, edited, or deleted.

### `job_services`

Purpose: Stores staff-created service cards linked to a job.

Columns:

- `service_id` `int` PK, auto increment
- `job_id` `int` FK -> `jobs.job_id`
- `created_by` `int` FK -> `users.user_id`
- `title` `varchar(160)`
- `description` `text`
- `image_path` `varchar(255)` nullable
- `status` `enum('active','deleted')` default `'active'`
- `created_at` `datetime` default `CURRENT_TIMESTAMP`
- `updated_at` `datetime` default `CURRENT_TIMESTAMP`, auto-updated on row update
- `deleted_at` `datetime` nullable

Important notes:

- Created automatically by `job_services_ensure_table()` if missing.
- Deletes are soft deletes: `status='deleted'` and `deleted_at=NOW()`.
- Active service queries filter with `status <> 'deleted'`.
- `image_path` is stored as a project-relative path such as `public/uploads/job-services/...`.

### `notifications`

Purpose: Stores notification records for in-app display plus optional SMS/email delivery tracking.

Columns:

- `notification_id` `int` PK, auto increment
- `recipient_user_id` `int` references `users.user_id` by convention
- `recipient_role` `enum('admin','staff','client')`
- `job_id` `int` nullable, references `jobs.job_id` by convention
- `channel` `enum('in_app','sms','email')` default `'in_app'`
- `event_type` `varchar(80)`
- `title` `varchar(180)`
- `message` `text`
- `recipient` `varchar(255)` nullable
- `status` `enum('pending','sent','failed','skipped','read')` default `'pending'`
- `provider_sid` `varchar(120)` nullable
- `error_message` `text` nullable
- `metadata` `json` nullable
- `read_at` `timestamp` nullable
- `sent_at` `timestamp` nullable
- `created_at` `timestamp` default `CURRENT_TIMESTAMP`

Indexes:

- `idx_notifications_user_created (recipient_user_id, created_at)`
- `idx_notifications_user_status (recipient_user_id, status)`
- `idx_notifications_job (job_id)`

Important notes:

- Created automatically by `notifications_ensure_table()` if missing.
- In-app notifications start as `pending`; reading them sets `status='read'` and `read_at=NOW()`.
- SMS/email notifications update `status`, `sent_at`, `provider_sid`, and `error_message` based on delivery outcome.
- Current event types include `profile_created`, `job_created`, `job_assigned`, `service_added`, `service_updated`, `service_deleted`, and `job_completed`.

### `audit_log`

Purpose: Detailed audit/event trail across entities and auth events.

Current v2 columns:

- `audit_id` `bigint` PK, auto increment
- `actor_user_id` `int` nullable, references `users.user_id` by convention
- `actor_role` `varchar(30)` nullable
- `action` `varchar(40)`
- `entity_type` `varchar(50)`
- `entity_id` `int` nullable
- `entity_label` `varchar(160)` nullable
- `description` `text` nullable
- `old_values` `json` nullable
- `new_values` `json` nullable
- `changed_fields` `json` nullable
- `request_method` `varchar(10)` nullable
- `request_path` `varchar(255)` nullable
- `ip_address` `varchar(45)` nullable
- `user_agent` `text` nullable
- `session_id_hash` `varchar(128)` nullable
- `status` `enum('success','failed')` default `'success'`
- `error_message` `text` nullable
- `created_at` `timestamp` default `CURRENT_TIMESTAMP`

Indexes:

- `idx_audit_actor (actor_user_id)`
- `idx_audit_entity (entity_type, entity_id)`
- `idx_audit_action (action)`
- `idx_audit_created_at (created_at)`

Important notes:

- Run `scripts/migrate_audit_log_v2.php` to migrate older audit tables.
- Older columns `entity_name`, `user_id`, `old_data`, and `new_data` are migrated into v2 columns and then removed by the migration.
- `entity_type` is a string, not an enum. Current values include `users`, `vehicles`, `jobs`, `job_updates`, `job_services`, `auth`, and `system`.
- `entity_id` is polymorphic and depends on `entity_type`.

## View

### `job_history_view`

Purpose: Pre-joined reporting view for job history.

Base tables:

- `jobs` as `j`
- `job_updates` as `u`
- `users` as `c` for client
- `users` as `s` for staff
- `users` as `up` for updater

Columns exposed:

- `job_id`
- `vehicle_id`
- `client_id`
- `staff_id`
- `description`
- `job_type`
- `status`
- `created_at`
- `update_id`
- `old_status`
- `new_status`
- `note`
- `updated_at`
- `client_name`
- `staff_name`
- `updated_by_name`

Important notes:

- Uses a `LEFT JOIN` from `jobs` to `job_updates`, so jobs without updates still appear.
- Good for reporting and history pages.
- Less ideal when you need exact control over grouping or only the latest update per job.
- If the database view has not been refreshed since `job_updates.image_path` was added, the view may not expose `image_path`.

## Foreign Keys And Relationships

Declared foreign keys:

- `vehicles.client_id` -> `users.user_id`
- `vehicles.car_model_id` -> `carsmodels.id`
- `jobs.client_id` -> `users.user_id`
- `jobs.vehicle_id` -> `vehicles.vehicle_id`
- `jobs.staff_id` -> `users.user_id`
- `jobs.created_by` -> `users.user_id`
- `job_updates.job_id` -> `jobs.job_id`
- `job_updates.updated_by` -> `users.user_id`
- `job_services.job_id` -> `jobs.job_id` with cascade delete/update
- `job_services.created_by` -> `users.user_id` with restrict delete and cascade update

Application-level relationships:

- `notifications.recipient_user_id` -> `users.user_id`
- `notifications.job_id` -> `jobs.job_id`
- `audit_log.actor_user_id` -> `users.user_id`

## Enums And Fixed Values

### `users.role`

- `admin`
- `staff`
- `client`

### `jobs.job_type`

- `maintenance`
- `damage_repair`

### `jobs.status`

- `created`
- `in_progress`
- `completed`
- `cancelled`

### `job_services.status`

- `active`
- `deleted`

### `notifications.recipient_role`

- `admin`
- `staff`
- `client`

### `notifications.channel`

- `in_app`
- `sms`
- `email`

### `notifications.status`

- `pending`
- `sent`
- `failed`
- `skipped`
- `read`

### `audit_log.status`

- `success`
- `failed`

## Query Join Guide

### Common joins

Client vehicles with model info:

```sql
SELECT
  v.vehicle_id,
  v.plate_number,
  v.vin,
  cm.company_name,
  cm.car_name
FROM vehicles v
JOIN users u ON u.user_id = v.client_id
JOIN carsmodels cm ON cm.id = v.car_model_id
WHERE u.role = 'client';
```

Jobs with client and staff names:

```sql
SELECT
  j.job_id,
  CONCAT(c.first_name, ' ', c.last_name) AS client_name,
  CONCAT(s.first_name, ' ', s.last_name) AS staff_name,
  j.status,
  j.job_type,
  j.created_at
FROM jobs j
JOIN users c ON c.user_id = j.client_id
JOIN users s ON s.user_id = j.staff_id;
```

Jobs with vehicle and model:

```sql
SELECT
  j.job_id,
  j.status,
  v.plate_number,
  cm.company_name,
  cm.car_name
FROM jobs j
JOIN vehicles v ON v.vehicle_id = j.vehicle_id
JOIN carsmodels cm ON cm.id = v.car_model_id;
```

Active services for a job:

```sql
SELECT
  js.service_id,
  js.title,
  js.description,
  js.image_path,
  js.created_at,
  js.updated_at
FROM job_services js
WHERE js.job_id = ?
  AND js.status <> 'deleted'
ORDER BY js.created_at DESC;
```

Latest update per job:

```sql
SELECT ju.*
FROM job_updates ju
JOIN (
  SELECT job_id, MAX(updated_at) AS latest_updated_at
  FROM job_updates
  GROUP BY job_id
) latest
  ON latest.job_id = ju.job_id
 AND latest.latest_updated_at = ju.updated_at;
```

Unread in-app notifications for a user:

```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE recipient_user_id = ?
  AND recipient_role = ?
  AND channel = 'in_app'
  AND status <> 'read';
```

Recent audit entries with actor names:

```sql
SELECT
  audit.audit_id,
  audit.action,
  audit.entity_type,
  audit.entity_id,
  audit.description,
  CONCAT(actor.first_name, ' ', actor.last_name) AS actor_name,
  audit.created_at
FROM audit_log audit
LEFT JOIN users actor ON actor.user_id = audit.actor_user_id
ORDER BY audit.created_at DESC
LIMIT 50;
```

## Query Rules To Remember

- When joining `users` more than once, always use clear aliases like `client_user`, `staff_user`, and `creator_user`.
- Filter `users.role` when the query depends on business meaning, not just the foreign key.
- Use `LEFT JOIN` to `job_updates` if you still want jobs with no updates.
- Use `job_history_view` for readable reporting queries, but query base tables directly for strict aggregation or latest-row logic.
- Filter `job_services.status <> 'deleted'` unless you explicitly need deleted services.
- For notifications, in-app read state is stored in `notifications.status`, not in a separate boolean.
- `carsmodels` is large lookup data, so search it by `company_name`, `car_name`, or `id`.
- `audit_log.entity_id` is not tied to one fixed table; interpret it together with `entity_type`.

## Data Availability Notes

- The provided dumps contain structure for the core tables.
- `carsmodels` includes populated lookup data.
- `job_services`, `notifications`, and the v2 `audit_log` shape can be created or migrated by project scripts/helpers.
- `job_updates.image_path` is added lazily by staff service update code if it is missing.
