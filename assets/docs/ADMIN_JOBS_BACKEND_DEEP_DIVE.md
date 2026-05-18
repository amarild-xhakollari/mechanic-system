# Admin Jobs Backend Deep Dive

This document explains the admin jobs backend flow. It includes the relevant HTML and JavaScript lines that send, receive, or process backend data, then explains the PHP files that search jobs, load job details, search related records, and create jobs.

Repeated patterns already covered earlier are kept brief:

- `requireAdminJson()` protects admin APIs
- `header("Content-Type: application/json")` makes the response JSON
- short search text returns `[]`
- `credentials: 'same-origin'` sends the PHP session cookie
- `encodeURIComponent()` safely places values in URLs

## Admin Jobs Backend Purpose

The admin jobs backend handles:

- listing jobs on the admin jobs page
- searching jobs by plate, client, staff, or status
- opening one job's details
- loading job updates and job services
- searching vehicles, car models, clients, and staff while registering a job
- creating jobs with existing or new vehicles
- optionally creating a new client during job registration
- writing audit logs and notifications after job creation

## Main Files

Admin jobs page:

- `src/admin/pages/admin-jobs.html`
- `src/admin/js/admin-jobs.js`

Job details page:

- `src/admin/pages/job-details.html`
- `src/admin/js/job-details.js`

Register job page:

- `src/admin/pages/register-job.html`
- `src/admin/js/register-job.js`
- `src/components/register-job-panel/register-job-panel.js`

Backend APIs/actions:

- `src/admin/api/search_jobs.php`
- `src/admin/api/get_job_details.php`
- `src/admin/actions/createJob.php`
- `src/admin/api/search_vehicles.php`
- `src/admin/api/search_car_model.php`
- `src/admin/api/search_staff_simple.php`
- `src/admin/api/search_user.php`
- `src/admin/actions/searchService.php`

Already-covered dependency:

- `src/admin/js/admin_common.js`
- `src/auth/session.php`
- `src/config/db.php`

## Full Admin Jobs Backend Flow

1. `admin-jobs.html` loads `admin_common.js` and `admin-jobs.js`.
2. `admin_common.js` loads base dashboard data from `get_dashboard_data.php`.
3. `admin-jobs.js` reads `data.jobs` and renders jobs.
4. If admin searches jobs, JavaScript calls `search_jobs.php?q=...`.
5. If admin clicks a job card, the browser opens `job-details.html?job_id=...`.
6. `job-details.js` reads `job_id` and calls `get_job_details.php`.
7. `get_job_details.php` returns job, client, staff, vehicle, car model, updates, and services.
8. If admin opens register job, `register-job.html` loads the register job panel.
9. The panel searches vehicles, clients, car models, and staff through backend APIs.
10. On submit, JavaScript sends JSON to `createJob.php`.
11. `createJob.php` validates the payload, creates missing client/vehicle records if needed, inserts the job, writes audit logs, sends notifications, and returns JSON.

## Admin Jobs Page HTML

File:

```text
src/admin/pages/admin-jobs.html
```

Important backend/data lines:

```html
54: <a class="primary-action" href="register-job.html">
55:     <span>Regjistro Pune</span>
56: </a>
```

This opens the register job page, where the create-job backend flow starts.

```html
63: <div class="panel-search-slot" id="jobs-search"></div>
```

JavaScript inserts the search bar here.

That search bar later calls:

```text
src/admin/api/search_jobs.php
```

```html
65: <button class="job-status-filter__button is-active" type="button" data-job-filter="all">Te gjitha</button>
66: <button class="job-status-filter__button" type="button" data-job-filter="active">Aktive</button>
67: <button class="job-status-filter__button" type="button" data-job-filter="completed">Perfunduar</button>
68: <button class="job-status-filter__button" type="button" data-job-filter="cancelled">Anuluar</button>
```

These buttons filter already-loaded backend job data on the frontend.

```html
74: <div class="jobs-section__grid" id="jobs-active"></div>
78: <div class="jobs-section__grid" id="jobs-completed"></div>
82: <div class="jobs-section__grid" id="jobs-cancelled"></div>
```

These containers receive the job cards after backend job data is processed.

```html
85: <p class="jobs-page-panel__count" data-jobs-count>0 pune ne total</p>
```

This displays the number of visible jobs.

```html
92: <script src="../../components/job_card/job-card.js?v=border-1"></script>
93: <script src="../../components/search-bar/search-bar.js"></script>
94: <script src="../js/admin_common.js"></script>
95: <script src="../js/admin-jobs.js"></script>
```

These scripts render job cards, create the search bar, load backend dashboard data, and control job search/filter logic.

## Admin Jobs JavaScript

File:

```text
src/admin/js/admin-jobs.js
```

Important data/backend lines:

```js
2:     const SEARCH_ENDPOINT = '../api/search_jobs.php';
```

This is the backend API for job search.

```js
3:     let allJobs = [];
4:     let visibleJobs = [];
5:     let activeFilter = 'all';
6:     let searchTimer = null;
7:     let controller = null;
```

These store backend job data and search/filter state.

```js
9:     function renderJobs(jobs) {
10:         const activeContainer = document.querySelector('#jobs-active');
11:         const completedContainer = document.querySelector('#jobs-completed');
12:         const cancelledContainer = document.querySelector('#jobs-cancelled');
13:         const normalizedJobs = filterJobs(jobs.map(AdminPages.normalizeJob));
14:         const activeJobs = normalizedJobs.filter(isActiveJob);
15:         const completedJobs = normalizedJobs.filter(isCompletedJob);
16:         const cancelledJobs = normalizedJobs.filter(isCancelledJob);
```

This takes jobs from the backend, normalizes them, filters them, then splits them by status.

```js
31:     function isActiveJob(job) {
32:         return job.rawStatus === 'created' || job.rawStatus === 'in_progress';
33:     }
```

This defines active jobs using the same backend statuses used in PHP.

```js
35:     function isCompletedJob(job) {
36:         return job.rawStatus === 'completed';
37:     }
39:     function isCancelledJob(job) {
40:         return job.rawStatus === 'cancelled';
41:     }
```

These functions classify completed and cancelled jobs.

```js
43:     function filterJobs(jobs) {
44:         if (activeFilter === 'active') {
45:             return jobs.filter(isActiveJob);
46:         }
48:         if (activeFilter === 'completed') {
49:             return jobs.filter(isCompletedJob);
50:         }
52:         if (activeFilter === 'cancelled') {
53:             return jobs.filter(isCancelledJob);
54:         }
56:         return jobs;
57:     }
```

This filters the backend jobs on the frontend.

```js
86:         jobs.forEach((job) => {
87:             const card = document.createElement('article');
91:             card.addEventListener('click', () => {
92:                 window.location.href = `job-details.html?job_id=${encodeURIComponent(job.id)}`;
93:             });
100:             container.appendChild(card);
101:             createJobCard(card, job);
102:         });
```

This renders each job card.

When clicked, it opens:

```text
job-details.html?job_id=...
```

That `job_id` is later sent to the backend.

```js
105:     async function searchJobs(query) {
106:         const value = query.trim();
107:         clearTimeout(searchTimer);
```

This receives text from the search bar and prepares it.

```js
109:         if (controller) {
110:             controller.abort();
111:         }
```

This cancels older search requests when the admin keeps typing.

```js
113:         if (value.length < 2) {
114:             visibleJobs = allJobs;
115:             renderJobs(visibleJobs);
116:             return;
117:         }
```

Search shorter than 2 characters does not call PHP. It restores the original loaded jobs.

```js
119:         searchTimer = setTimeout(async () => {
120:             controller = new AbortController();
123:                 const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(value)}`, {
124:                     headers: { Accept: 'application/json' },
125:                     credentials: 'same-origin',
126:                     signal: controller.signal
127:                 });
```

This calls:

```text
src/admin/api/search_jobs.php?q=...
```

```js
129:                 if (!response.ok) throw new Error(`Search failed with ${response.status}`);
130:                 visibleJobs = await response.json();
131:                 renderJobs(visibleJobs);
```

This converts the backend JSON into visible jobs and renders them.

```js
141:     AdminPages.loadPage((data) => {
142:         allJobs = Array.isArray(data.jobs) ? data.jobs : [];
143:         visibleJobs = allJobs;
```

This receives the initial `jobs` array from `get_dashboard_data.php`.

```js
145:         createSearchBar(document.querySelector('#jobs-search'), {
146:             placeholder: 'Kerko sipas targes, klientit ose stafit',
147:             onSearch: searchJobs
148:         });
```

This creates the search bar and connects it to `searchJobs()`.

## Search Jobs API

File:

```text
src/admin/api/search_jobs.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
6: $mysqli = require __DIR__ . "/../../config/db.php";
7: require_once __DIR__ . "/../actions/searchService.php";
9: header("Content-Type: application/json");
```

This is the standard protected JSON API setup.

It loads `searchService.php`, where the actual `searchJobs()` SQL function lives.

```php
11: $q = trim($_GET["q"] ?? "");
13: if (strlen($q) < 2) {
14:     echo json_encode([]);
15:     exit;
16: }
```

This reads the search query and returns an empty array if it is too short.

```php
18: echo json_encode(searchJobs($mysqli, $q));
```

This calls the shared search helper and returns JSON.

## Function: searchJobs()

File:

```text
src/admin/actions/searchService.php
```

Important lines:

```php
95: function searchJobs($conn, $query) {
96:     $search = "%" . $query . "%";
```

This prepares the search text for SQL `LIKE`.

```php
98:     $sql = "
99:         SELECT
100:             j.job_id,
101:             j.status,
102:             j.updated_at,
103:             v.plate_number,
104:             CONCAT(client_user.first_name, ' ', client_user.last_name) AS client_name,
105:             CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
106:         FROM jobs j
107:         LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
108:         LEFT JOIN users client_user ON client_user.user_id = j.client_id
109:         LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
110:         WHERE v.plate_number LIKE ?
111:            OR CONCAT(client_user.first_name, ' ', client_user.last_name) LIKE ?
112:            OR CONCAT(staff_user.first_name, ' ', staff_user.last_name) LIKE ?
113:            OR j.status LIKE ?
114:         ORDER BY j.updated_at DESC
115:         LIMIT 30
116:     ";
```

This searches jobs by:

- vehicle plate number
- client full name
- staff full name
- job status

`LEFT JOIN` allows jobs to still appear even if some related data is missing.

```php
118:     $stmt = $conn->prepare($sql);
120:     if (!$stmt) {
121:         return [];
122:     }
124:     $stmt->bind_param("ssss", $search, $search, $search, $search);
125:     $stmt->execute();
```

This uses a prepared statement and binds four search strings.

```php
127:     $jobs = [];
128:     $result = $stmt->get_result();
130:     while ($row = $result->fetch_assoc()) {
```

This prepares the result list and loops through matching jobs.

```php
131:         $mechanics = [];
133:         if ($row["staff_name"]) {
134:             $mechanics[] = $row["staff_name"];
135:         }
```

This makes the mechanics array expected by the job card component.

```php
137:         $jobs[] = [
138:             "id" => (int) $row["job_id"],
139:             "code" => $row["plate_number"],
140:             "client" => $row["client_name"],
141:             "mechanicsLabel" => "Mekaniket",
142:             "mechanics" => $mechanics,
143:             "dateLabel" => "Data",
144:             "date" => $row["updated_at"],
145:             "status" => $row["status"]
146:         ];
```

This formats each database row for frontend job cards.

## Job Details Page HTML

File:

```text
src/admin/pages/job-details.html
```

Important data lines:

```html
56: <a class="staff-job-details-toolbar__back" href="admin-jobs.html" data-admin-job-back>
```

This gives JavaScript a back-link target.

```html
63: <div id="job-details-panel"></div>
```

This container receives the job details returned from the backend.

```html
66: <section class="dashboard-panel staff-service-list-panel" data-service-list-panel hidden>
70: <div class="staff-service-list-panel__grid" data-service-list></div>
```

These receive the job service records returned inside the job details response.

```html
74: <div class="staff-service-modal admin-service-modal" data-service-modal hidden>
78: <div data-service-modal-content></div>
```

These display one selected service from the backend service list.

```html
85: <script src="../js/admin_common.js"></script>
86: <script src="../../components/service-card/service-card.js?v=admin-job-services-1"></script>
87: <script src="../../components/service-detail-panel/service-detail-panel.js?v=admin-job-services-1"></script>
88: <script src="../js/job-details.js?v=admin-job-details-staff-view-1"></script>
```

These scripts load admin session data, render service cards, render service details, and call the job details backend.

## Job Details JavaScript

File:

```text
src/admin/js/job-details.js
```

Important data/backend lines:

```js
4:     let services = [];
```

This stores service records returned from `get_job_details.php`.

```js
16:     function getJobId() {
17:         return new URLSearchParams(window.location.search).get('job_id');
18:     }
```

This reads `job_id` from:

```text
job-details.html?job_id=...
```

```js
79:     function normalizeJob(job = {}) {
80:         const client = job.client ?? {};
81:         const staff = job.staff ?? {};
82:         const vehicle = job.vehicle ?? {};
83:         const carModel = job.car_model ?? {};
```

This starts converting the backend job object into frontend display fields.

```js
87:         return {
88:             id: job.id,
89:             rawStatus: job.status,
90:             code: vehicle.plate_number || 'Pa targe',
91:             client: client.name || '',
92:             clientPhone: client.phone || '',
93:             clientEmail: client.email || '',
95:             type: job.job_type,
96:             date: formatDate(job.created_at),
97:             completedDate: formatDate(job.updated_at),
98:             make,
99:             model,
101:             description: job.description || '',
102:             staffName: staff.name || ''
103:         };
```

This maps backend fields into the fields needed by the details panel.

```js
181:     function openServiceDetails(serviceId) {
182:         const service = services.find((item) => String(item.id) === String(serviceId));
```

This finds a service returned from the backend by id.

```js
193:     function renderServices() {
194:         const panel = document.querySelector('[data-service-list-panel]');
195:         const list = document.querySelector('[data-service-list]');
```

This renders the backend `services` array.

```js
200:         if (services.length === 0) {
201:             list.innerHTML = '<p class="staff-service-list-panel__empty">Nuk ka sherbime te regjistruara ende.</p>';
202:             return;
203:         }
```

If the backend returns no services, the page displays an empty message.

```js
223:     async function fetchJobDetails(jobId) {
224:         const response = await fetch(`../api/get_job_details.php?job_id=${encodeURIComponent(jobId)}`, {
225:             headers: { Accept: 'application/json' },
226:             credentials: 'same-origin'
227:         });
```

This calls:

```text
src/admin/api/get_job_details.php?job_id=...
```

```js
229:         if (!response.ok) {
230:             throw new Error(`Job details API failed with ${response.status}`);
231:         }
233:         return response.json();
```

This checks the backend response and converts JSON into a JavaScript object.

```js
236:     AdminPages.loadPage(async () => {
237:         const mount = document.querySelector('#job-details-panel');
239:         const jobId = getJobId();
```

This waits for admin page loading, finds the details container, and reads the job id.

```js
249:         if (!jobId) {
250:             AdminPages.renderEmpty(mount, 'Mungon ID e punes.');
251:             return;
252:         }
```

If the URL has no job id, JavaScript does not call the backend.

```js
257:             const payload = await fetchJobDetails(jobId);
259:             if (!payload.success) {
260:                 AdminPages.renderEmpty(mount, payload.message || 'Puna nuk u gjet.');
261:                 return;
262:             }
```

This loads the backend payload and handles `"success": false`.

```js
264:             services = Array.isArray(payload.job.services) ? payload.job.services : [];
265:             renderJobDetails(mount, payload.job);
266:             renderServices();
```

This stores backend services, renders the main job details, and renders the service list.

## Get Job Details API

File:

```text
src/admin/api/get_job_details.php
```

Important lines:

```php
3: header("Content-Type: application/json");
5: require_once __DIR__ . "/../../auth/session.php";
6: requireAdminJson();
8: $conn = require __DIR__ . "/../../config/db.php";
```

This is the protected JSON API setup.

```php
10: $job_id = (int) ($_GET["job_id"] ?? 0);
12: if ($job_id <= 0) {
13:     echo json_encode([
14:         "success" => false,
15:         "message" => "Invalid job id."
16:     ]);
17:     exit;
18: }
```

This reads and validates the job id from the URL.

```php
20: $sql = "
21:     SELECT
22:         j.job_id,
23:         j.description,
24:         j.job_type,
25:         j.status,
26:         j.created_at,
27:         j.updated_at,
28:         client_user.first_name AS client_first_name,
29:         client_user.last_name AS client_last_name,
30:         client_user.email AS client_email,
31:         client_user.phone_number AS client_phone,
32:         staff_user.first_name AS staff_first_name,
33:         staff_user.last_name AS staff_last_name,
34:         staff_user.email AS staff_email,
35:         staff_user.phone_number AS staff_phone,
36:         creator_user.first_name AS creator_first_name,
37:         creator_user.last_name AS creator_last_name,
38:         v.vehicle_id,
39:         v.plate_number,
40:         v.vin,
41:         cm.company_name,
42:         cm.car_name,
43:         cm.engines,
44:         cm.capacity,
45:         cm.horsepower,
46:         cm.total_speed,
47:         cm.performance,
48:         cm.fuel_type,
49:         cm.seats,
50:         cm.torque
```

This selects the main job fields plus related client, staff, creator, vehicle, and car model data.

```php
51:     FROM jobs j
52:     LEFT JOIN users client_user
53:         ON client_user.user_id = j.client_id
54:         AND client_user.role = 'client'
55:     LEFT JOIN users staff_user
56:         ON staff_user.user_id = j.staff_id
57:         AND staff_user.role IN ('staff', 'admin')
58:     LEFT JOIN users creator_user
59:         ON creator_user.user_id = j.created_by
60:     LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
61:     LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
62:     WHERE j.job_id = ?
63:     LIMIT 1
64: ";
```

The query uses `LEFT JOIN` so the job can still load even if related data is missing.

```php
66: $stmt = $conn->prepare($sql);
76: $stmt->bind_param("i", $job_id);
77: $stmt->execute();
78: $result = $stmt->get_result();
79: $row = $result->fetch_assoc();
```

This safely runs the job details query using a prepared statement.

```php
81: if (!$row) {
82:     echo json_encode([
83:         "success" => false,
84:         "message" => "Job not found."
85:     ]);
86:     exit;
87: }
```

If no job exists, the API returns a JSON error.

```php
89: $updates = [];
90: $updates_sql = "
91:     SELECT
92:         ju.update_id,
93:         ju.old_status,
94:         ju.new_status,
95:         ju.note,
96:         ju.updated_at,
97:         CONCAT(updater.first_name, ' ', updater.last_name) AS updated_by_name
98:     FROM job_updates ju
99:     LEFT JOIN users updater ON updater.user_id = ju.updated_by
100:     WHERE ju.job_id = ?
101:     ORDER BY ju.updated_at DESC
102: ";
```

This loads status/history updates for the selected job.

```php
104: $updates_stmt = $conn->prepare($updates_sql);
106: if ($updates_stmt) {
107:     $updates_stmt->bind_param("i", $job_id);
108:     $updates_stmt->execute();
```

If the updates query can be prepared, it runs. If not, the updates list stays empty.

```php
111:     while ($update = $updates_result->fetch_assoc()) {
112:         $updates[] = [
113:             "id" => (int) $update["update_id"],
114:             "old_status" => $update["old_status"],
115:             "new_status" => $update["new_status"],
116:             "note" => $update["note"],
117:             "updated_at" => $update["updated_at"],
118:             "updated_by" => trim($update["updated_by_name"] ?? "")
119:         ];
```

This formats job updates for JSON.

```php
123: $client_name = trim(($row["client_first_name"] ?? "") . " " . ($row["client_last_name"] ?? ""));
124: $staff_name = trim(($row["staff_first_name"] ?? "") . " " . ($row["staff_last_name"] ?? ""));
125: $creator_name = trim(($row["creator_first_name"] ?? "") . " " . ($row["creator_last_name"] ?? ""));
126: $services = [];
```

This prepares display names and initializes the services array.

```php
128: $services_table = $conn->query("SHOW TABLES LIKE 'job_services'");
129: if ($services_table && $services_table->num_rows > 0) {
```

This checks if the `job_services` table exists before querying it.

```php
130:     $services_sql = "
131:         SELECT
132:             service_id,
133:             job_id,
134:             created_by,
135:             title,
136:             description,
137:             image_path,
138:             status,
139:             created_at,
140:             updated_at,
141:             deleted_at
142:         FROM job_services
143:         WHERE job_id = ?
144:           AND status <> 'deleted'
145:         ORDER BY created_at DESC, service_id DESC
146:     ";
```

This loads services for the job, excluding deleted services.

```php
155:         while ($service = $services_result->fetch_assoc()) {
156:             $image_path = $service["image_path"] ?? "";
157:             $image_url = $image_path ? "/mechanic-system/" . ltrim($image_path, "/") : "";
```

This prepares the image URL for the frontend.

```php
159:             $services[] = [
160:                 "id" => (int) $service["service_id"],
161:                 "service_id" => (int) $service["service_id"],
162:                 "job_id" => (int) $service["job_id"],
163:                 "created_by" => (int) $service["created_by"],
164:                 "title" => $service["title"],
165:                 "description" => $service["description"],
166:                 "note" => $service["description"],
167:                 "image_path" => $image_path,
168:                 "image_url" => $image_url,
169:                 "image" => $image_url,
170:                 "status" => $service["status"],
171:                 "created_at" => $service["created_at"],
172:                 "updated_at" => $service["updated_at"],
173:                 "deleted_at" => $service["deleted_at"]
174:             ];
```

This formats every service for the frontend service card/detail components.

```php
179: echo json_encode([
180:     "success" => true,
181:     "job" => [
182:         "id" => (int) $row["job_id"],
183:         "description" => $row["description"],
184:         "job_type" => $row["job_type"],
185:         "status" => $row["status"],
186:         "created_at" => $row["created_at"],
187:         "updated_at" => $row["updated_at"],
188:         "created_by" => $creator_name,
```

This starts the final successful JSON response.

```php
189:         "client" => [
190:             "name" => $client_name,
191:             "email" => $row["client_email"],
192:             "phone" => $row["client_phone"]
193:         ],
194:         "staff" => [
195:             "name" => $staff_name,
196:             "email" => $row["staff_email"],
197:             "phone" => $row["staff_phone"]
198:         ],
199:         "vehicle" => [
200:             "id" => (int) ($row["vehicle_id"] ?? 0),
201:             "plate_number" => $row["plate_number"],
202:             "vin" => $row["vin"]
203:         ],
204:         "car_model" => [
205:             "company_name" => $row["company_name"],
206:             "car_name" => $row["car_name"],
207:             "engines" => $row["engines"],
208:             "capacity" => $row["capacity"],
209:             "horsepower" => $row["horsepower"],
210:             "total_speed" => $row["total_speed"],
211:             "performance" => $row["performance"],
212:             "fuel_type" => $row["fuel_type"],
213:             "seats" => $row["seats"],
214:             "torque" => $row["torque"]
215:         ],
216:         "updates" => $updates,
217:         "services" => $services
```

This returns nested job data for the frontend.

## Register Job Page HTML And JavaScript Entry

File:

```text
src/admin/pages/register-job.html
```

Important lines:

```html
51: <div class="go-back-button-shell" id="register-job-back"></div>
53: <div id="register-job-panel"></div>
```

These containers receive the back button and the register job form.

```html
60: <script src="../js/admin_common.js"></script>
61: <script src="../../components/go-back-button/go-back.js?v=2"></script>
62: <script src="../../components/register-job-panel/register-job-panel.js?v=1"></script>
63: <script src="../js/register-job.js?v=1"></script>
```

These scripts check admin access, load the form component, and initialize it.

File:

```text
src/admin/js/register-job.js
```

```js
2:     AdminPages.loadPage(() => {
3:         createGoBackButton(document.querySelector('#register-job-back'), {
4:             label: 'Kthehu',
5:             fallbackHref: 'admin-jobs.html'
6:         });
8:         createRegisterJobPanel(document.querySelector('#register-job-panel'));
9:     });
```

This waits for admin data loading, creates the back button, and mounts the register job panel.

## Register Job Panel JavaScript

File:

```text
src/components/register-job-panel/register-job-panel.js
```

Important backend/data lines:

```js
2:     const endpoints = {
3:         vehicles: '../api/search_vehicles.php',
4:         clients: '../api/search_user.php',
5:         cars: '../api/search_car_model.php',
6:         staff: '../api/search_staff_simple.php',
7:         create: '../actions/createJob.php'
8:     };
```

These are the backend endpoints used by the form.

```js
10:     const state = {
11:         vehicleMode: 'existing',
12:         clientMode: 'existing',
13:         selectedVehicle: null,
14:         selectedClient: null,
15:         selectedCar: null,
16:         selectedStaff: null,
17:         generatedClientCode: '',
18:         timers: {}
19:     };
```

This stores selected backend records before submission.

```js
45:     async function fetchJson(url) {
46:         const response = await fetch(url, {
47:             headers: { Accept: 'application/json' },
48:             credentials: 'same-origin'
49:         });
51:         if (!response.ok) {
52:             throw new Error(`Request failed with ${response.status}`);
53:         }
55:         return response.json();
56:     }
```

This helper calls backend search APIs and returns JSON.

```js
144:     function fillSelectedVehicle(container, vehicle) {
145:         state.selectedVehicle = vehicle;
146:         state.selectedClient = vehicle.client;
147:         state.selectedCar = vehicle.model;
```

When an existing vehicle is selected, JavaScript also stores the linked client and car model returned by the backend.

```js
159:     function fillSelectedClient(container, client) {
160:         state.selectedClient = {
161:             id: Number(client.user_id || client.id),
162:             name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim(),
163:             email: client.email,
164:             phone: client.phone_number || client.phone
165:         };
```

This stores a selected existing client from `search_user.php`.

```js
173:     function fillSelectedCar(container, car) {
174:         state.selectedCar = car;
```

This stores the selected car model from `search_car_model.php`.

```js
179:     function generateClientCode(container) {
180:         const random = Math.random().toString(36).slice(2, 8).toUpperCase();
181:         state.generatedClientCode = `KL${random}`;
```

This creates the initial login code/password for a new client created during job registration.

```js
386:     function bindSearch(container) {
387:         field(container, '[data-existing-vehicle-search]').addEventListener('input', (event) => {
388:             const query = event.target.value.trim();
389:             if (query.length < 2) {
390:                 field(container, '[data-results="vehicles"]').innerHTML = '';
391:                 return;
392:             }
394:             debounce('vehicles', async () => {
395:                 const vehicles = await fetchJson(`${endpoints.vehicles}?q=${encodeURIComponent(query)}`);
```

This searches existing vehicles through `search_vehicles.php`.

```js
405:         field(container, '[data-existing-client-search]').addEventListener('input', (event) => {
406:             const query = event.target.value.trim();
407:             if (query.length < 2) {
408:                 field(container, '[data-results="clients"]').innerHTML = '';
409:                 return;
410:             }
412:             debounce('clients', async () => {
413:                 const clients = await fetchJson(`${endpoints.clients}?q=${encodeURIComponent(query)}`);
```

This searches existing clients through `search_user.php`.

```js
423:         field(container, '[data-car-model-search]').addEventListener('input', (event) => {
424:             const query = event.target.value.trim();
425:             if (query.length < 2) {
426:                 field(container, '[data-results="cars"]').innerHTML = '';
427:                 return;
428:             }
430:             debounce('cars', async () => {
431:                 const cars = await fetchJson(`${endpoints.cars}?q=${encodeURIComponent(query)}`);
```

This searches car models through `search_car_model.php`.

```js
441:         field(container, '[data-staff-search]').addEventListener('input', (event) => {
442:             const query = event.target.value.trim();
443:             if (query.length < 2) {
444:                 field(container, '[data-results="staff"]').innerHTML = '';
445:                 return;
446:             }
448:             debounce('staff', async () => {
449:                 const staff = await fetchJson(`${endpoints.staff}?q=${encodeURIComponent(query)}`);
```

This searches staff through `search_staff_simple.php`.

```js
480:     function buildPayload(container) {
481:         const payload = {
482:             description: field(container, '[data-description]').value.trim(),
483:             job_type: field(container, '[data-job-type]').value,
484:             status: field(container, '[data-status]').value,
485:             staff_id: state.selectedStaff?.id,
486:             vehicle_mode: state.vehicleMode,
487:             client_mode: state.clientMode
488:         };
```

This builds the JSON body for `createJob.php`.

```js
490:         if (state.vehicleMode === 'existing') {
491:             payload.vehicle_id = state.selectedVehicle?.id;
492:             return payload;
493:         }
```

If using an existing vehicle, only the vehicle id is needed because the backend can find the linked client.

```js
495:         if (state.clientMode === 'existing') {
496:             payload.client_id = state.selectedClient?.id;
497:         } else {
498:             payload.client = {
499:                 first_name: field(container, '[data-new-client-first]').value.trim(),
500:                 last_name: field(container, '[data-new-client-last]').value.trim(),
501:                 email: field(container, '[data-new-client-email]').value.trim(),
502:                 phone: field(container, '[data-new-client-phone]').value.trim(),
503:                 generated_code: state.generatedClientCode
504:             };
505:         }
```

If the vehicle is new, the payload contains either an existing client id or new client data.

```js
507:         payload.vehicle = {
508:             car_model_id: state.selectedCar?.id,
509:             plate_number: field(container, '[data-new-plate]').value.trim(),
510:             vin: field(container, '[data-new-vin]').value.trim()
511:         };
```

This adds new vehicle data to the payload.

```js
520:         form.addEventListener('submit', async (event) => {
521:             event.preventDefault();
522:             submit.disabled = true;
523:             setMessage(container, 'Duke ruajtur punen...');
```

This intercepts form submission so JavaScript can send JSON instead of a normal page reload.

```js
526:                 const response = await fetch(endpoints.create, {
527:                     method: 'POST',
528:                     headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
529:                     credentials: 'same-origin',
530:                     body: JSON.stringify(buildPayload(container))
531:                 });
532:                 const result = await response.json();
```

This sends the job payload to:

```text
src/admin/actions/createJob.php
```

as JSON.

```js
534:                 if (!result.success) {
535:                     setMessage(container, result.message || 'Puna nuk u ruajt.', 'error');
536:                     return;
537:                 }
```

If PHP returns an error, the frontend shows the backend message.

```js
540:                 if (result.generated_client_code) {
543:                         Kodi i klientit te ri: <strong>${escapeHTML(result.generated_client_code)}</strong>.
544:                         <a class="register-job-panel__generated-link" href="job-details.html?job_id=${encodeURIComponent(result.job_id)}">Hap detajet e punes</a>
```

If a new client was created, the backend returns the generated client code and job id.

```js
551:                 setTimeout(() => {
552:                     window.location.href = `job-details.html?job_id=${encodeURIComponent(result.job_id)}`;
553:                 }, 900);
```

If no new client code needs to be shown, the page redirects to the created job details.

## Search Vehicles API

File:

```text
src/admin/api/search_vehicles.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
6: $conn = require __DIR__ . "/../../config/db.php";
8: header("Content-Type: application/json");
```

Standard protected JSON API setup.

```php
10: $q = trim($_GET["q"] ?? "");
12: if (strlen($q) < 2) {
13:     echo json_encode([]);
14:     exit;
15: }
17: $search = "%" . $q . "%";
```

Reads and prepares the search text.

```php
19: $sql = "
20:     SELECT
21:         v.vehicle_id,
22:         v.client_id,
23:         v.car_model_id,
24:         v.plate_number,
25:         v.vin,
26:         client_user.first_name AS client_first_name,
27:         client_user.last_name AS client_last_name,
28:         client_user.phone_number AS client_phone,
29:         client_user.email AS client_email,
30:         cm.company_name,
31:         cm.car_name,
32:         cm.engines,
33:         cm.fuel_type
34:     FROM vehicles v
35:     LEFT JOIN users client_user ON client_user.user_id = v.client_id
36:     LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
37:     WHERE v.plate_number LIKE ?
38:        OR v.vin LIKE ?
39:        OR CONCAT(client_user.first_name, ' ', client_user.last_name) LIKE ?
40:        OR client_user.phone_number LIKE ?
41:        OR CONCAT(cm.company_name, ' ', cm.car_name) LIKE ?
42:     ORDER BY v.vehicle_id DESC
43:     LIMIT 12
44: ";
```

This searches vehicles by plate, VIN, client name, client phone, or car model.

```php
46: $stmt = $conn->prepare($sql);
53: $stmt->bind_param("sssss", $search, $search, $search, $search, $search);
54: $stmt->execute();
```

This safely runs the search with five string parameters.

```php
59: while ($row = $result->fetch_assoc()) {
60:     $vehicles[] = [
61:         "id" => (int) $row["vehicle_id"],
62:         "client_id" => (int) $row["client_id"],
63:         "car_model_id" => (int) $row["car_model_id"],
64:         "plate_number" => $row["plate_number"],
65:         "vin" => $row["vin"],
66:         "client" => [
67:             "id" => (int) $row["client_id"],
68:             "first_name" => $row["client_first_name"],
69:             "last_name" => $row["client_last_name"],
70:             "name" => trim(($row["client_first_name"] ?? "") . " " . ($row["client_last_name"] ?? "")),
71:             "phone" => $row["client_phone"],
72:             "email" => $row["client_email"]
73:         ],
74:         "model" => [
75:             "id" => (int) $row["car_model_id"],
76:             "company_name" => $row["company_name"],
77:             "car_name" => $row["car_name"],
78:             "engines" => $row["engines"],
79:             "fuel_type" => $row["fuel_type"]
80:         ]
81:     ];
```

This returns each vehicle with nested client and model data.

## Search Car Model API

File:

```text
src/admin/api/search_car_model.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
6: $mysqli = require __DIR__ . "/../../config/db.php";
8: header("Content-Type: application/json");
10: $q = trim($_GET["q"] ?? "");
12: if (strlen($q) < 2) {
13:     echo json_encode([]);
14:     exit;
15: }
17: $search = "%" . $q . "%";
```

This repeats the protected search API pattern.

```php
19: $sql = "
20:     SELECT 
21:         id,
22:         company_name,
23:         car_name,
24:         engines,
25:         capacity,
26:         horsepower,
27:         total_speed,
28:         performance,
29:         fuel_type,
30:         seats,
31:         torque
32:     FROM carsmodels
33:     WHERE company_name LIKE ?
34:        OR car_name LIKE ?
35:        OR CONCAT(company_name, ' ', car_name) LIKE ?
36:     LIMIT 10
37: ";
```

This searches car models by company, model name, or combined name.

```php
39: $stmt = $mysqli->prepare($sql);
46: $stmt->bind_param("sss", $search, $search, $search);
47: $stmt->execute();
53: while ($row = $result->fetch_assoc()) {
54:     $cars[] = $row;
55: }
57: echo json_encode($cars);
```

This runs the prepared search and returns matching car model rows.

## Search Staff Simple API

File:

```text
src/admin/api/search_staff_simple.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
6: $conn = require __DIR__ . "/../../config/db.php";
8: header("Content-Type: application/json");
10: $q = trim($_GET["q"] ?? "");
12: if (strlen($q) < 2) {
13:     echo json_encode([]);
14:     exit;
15: }
17: $search = "%" . $q . "%";
```

This repeats the protected search API pattern.

```php
19: $sql = "
20:     SELECT user_id, first_name, last_name, phone_number, email, login_identifier
21:     FROM users
22:     WHERE role = 'staff'
23:       AND (
24:         first_name LIKE ?
25:         OR last_name LIKE ?
26:         OR CONCAT(first_name, ' ', last_name) LIKE ?
27:         OR login_identifier LIKE ?
28:         OR phone_number LIKE ?
29:       )
30:     ORDER BY first_name, last_name
31:     LIMIT 12
32: ";
```

This searches only staff users by name, full name, staff code, or phone.

```php
34: $stmt = $conn->prepare($sql);
41: $stmt->bind_param("sssss", $search, $search, $search, $search, $search);
42: $stmt->execute();
```

This safely runs the staff search.

```php
47: while ($row = $result->fetch_assoc()) {
48:     $staff[] = [
49:         "id" => (int) $row["user_id"],
50:         "name" => trim(($row["first_name"] ?? "") . " " . ($row["last_name"] ?? "")),
51:         "phone" => $row["phone_number"],
52:         "email" => $row["email"],
53:         "code" => $row["login_identifier"] ?: "STAFF-" . $row["user_id"]
54:     ];
55: }
57: echo json_encode($staff);
```

This formats staff results for the register job form.

## Create Job Action

File:

```text
src/admin/actions/createJob.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
6: $conn = require __DIR__ . "/../../config/db.php";
7: require_once __DIR__ . "/../../audit/audit_logger.php";
8: require_once __DIR__ . "/../../notifications/notification_service.php";
10: header("Content-Type: application/json");
```

This protects the action, connects to the database, loads audit/notification helpers, and returns JSON.

```php
12: $data = json_decode(file_get_contents("php://input"), true);
14: if (!$data) {
15:     echo json_encode([
16:         "success" => false,
17:         "message" => "Invalid request."
18:     ]);
19:     exit;
20: }
```

This reads the JSON body sent by `register-job-panel.js`.

```php
22: function fail($message) {
23:     echo json_encode([
24:         "success" => false,
25:         "message" => $message
26:     ]);
27:     exit;
28: }
```

This helper returns a JSON error and stops execution.

```php
30: function getClientById($conn, $clientId) {
31:     $stmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'client' LIMIT 1");
```

This verifies that an existing selected client is really a client.

```php
38: function valueExists($conn, $table, $column, $value) {
39:     $allowed = [
40:         "users.phone_number",
41:         "users.email",
42:         "vehicles.plate_number",
43:         "vehicles.vin"
44:     ];
46:     if (!in_array($table . "." . $column, $allowed, true)) {
47:         return true;
48:     }
```

This checks duplicate values only for allowed table/column pairs.

```php
50:     $stmt = $conn->prepare("SELECT 1 FROM $table WHERE $column = ? LIMIT 1");
52:     $stmt->bind_param("s", $value);
53:     $stmt->execute();
54:     return $stmt->get_result()->num_rows > 0;
```

This returns true if phone, email, plate, or VIN already exists.

```php
57: $jobType = $data["job_type"] ?? "";
58: $description = trim($data["description"] ?? "");
59: $status = $data["status"] ?? "created";
60: $staffId = (int) ($data["staff_id"] ?? 0);
61: $vehicleMode = $data["vehicle_mode"] ?? "existing";
62: $clientMode = $data["client_mode"] ?? "existing";
63: $createdBy = (int) ($_SESSION["user_id"] ?? 0);
```

This extracts the main job creation data from the JSON payload.

```php
65: if (!in_array($jobType, ["maintenance", "damage_repair"], true)) {
69: if ($description === "") {
73: if (!in_array($status, ["created", "in_progress", "completed", "cancelled"], true)) {
77: if ($staffId <= 0) {
```

These validate job type, description, status, and selected staff.

```php
81: $staffStmt = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND role = 'staff' LIMIT 1");
83: $staffStmt->bind_param("i", $staffId);
84: $staffStmt->execute();
85: if ($staffStmt->get_result()->num_rows === 0) {
86:     fail("Stafi nuk ekziston.");
87: }
```

This confirms the selected staff id exists and belongs to a staff user.

```php
89: $conn->begin_transaction();
```

A transaction starts because job creation may insert multiple records.

If one part fails, the whole operation can roll back.

```php
97:     if ($vehicleMode === "existing") {
98:         $vehicleId = (int) ($data["vehicle_id"] ?? 0);
```

This branch handles creating a job for an existing vehicle.

```php
104:         $vehicleStmt = $conn->prepare("
105:             SELECT vehicle_id, client_id, plate_number
106:             FROM vehicles
107:             WHERE vehicle_id = ?
108:             LIMIT 1
109:         ");
115:         $vehicleStmt->bind_param("i", $vehicleId);
116:         $vehicleStmt->execute();
117:         $vehicle = $vehicleStmt->get_result()->fetch_assoc();
```

This loads the existing vehicle and its linked client.

```php
123:         $clientId = (int) $vehicle["client_id"];
124:         $jobPlateNumber = trim($vehicle["plate_number"] ?? "");
```

For an existing vehicle, the client comes from the vehicle record.

```php
126:         if ($clientMode === "existing") {
127:             $clientId = (int) ($data["client_id"] ?? 0);
129:             if ($clientId <= 0 || !getClientById($conn, $clientId)) {
130:                 throw new RuntimeException("Zgjidhni klientin ekzistues.");
131:             }
132:         } else {
```

For a new vehicle, the admin can choose an existing client or create a new one.

```php
133:             $firstName = trim($data["client"]["first_name"] ?? "");
134:             $lastName = trim($data["client"]["last_name"] ?? "");
135:             $phone = trim($data["client"]["phone"] ?? "");
136:             $email = trim($data["client"]["email"] ?? "");
138:             if ($firstName === "" || $lastName === "" || $phone === "" || $email === "") {
```

This reads and validates new client data.

```php
142:             if (valueExists($conn, "users", "phone_number", $phone)) {
146:             if (valueExists($conn, "users", "email", $email)) {
```

This prevents duplicate client phone numbers and emails.

```php
150:             $generatedClientCode = trim($data["client"]["generated_code"] ?? "");
152:             if ($generatedClientCode === "") {
153:                 throw new RuntimeException("Gjeneroni kodin e klientit.");
154:             }
156:             $passwordHash = password_hash($generatedClientCode, PASSWORD_DEFAULT);
```

This uses the generated code as the new client's initial password and stores only the hash.

```php
160:             $clientStmt = $conn->prepare("
161:                 INSERT INTO users
162:                     (first_name, last_name, phone_number, email, login_identifier, role, password_hash)
163:                 VALUES (?, ?, ?, ?, ?, ?, ?)
164:             ");
170:             $clientStmt->bind_param("sssssss", $firstName, $lastName, $phone, $email, $loginIdentifier, $role, $passwordHash);
171:             $clientStmt->execute();
172:             $clientId = (int) $conn->insert_id;
```

This creates the new client using a prepared insert.

```php
174:             audit_log_event($conn, [
175:                 "action" => "INSERT",
176:                 "entity_type" => "users",
177:                 "entity_id" => $clientId,
```

This records the new client in the audit log.

```php
191:         $carModelId = (int) ($data["vehicle"]["car_model_id"] ?? 0);
192:         $plateNumber = trim($data["vehicle"]["plate_number"] ?? "");
193:         $vin = trim($data["vehicle"]["vin"] ?? "");
```

This reads new vehicle data.

```php
196:         if ($carModelId <= 0 || $plateNumber === "" || $vin === "") {
200:         if (valueExists($conn, "vehicles", "plate_number", $plateNumber)) {
204:         if (valueExists($conn, "vehicles", "vin", $vin)) {
```

This validates new vehicle fields and prevents duplicate plate/VIN values.

```php
208:         $modelStmt = $conn->prepare("SELECT id FROM carsmodels WHERE id = ? LIMIT 1");
212:         $modelStmt->bind_param("i", $carModelId);
213:         $modelStmt->execute();
214:         if ($modelStmt->get_result()->num_rows === 0) {
215:             throw new RuntimeException("Modeli i automjetit nuk ekziston.");
216:         }
```

This confirms the selected car model exists.

```php
218:         $vehicleStmt = $conn->prepare("
219:             INSERT INTO vehicles (client_id, car_model_id, plate_number, vin)
220:             VALUES (?, ?, ?, ?)
221:         ");
227:         $vehicleStmt->bind_param("iiss", $clientId, $carModelId, $plateNumber, $vin);
228:         $vehicleStmt->execute();
229:         $vehicleId = (int) $conn->insert_id;
```

This inserts the new vehicle.

```php
231:         audit_log_event($conn, [
232:             "action" => "INSERT",
233:             "entity_type" => "vehicles",
234:             "entity_id" => $vehicleId,
```

This records the new vehicle in the audit log.

```php
247:     if ($clientId <= 0 || $vehicleId <= 0) {
248:         throw new RuntimeException("Klienti ose automjeti mungon.");
249:     }
```

Before creating the job, the backend confirms it has both a client and a vehicle.

```php
251:     $jobStmt = $conn->prepare("
252:         INSERT INTO jobs
253:             (client_id, vehicle_id, staff_id, created_by, description, job_type, status)
254:         VALUES (?, ?, ?, ?, ?, ?, ?)
255:     ");
261:     $jobStmt->bind_param("iiiisss", $clientId, $vehicleId, $staffId, $createdBy, $description, $jobType, $status);
262:     $jobStmt->execute();
263:     $jobId = (int) $conn->insert_id;
```

This creates the job record.

```php
265:     audit_log_event($conn, [
266:         "action" => "INSERT",
267:         "entity_type" => "jobs",
268:         "entity_id" => $jobId,
```

This records the new job in the audit log.

```php
281:     $conn->commit();
```

This saves all inserts permanently after they all succeed.

```php
283:     if ($generatedClientCode !== null) {
284:         notify_user_profile_created($conn, $clientId, $generatedClientCode);
285:     }
286:     notify_job_created($conn, $jobId);
```

This sends notifications after the database transaction succeeds.

```php
288:     echo json_encode([
289:         "success" => true,
290:         "message" => "Puna u regjistrua me sukses.",
291:         "job_id" => $jobId,
292:         "generated_client_code" => $generatedClientCode
293:     ]);
```

This returns the success response to JavaScript.

```php
294: } catch (Throwable $error) {
295:     $conn->rollback();
297:     echo json_encode([
298:         "success" => false,
299:         "message" => $error->getMessage()
300:     ]);
301: }
```

If anything fails, all database changes are rolled back and the frontend receives the error message.

## Final Backend Flow Summary

Admin jobs has three main backend paths:

1. Job list/search:

```text
admin-jobs.js -> search_jobs.php -> searchService.php/searchJobs()
```

2. Job details:

```text
job-details.js -> get_job_details.php -> jobs/users/vehicles/carsmodels/job_updates/job_services
```

3. Job creation:

```text
register-job-panel.js -> search APIs -> createJob.php -> users/vehicles/jobs/audit logs/notifications
```

## Defense Questions And Answers

Question:

Why does `admin-jobs.js` use `data.jobs` first instead of immediately calling `search_jobs.php`?

Answer:

Because the admin dashboard data API already returns the jobs list. `search_jobs.php` is only needed when the admin types a search query.

Question:

Why are searches blocked under 2 characters?

Answer:

To avoid broad and unnecessary database searches.

Question:

Why does `get_job_details.php` use `LEFT JOIN`?

Answer:

So the job can still load even if some related client, staff, vehicle, or car model data is missing.

Question:

Why does `createJob.php` use a transaction?

Answer:

Because job creation can involve multiple inserts: client, vehicle, and job. A transaction ensures they all succeed together or all roll back together.

Question:

Why does `createJob.php` validate staff id?

Answer:

Because the submitted staff id comes from the frontend. The backend must confirm that it exists and belongs to a staff user.

Question:

Why does existing vehicle mode not send client data?

Answer:

Because the vehicle already has a `client_id` in the database. The backend loads the client from the selected vehicle.

Question:

Why does new client mode hash the generated code?

Answer:

Because the generated code becomes the client's initial password, and passwords must be stored as hashes.

Question:

Why are audit logs written for client, vehicle, and job creation?

Answer:

Because each insert changes important system data and should be traceable.

Question:

Why are notifications sent after `commit()`?

Answer:

Because notifications should only be sent after the database changes are successfully saved.
