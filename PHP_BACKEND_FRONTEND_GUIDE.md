# PHP Backend Guide for the Frontend

This guide explains how to connect the current frontend dashboard to a PHP backend without changing the frontend component structure.

## Current Frontend Files

The admin dashboard is split into:

- `src/frontend/admin_dashboard.html`
- `src/frontend/admin_dashboard.css`
- `src/frontend/admin_dashboard.js`

Reusable components are loaded from:

- `src/frontend_components/nav-bar/header-nav.js`
- `src/frontend_components/job_card/job-card.js`
- `src/frontend_components/staff_card/staff-card.js`

The dashboard JavaScript currently tries to fetch data from:

```js
../api/admin_dashboard.php
```

Because `admin_dashboard.html` is inside `src/frontend`, that path points to:

```text
src/api/admin_dashboard.php
```

If the PHP endpoint does not exist yet, the frontend uses demo data automatically.

## Recommended API Folder

Create a new folder:

```text
src/api/
```

Recommended backend files:

```text
src/api/admin_dashboard.php
src/api/jobs.php
src/api/staff.php
src/api/clients.php
src/api/logout.php
```

Start with only `admin_dashboard.php`. You can split into smaller files later.

## JSON Shape Required by Frontend

`admin_dashboard.php` should return JSON in this shape:

```json
{
  "user": {
    "name": "User Name",
    "role": "Administrator",
    "logoutText": "Dil nga llogaria"
  },
  "notificationCount": 2,
  "stats": {
    "activeJobs": 4,
    "staff": 4,
    "clients": 4
  },
  "jobs": [
    {
      "id": 1,
      "code": "AB 123 CD",
      "client": "Emri i Klienti",
      "mechanicsLabel": "Mekaniket",
      "mechanics": ["Emri Mekanikut 1", "Emri Mekanikut 2"],
      "dateLabel": "Data e Perfundimit",
      "date": "30/09/2025",
      "status": "Aktiv"
    }
  ],
  "staff": [
    {
      "id": 1,
      "name": "Arben Hoxha",
      "tags": ["Mekanik", "Elektronike"]
    }
  ],
  "clients": [
    {
      "id": 1,
      "name": "Emri i Klienti",
      "detail": "4 pune aktive"
    }
  ]
}
```

## Basic PHP Endpoint Template

Create `src/api/admin_dashboard.php`:

```php
<?php
header('Content-Type: application/json; charset=utf-8');

$conn = require __DIR__ . '/../configs/db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Replace these demo arrays with database queries.
$data = [
    'user' => [
        'name' => 'User Name',
        'role' => 'Administrator',
        'logoutText' => 'Dil nga llogaria',
    ],
    'notificationCount' => 2,
    'stats' => [
        'activeJobs' => 4,
        'staff' => 4,
        'clients' => 4,
    ],
    'jobs' => [],
    'staff' => [],
    'clients' => [],
];

echo json_encode($data);
```

Important: a JSON endpoint must not output extra text before `json_encode`. No debug `echo`, no `print_r`, and no HTML.

## Example Database Queries

Use prepared statements when data comes from users. For dashboard reads, simple SELECT queries are usually enough if there is no user input.

Example staff query:

```php
$staff = [];
$result = $conn->query("SELECT id, first_name, last_name FROM users WHERE role = 'staff' LIMIT 5");

while ($row = $result->fetch_assoc()) {
    $staff[] = [
        'id' => (int) $row['id'],
        'name' => $row['first_name'] . ' ' . $row['last_name'],
        'tags' => ['Mekanik', 'Elektronike'],
    ];
}
```

Example clients query:

```php
$clients = [];
$result = $conn->query("SELECT id, first_name, last_name FROM users WHERE role = 'client' LIMIT 10");

while ($row = $result->fetch_assoc()) {
    $clients[] = [
        'id' => (int) $row['id'],
        'name' => $row['first_name'] . ' ' . $row['last_name'],
        'detail' => '0 pune aktive',
    ];
}
```

## Frontend Fetch Flow

`admin_dashboard.js` already does this:

1. Shows a loading state.
2. Calls `../api/admin_dashboard.php`.
3. If PHP returns valid JSON, it renders real data.
4. If PHP fails or does not exist, it renders demo data.

So your first backend goal is simply:

```text
Open admin_dashboard.html through a PHP server and make ../api/admin_dashboard.php return valid JSON.
```

Do not open the page as a plain file when testing PHP. Use a local server like XAMPP, WAMP, Laragon, or PHP's built-in server.

## PHP Built-In Server Example

From the project root:

```bash
php -S localhost:8000
```

Then open:

```text
http://localhost:8000/src/frontend/admin_dashboard.html
```

Test the API directly:

```text
http://localhost:8000/src/api/admin_dashboard.php
```

The API page should show JSON only.

## Actions to Add Later

The frontend currently shows clickable feedback for buttons. Later you can connect them to PHP endpoints:

- Register job button: POST to `src/api/jobs.php`
- Job card click: GET `src/api/jobs.php?id=1`
- Staff card click: GET `src/api/staff.php?id=1`
- Clients tab: GET clients from `src/api/clients.php`
- Logout: POST to `src/api/logout.php`

Recommended POST example from frontend:

```js
fetch('../api/jobs.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        code: 'AB 123 CD',
        clientId: 1,
        mechanicIds: [2, 3],
        dueDate: '2025-09-30'
    })
});
```

PHP reads JSON POST data like this:

```php
$input = json_decode(file_get_contents('php://input'), true);
```

## Checklist

- Create `src/api/admin_dashboard.php`.
- Return the exact JSON shape shown above.
- Run the page through a PHP server.
- Confirm the API URL returns JSON only.
- Replace demo arrays in PHP with database queries.
- Keep frontend components reusable by sending data in the expected shape.
