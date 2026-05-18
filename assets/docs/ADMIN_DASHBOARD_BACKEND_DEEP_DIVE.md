# Admin Dashboard Backend Deep Dive

This document explains the admin dashboard backend in depth. It focuses only on the PHP backend files that protect the dashboard API, connect to MySQL, collect dashboard data, and return JSON to the frontend.

## Admin Dashboard Backend Purpose

The admin dashboard backend decides:

- whether the current user is allowed to access admin dashboard data
- how to connect to the database
- which logged-in admin user is using the dashboard
- how many active jobs, staff, and clients exist
- which active jobs should be shown
- which staff members should be shown
- which clients should be shown
- what JSON structure should be returned to the dashboard page

This module does not create, update, or delete records. It mainly reads data from the database and sends it back as JSON.

## Main Files

Backend API entry point:

- `src/admin/api/get_dashboard_data.php`

Backend helper file:

- `src/admin/api/dashboard_functions.php`

Already-covered backend dependency:

- `src/auth/session.php`

Database connection dependency:

- `src/config/db.php`

## Full Admin Dashboard Backend Flow

1. Admin dashboard JavaScript sends a request to `src/admin/api/get_dashboard_data.php`.
2. PHP sets the response type to JSON.
3. PHP loads the session helper file.
4. PHP starts the session if it is not already started.
5. PHP checks that the current user is an admin using `requireAdminJson()`.
6. PHP loads `dashboard_functions.php`.
7. PHP connects to the database using `connect_to_database()`.
8. PHP collects all dashboard data using `get_dashboard_data($conn)`.
9. PHP converts the dashboard array into JSON using `json_encode()`.
10. PHP closes the MySQL connection.

## Backend API Entry Point

File:

```text
src/admin/api/get_dashboard_data.php
```

Important lines:

```php
3: header("Content-Type: application/json");
```

This tells the browser that the response is JSON, not HTML.

This matters because the frontend expects data like:

```json
{
  "user": {},
  "stats": {},
  "jobs": []
}
```

not a rendered web page.

```php
5: require_once __DIR__ . "/../../auth/session.php";
```

This loads the session and authorization helper functions.

- `require_once` prevents the same file from being loaded twice.
- `__DIR__` means the current folder: `src/admin/api`.
- `/../../auth/session.php` moves two folders up and enters `auth/session.php`.

This line connects the admin dashboard API to the authentication/session module that was already covered.

```php
6: startSessionIfNeeded();
```

This starts the PHP session only if it has not already been started.

The dashboard API needs the session because the logged-in user is stored in `$_SESSION`.

```php
7: requireAdminJson();
```

This protects the endpoint.

It checks that:

- a user is logged in
- the user role is admin
- failed access returns a JSON response instead of an HTML redirect

This is important because this file is an API endpoint, so unauthorized responses should also be JSON.

```php
9: require "dashboard_functions.php";
```

This loads the helper functions used to build the dashboard response.

The API file stays short because most SQL logic is separated into `dashboard_functions.php`.

```php
11: $conn = connect_to_database();
```

This creates the MySQL connection.

The actual connection details are not written here. They are loaded through the helper function in `dashboard_functions.php`.

```php
12: $data = get_dashboard_data($conn);
```

This gets all admin dashboard data in one array.

The `$conn` variable is passed in so every helper function can use the same database connection.

```php
14: echo json_encode($data);
```

This converts the PHP array into JSON and sends it to the browser.

Without `json_encode()`, the frontend JavaScript could not easily read the PHP array.

```php
16: mysqli_close($conn);
```

This closes the database connection after the response data has been created.

## Dashboard Helper Functions

File:

```text
src/admin/api/dashboard_functions.php
```

This file contains the database helper functions for the admin dashboard.

The most important idea is:

- `get_dashboard_data()` is the main function
- the other functions each prepare one small part of the dashboard response

## Function: connect_to_database()

Important lines:

```php
3: function connect_to_database() {
4:     return require __DIR__ . "/../../config/db.php";
5: }
```

This function loads the database connection file.

- `__DIR__` points to `src/admin/api`.
- `/../../config/db.php` moves to `src/config/db.php`.
- `return require` means the value returned by `db.php` becomes the result of this function.

So when the API calls:

```php
$conn = connect_to_database();
```

it receives the MySQL connection from `src/config/db.php`.

## Function: get_number()

Important lines:

```php
7: function get_number($conn, $sql) {
8:     $result = mysqli_query($conn, $sql);
```

This function receives:

- `$conn`: the database connection
- `$sql`: a SQL count query

It runs the query using `mysqli_query()`.

```php
10:     if (!$result) {
11:         return 0;
12:     }
```

If the query fails, the function returns `0`.

This prevents the whole dashboard from crashing if one count query has a problem.

```php
14:     $row = mysqli_fetch_assoc($result);
15:     return (int) $row["total"];
```

This reads the first row returned by SQL.

The SQL queries use:

```sql
COUNT(*) AS total
```

so the result is accessed with:

```php
$row["total"]
```

The value is converted to an integer using `(int)` because counts should be numbers, not strings.

## Function: get_logged_user()

Important lines:

```php
18: function get_logged_user($conn) {
19:     if (!isset($_SESSION["user_id"])) {
```

This function gets the currently logged-in user's name and role.

It first checks if `$_SESSION["user_id"]` exists.

```php
20:         return [
21:             "name" => "",
22:             "role" => "",
23:             "logoutText" => "Dil nga llogaria"
24:         ];
```

If there is no user in the session, it returns an empty user structure.

This gives the frontend predictable keys even when user data cannot be found.

```php
27:     $user_id = (int) $_SESSION["user_id"];
```

This gets the logged-in user's id from the session.

The `(int)` cast is important because the value is placed into SQL later. Casting it to an integer prevents non-numeric text from being used as part of the query.

```php
29:     $sql = "
30:         SELECT first_name, last_name, role
31:         FROM users
32:         WHERE user_id = $user_id
33:         LIMIT 1
34:     ";
```

This SQL finds the logged-in user in the `users` table.

It selects only:

- `first_name`
- `last_name`
- `role`

`LIMIT 1` is used because one `user_id` should match only one user.

```php
36:     $result = mysqli_query($conn, $sql);
```

This runs the query.

```php
38:     if (!$result || mysqli_num_rows($result) === 0) {
```

This checks two failure cases:

- the SQL query failed
- the query succeeded but found no user

In both cases, the function returns an empty user structure.

```php
46:     $row = mysqli_fetch_assoc($result);
```

This converts the database result row into an associative PHP array.

```php
48:     return [
49:         "name" => trim($row["first_name"] . " " . $row["last_name"]),
50:         "role" => $row["role"],
51:         "logoutText" => "Dil nga llogaria"
52:     ];
```

This returns the final user data for the dashboard.

`trim()` removes extra spaces if one of the name parts is empty.

## Function: get_dashboard_stats()

Important lines:

```php
55: function get_dashboard_stats($conn) {
56:     return [
57:         "activeJobs" => get_number($conn, "SELECT COUNT(*) AS total FROM jobs WHERE status IN ('created', 'in_progress')"),
58:         "staff" => get_number($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'staff'"),
59:         "clients" => get_number($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'client'")
60:     ];
```

This function returns the small number cards shown on the admin dashboard.

It calculates:

- active jobs
- staff users
- client users

The `activeJobs` query counts jobs where the status is:

```sql
'created', 'in_progress'
```

That means completed jobs are not counted as active.

The `staff` query counts users with:

```sql
role = 'staff'
```

The `clients` query counts users with:

```sql
role = 'client'
```

All three queries use `get_number()` so the dashboard receives clean integer values.

## Function: get_active_jobs()

Important lines:

```php
63: function get_active_jobs($conn) {
64:     $jobs = [];
```

This function builds the active jobs list.

It starts with an empty array so the function can safely return an empty list if no jobs are found.

```php
66:     $sql = "
67:         SELECT
68:             j.job_id,
69:             j.status,
70:             j.updated_at,
71:             v.plate_number,
72:             CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name,
73:             CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
74:         FROM jobs j
75:         LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
76:         LEFT JOIN users client_user ON client_user.user_id = j.client_id
77:         LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
78:         WHERE j.status IN ('created', 'in_progress')
79:         ORDER BY j.updated_at DESC
80:     ";
```

This SQL gets active jobs with their related vehicle, client, and staff data.

The main table is:

```sql
FROM jobs j
```

The `j` is an alias for the `jobs` table.

The query uses `LEFT JOIN` because the dashboard can still show a job even if some related data is missing.

Examples:

- a job may not have an assigned staff member yet
- vehicle or user data may be incomplete

The `WHERE` line keeps only active jobs:

```sql
WHERE j.status IN ('created', 'in_progress')
```

The newest updated jobs appear first because of:

```sql
ORDER BY j.updated_at DESC
```

```php
82:     $result = mysqli_query($conn, $sql);
84:     if (!$result) {
85:         return $jobs;
86:     }
```

This runs the query.

If the query fails, it returns the empty `$jobs` array.

```php
88:     while ($row = mysqli_fetch_assoc($result)) {
```

This loops through every active job returned from the database.

```php
89:         $mechanics = [];
91:         if ($row["staff_name"]) {
92:             $mechanics[] = $row["staff_name"];
93:         }
```

This creates a mechanics array for each job.

If a staff member is assigned, the staff name is added. If no staff member is assigned, the array stays empty.

```php
95:         $jobs[] = [
96:             "id" => (int) $row["job_id"],
97:             "code" => $row["plate_number"],
98:             "client" => $row["client_name"],
99:             "mechanicsLabel" => "Mekaniket",
100:             "mechanics" => $mechanics,
101:             "dateLabel" => "Data",
102:             "date" => $row["updated_at"],
103:             "status" => $row["status"]
104:         ];
```

This converts the database row into the exact array shape expected by the dashboard frontend.

`job_id` is cast to an integer because ids should be numeric.

```php
107:     return $jobs;
```

This returns all active jobs.

## Function: get_all_jobs()

Important lines:

```php
110: function get_all_jobs($conn) {
111:     $jobs = [];
```

This function builds a list of all jobs, not only active jobs.

It has almost the same structure as `get_active_jobs()`.

```php
113:     $sql = "
114:         SELECT
115:             j.job_id,
116:             j.status,
117:             j.updated_at,
118:             v.plate_number,
119:             CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name,
120:             CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
121:         FROM jobs j
122:         LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
123:         LEFT JOIN users client_user ON client_user.user_id = j.client_id
124:         LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
125:         ORDER BY j.updated_at DESC
126:     ";
```

The important difference from `get_active_jobs()` is that this query has no `WHERE status IN (...)` filter.

That means it can return:

- created jobs
- in-progress jobs
- completed jobs
- any other job status stored in the table

The rest of the function formats each job into an array with:

- id
- plate number
- client name
- mechanics
- date
- status

## Function: get_staff()

Important lines:

```php
156: function get_staff($conn) {
157:     $staff = [];
158:     $jobs_by_staff = get_staff_active_jobs($conn);
```

This function builds the staff list for the dashboard.

It first calls `get_staff_active_jobs()` so each staff member can include their active assigned jobs.

```php
160:     $sql = "
161:         SELECT user_id, first_name, last_name, role, login_identifier
162:         FROM users
163:         WHERE role = 'staff'
164:         ORDER BY first_name, last_name
165:     ";
```

This SQL selects only users whose role is `staff`.

It orders them alphabetically by first name and last name.

```php
167:     $result = mysqli_query($conn, $sql);
169:     if (!$result) {
170:         return $staff;
171:     }
```

If the query fails, the function returns an empty staff list.

```php
173:     while ($row = mysqli_fetch_assoc($result)) {
174:         $staff_id = (int) $row["user_id"];
175:         $jobs = $jobs_by_staff[$staff_id] ?? [];
```

This loops through every staff user.

The staff id is converted to an integer.

The line:

```php
$jobs = $jobs_by_staff[$staff_id] ?? [];
```

means:

- if this staff member has active jobs, use them
- otherwise use an empty array

```php
177:         $staff[] = [
178:             "id" => $staff_id,
179:             "name" => trim($row["first_name"] . " " . $row["last_name"]),
180:             "code" => $row["login_identifier"] ?: "STAFF-" . $staff_id,
181:             "tags" => [$row["role"]],
182:             "positions" => [$row["role"]],
183:             "assignedJobsLabel" => "Punet e Caktuara",
184:             "jobs" => $jobs,
185:             "jobsInProcess" => [
186:                 "count" => count($jobs),
187:                 "label" => "Pune Ne Proces"
188:             ],
189:             "positionsLabel" => "Pozicionet e punes"
190:         ];
```

This creates one formatted staff object for the frontend.

The `code` field uses the staff login identifier if it exists. If it does not exist, it creates a fallback code:

```php
"STAFF-" . $staff_id
```

The active job count is calculated using:

```php
count($jobs)
```

## Function: get_staff_active_jobs()

Important lines:

```php
196: function get_staff_active_jobs($conn) {
197:     $jobs_by_staff = [];
```

This function groups active jobs by staff member.

The result is not a normal list. It is an array where the key is the staff id.

```php
199:     $sql = "
200:         SELECT
201:             j.job_id,
202:             j.staff_id,
203:             j.updated_at,
204:             v.plate_number,
205:             CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name
206:         FROM jobs j
207:         LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
208:         LEFT JOIN users client_user ON client_user.user_id = j.client_id
209:         WHERE j.status IN ('created', 'in_progress')
210:           AND j.staff_id IS NOT NULL
211:         ORDER BY j.updated_at DESC
212:     ";
```

This SQL selects active jobs that are assigned to a staff member.

The line:

```sql
AND j.staff_id IS NOT NULL
```

removes jobs that have no assigned staff.

```php
220:     while ($row = mysqli_fetch_assoc($result)) {
221:         $staff_id = (int) $row["staff_id"];
```

This loops through each assigned active job and gets the staff id.

```php
223:         if (!isset($jobs_by_staff[$staff_id])) {
224:             $jobs_by_staff[$staff_id] = [];
225:         }
```

This creates an empty array for that staff member the first time they appear.

```php
227:         $jobs_by_staff[$staff_id][] = [
228:             "id" => (int) $row["job_id"],
229:             "code" => $row["plate_number"],
230:             "client" => $row["client_name"],
231:             "date" => $row["updated_at"]
232:         ];
```

This adds the job to that staff member's job list.

```php
235:     return $jobs_by_staff;
```

This returns jobs grouped by staff id.

`get_staff()` uses this grouped data to attach jobs to each staff member.

## Function: get_clients()

Important lines:

```php
238: function get_clients($conn) {
239:     $clients = [];
```

This function builds the client list for the dashboard.

```php
241:     $sql = "
242:         SELECT
243:             u.user_id,
244:             u.first_name,
245:             u.last_name,
246:             u.phone_number,
247:             u.email,
248:             COUNT(j.job_id) AS active_jobs
249:         FROM users u
250:         LEFT JOIN jobs j
251:             ON j.client_id = u.user_id
252:             AND j.status IN ('created', 'in_progress')
253:         WHERE u.role = 'client'
254:         GROUP BY u.user_id, u.first_name, u.last_name, u.phone_number, u.email
255:         ORDER BY u.first_name, u.last_name
256:     ";
```

This SQL selects users whose role is `client`.

It also counts how many active jobs each client has.

The active-job filter is inside the `LEFT JOIN`:

```sql
AND j.status IN ('created', 'in_progress')
```

This means clients with zero active jobs can still appear in the result.

`GROUP BY` is needed because `COUNT(j.job_id)` is used.

```php
258:     $result = mysqli_query($conn, $sql);
260:     if (!$result) {
261:         return $clients;
262:     }
```

If the query fails, the function returns an empty client list.

```php
264:     while ($row = mysqli_fetch_assoc($result)) {
265:         $clients[] = [
266:             "id" => (int) $row["user_id"],
267:             "name" => trim($row["first_name"] . " " . $row["last_name"]),
268:             "phone" => $row["phone_number"],
269:             "email" => $row["email"],
270:             "activeJobs" => (int) $row["active_jobs"],
271:             "detail" => $row["active_jobs"] . " pune aktive"
272:         ];
```

This converts each client row into a frontend-ready client object.

The client id and active job count are converted to integers.

## Function: get_dashboard_data()

Important lines:

```php
278: function get_dashboard_data($conn) {
279:     return [
280:         "user" => get_logged_user($conn),
281:         "notificationCount" => 0,
282:         "stats" => get_dashboard_stats($conn),
283:         "activeJobs" => get_active_jobs($conn),
284:         "jobs" => get_all_jobs($conn),
285:         "staff" => get_staff($conn),
286:         "clients" => get_clients($conn)
287:     ];
```

This is the main function for the admin dashboard API.

It combines all smaller helper functions into one response array.

The final JSON contains:

- `user`: logged-in admin information
- `notificationCount`: currently hardcoded as `0`
- `stats`: dashboard count cards
- `activeJobs`: only created and in-progress jobs
- `jobs`: all jobs
- `staff`: staff list with active assigned jobs
- `clients`: client list with active job counts

This function is called by:

```php
$data = get_dashboard_data($conn);
```

in `get_dashboard_data.php`.

## Final Backend Flow Summary

The admin dashboard backend starts at:

```text
src/admin/api/get_dashboard_data.php
```

That file:

1. returns JSON
2. starts the session
3. requires an admin user
4. loads dashboard helper functions
5. opens the database connection
6. collects dashboard data
7. sends the result as JSON
8. closes the database connection

The actual dashboard data is prepared in:

```text
src/admin/api/dashboard_functions.php
```

The main helper function is:

```php
get_dashboard_data($conn)
```

and it calls smaller functions for:

- logged-in user data
- dashboard statistics
- active jobs
- all jobs
- staff
- clients

## Defense Questions And Answers

Question:

Why does `get_dashboard_data.php` call `requireAdminJson()`?

Answer:

Because this endpoint returns admin dashboard data. It must make sure the user is logged in as an admin before sending any data. The `Json` part means unauthorized errors are returned as JSON, which is correct for an API endpoint.

Question:

Why is `header("Content-Type: application/json")` used?

Answer:

Because the response is not an HTML page. It is data for JavaScript, so the browser should treat it as JSON.

Question:

Why is the database connection passed into functions as `$conn`?

Answer:

So all helper functions reuse the same MySQL connection instead of opening a new connection for every query.

Question:

Why does `get_number()` return `0` if a query fails?

Answer:

Because the dashboard count cards should not crash the whole response if one count query fails. Returning `0` gives the frontend a safe numeric value.

Question:

Why does `get_logged_user()` cast `$_SESSION["user_id"]` to an integer?

Answer:

Because the value is used in a SQL query. Casting it to `(int)` makes sure only a numeric user id is used.

Question:

Why do active job queries use `status IN ('created', 'in_progress')`?

Answer:

Because those statuses represent jobs that are still open or being worked on. Completed jobs are not active.

Question:

Why are `LEFT JOIN`s used instead of normal joins?

Answer:

Because the dashboard can still show a job even if related data is missing, such as an unassigned staff member.

Question:

Why does `get_clients()` put the active job filter inside the `LEFT JOIN`?

Answer:

So clients with zero active jobs are still included. If the status filter was placed in the `WHERE` clause, those clients could disappear from the result.

Question:

Why is `json_encode($data)` needed?

Answer:

Because PHP arrays cannot be used directly by frontend JavaScript. `json_encode()` converts the PHP array into JSON.

Question:

Why is `mysqli_close($conn)` called at the end?

Answer:

Because the API is finished using the database connection after the JSON response has been prepared.
