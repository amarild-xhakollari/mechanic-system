# Cars DB Reference

This file is the shared reference for the `cars_db` database. I will use it when helping write SQL queries for this project.

## Database Overview

Database name: `cars_db`

Main business flow:

1. `users` stores admins, staff, and clients.
2. `vehicles` links a client to a specific entry in `carsmodels`.
3. `jobs` links a client, vehicle, assigned staff member, and creator.
4. `job_updates` stores the history of status changes and notes for each job.
5. `audit_log` stores generic audit entries for inserts, updates, deletes, and logins.
6. `job_history_view` is a ready-made reporting view joining jobs, updates, and user names.

## Entity Relationship Map

```text
users
  user_id PK
    |--< vehicles.client_id
    |--< jobs.client_id
    |--< jobs.staff_id
    |--< jobs.created_by
    |--< job_updates.updated_by

carsmodels
  id PK
    |--< vehicles.car_model_id

vehicles
  vehicle_id PK
    |--< jobs.vehicle_id

jobs
  job_id PK
    |--< job_updates.job_id

audit_log
  standalone audit table

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
- `vehicle_id` should usually belong to the same client referenced by `client_id`.

### `job_updates`

Purpose: Stores timeline entries for job status changes and notes.

Columns:

- `update_id` `int` PK, auto increment
- `job_id` `int` FK -> `jobs.job_id`
- `updated_by` `int` FK -> `users.user_id`
- `old_status` `varchar(20)`
- `new_status` `varchar(20)`
- `note` `text`
- `updated_at` `datetime` default `CURRENT_TIMESTAMP`

Important notes:

- A job can have many updates.
- This table is the main source for job history and progress notes.

### `audit_log`

Purpose: Generic audit trail across entities and auth events.

Columns:

- `audit_id` `bigint` PK, auto increment
- `entity_name` `enum('users','vehicles','jobs','job_updates','auth')`
- `entity_id` `int`
- `action` `enum('INSERT','UPDATE','DELETE','LOGIN')`
- `user_id` `int`
- `old_data` `json`
- `new_data` `json`
- `created_at` `timestamp` default `CURRENT_TIMESTAMP`

Important notes:

- `user_id` is not declared as a foreign key in the dump, even though it likely refers to `users.user_id`.
- `entity_id` is polymorphic and depends on `entity_name`.

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

## Foreign Keys

- `vehicles.client_id` -> `users.user_id`
- `vehicles.car_model_id` -> `carsmodels.id`
- `jobs.client_id` -> `users.user_id`
- `jobs.vehicle_id` -> `vehicles.vehicle_id`
- `jobs.staff_id` -> `users.user_id`
- `jobs.created_by` -> `users.user_id`
- `job_updates.job_id` -> `jobs.job_id`
- `job_updates.updated_by` -> `users.user_id`

## Enums

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

### `audit_log.entity_name`

- `users`
- `vehicles`
- `jobs`
- `job_updates`
- `auth`

### `audit_log.action`

- `INSERT`
- `UPDATE`
- `DELETE`
- `LOGIN`

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

## Query Rules To Remember

- When joining `users` more than once, always use clear aliases like `client_user`, `staff_user`, and `creator_user`.
- Filter `users.role` when the query depends on business meaning, not just the foreign key.
- Use `LEFT JOIN` to `job_updates` if you still want jobs with no updates.
- Use `job_history_view` for readable reporting queries, but query base tables directly for strict aggregation or latest-row logic.
- `carsmodels` is large lookup data, so search it by `company_name`, `car_name`, or `id`.
- `audit_log.entity_id` is not tied to one fixed table; interpret it together with `entity_name`.

## Data Availability Notes

- The provided dumps contain structure for all tables.
- `carsmodels` includes populated lookup data.
- The other table dumps shown here appear to have no inserted rows in the files provided.

