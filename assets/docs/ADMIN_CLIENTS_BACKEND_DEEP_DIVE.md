# Admin Clients Backend Deep Dive

This document explains the admin clients backend in small defense chunks. It follows after the admin dashboard backend, so repeated ideas like JSON responses, admin session protection, database loading, and basic search are explained briefly.

## Admin Clients Backend Purpose

The admin clients backend handles:

- searching clients from the admin area
- opening one client's detailed profile data
- creating a new client account
- returning client search results as JSON
- counting a client's vehicles and jobs
- logging client creation in the audit log
- notifying a newly created client

## Main Files

Client search API:

- `src/admin/api/search_clients.php`

Client page JavaScript:

- `src/admin/js/admin-clients.js`

Client page HTML:

- `src/admin/pages/admin-clients.html`

Shared search helper:

- `src/admin/actions/searchService.php`

Client details API:

- `src/admin/api/get_client_details.php`

Client details JavaScript:

- `src/admin/js/client-details.js`

Client details HTML:

- `src/admin/pages/client-details.html`

Client creation action:

- `src/admin/actions/createClient.php`

Simple user search API:

- `src/admin/api/search_user.php`

Register job JavaScript that uses `search_user.php`:

- `src/components/register-job-panel/register-job-panel.js`

Already-covered dependencies:

- `src/auth/session.php`
- `src/config/db.php`
- `src/admin/js/admin_common.js`

## Full Admin Clients Backend Flow

1. Admin searches for a client.
2. The request reaches `search_clients.php` or `search_user.php`.
3. The API checks admin access with `requireAdminJson()`.
4. The API reads the search text from `$_GET["q"]`.
5. If the search text is too short, the API returns an empty JSON array.
6. If the search is valid, the API queries client users and returns JSON.
7. Admin opens a client profile.
8. `get_client_details.php` receives `client_id`.
9. It validates the id and loads the client's profile, vehicles, and active jobs.
10. Admin creates a client using `createClient.php`.
11. The action hashes the password, inserts the user, writes an audit log, sends a notification, and returns a success/error message.

## Admin Clients Page HTML

File:

```text
src/admin/pages/admin-clients.html
```

Only backend/data-relevant lines are covered here.

Important lines:

```html
54: <div class="panel-search-slot" id="clients-search"></div>
```

This is the empty container where JavaScript creates the client search bar.

The search bar later calls the backend endpoint:

```text
src/admin/api/search_clients.php
```

```html
56: <button class="job-status-filter__button is-active" type="button" data-client-filter="all">Te gjithe</button>
57: <button class="job-status-filter__button" type="button" data-client-filter="active">Aktiv</button>
58: <button class="job-status-filter__button" type="button" data-client-filter="inactive">Jo aktiv</button>
```

These buttons do not call PHP directly.

They filter the client data that was already loaded from the backend.

```html
65: <div class="clients-page-grid" id="clients-list"></div>
```

This is where JavaScript renders the client cards returned by the backend.

```html
67: <p class="clients-page-panel__count" data-clients-count>0 kliente ne total</p>
```

This displays the number of currently visible clients after backend data is loaded and filtered.

```html
74: <script src="../../components/clinet-mini-card/client-mini-card.js"></script>
75: <script src="../../components/search-bar/search-bar.js"></script>
76: <script src="../js/admin_common.js"></script>
77: <script src="../js/admin-clients.js?v=client-filter-1"></script>
```

These scripts are relevant to data processing:

- `client-mini-card.js` renders each client result
- `search-bar.js` creates the search input
- `admin_common.js` loads base dashboard data from the backend
- `admin-clients.js` controls client searching, filtering, and rendering

## Shared Admin JavaScript Loader

File:

```text
src/admin/js/admin_common.js
```

Only the data/backend-relevant lines are covered here.

Important lines:

```js
2: const DASHBOARD_ENDPOINT = '../api/get_dashboard_data.php';
```

This defines the backend API used to load the admin page's base data.

For the clients page, that base data includes:

```js
data.clients
```

```js
26: async function fetchDashboardData() {
27:     const response = await fetch(DASHBOARD_ENDPOINT, {
28:         headers: { Accept: 'application/json' },
29:         credentials: 'same-origin'
30:     });
```

This sends a request to `get_dashboard_data.php`.

`Accept: application/json` tells the backend that JavaScript expects JSON.

`credentials: 'same-origin'` sends the current session cookie, so PHP can check the admin session.

```js
32:     if (response.status === 401 || response.status === 403) {
33:         window.location.replace('/mechanic-system/public/staff-page.html');
34:         throw new Error('Admin access required');
35:     }
```

If the backend says the user is not logged in or not admin, JavaScript sends the user back to the staff login page.

```js
37:     if (!response.ok) {
38:         throw new Error(`Dashboard API failed with ${response.status}`);
39:     }
```

This catches backend errors like `500` or other failed responses.

```js
41:     return response.json();
```

This converts the backend JSON response into a JavaScript object.

```js
108: function normalizeClient(client = {}, index = 0) {
109:     const name = client.name || `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim();
```

This prepares client data so the frontend can handle slightly different backend shapes.

For example, the backend may return:

```js
name
```

or:

```js
first_name
last_name
```

```js
111:     return {
112:         ...client,
113:         id: client.id ?? client.user_id ?? index + 1,
114:         name: name || 'Klient',
115:         code: getClientCode({ ...client, name }, index),
116:         phone: client.phone ?? client.phone_number ?? '',
117:         email: client.email ?? '',
118:         detail: client.detail ?? ''
119:     };
```

This returns a normalized client object with stable fields:

- `id`
- `name`
- `code`
- `phone`
- `email`
- `detail`

```js
273: async function loadPage(onData) {
278:     try {
279:         const data = await fetchDashboardData();
280:         fillUser(data.user);
281:         onData(data);
```

This is the shared page-loading function.

It loads backend dashboard data, fills the logged-in user's name, then passes the data into the page-specific JavaScript.

```js
287:     console.warn('Page data could not be loaded:', error);
288:     showToast('Te dhenat nuk u ngarkuan');
289:     onData({
290:         user: {},
291:         stats: { activeJobs: 0, staff: 0, clients: 0 },
292:         activeJobs: [],
293:         jobs: [],
294:         staff: [],
295:         clients: []
296:     });
```

If the backend data fails to load, the page still receives safe empty data.

This prevents the client page from crashing.

## Admin Clients JavaScript

File:

```text
src/admin/js/admin-clients.js
```

Important data/backend lines:

```js
2:     const SEARCH_ENDPOINT = '../api/search_clients.php';
```

This is the backend endpoint used when the admin searches for clients.

```js
3:     let allClients = [];
4:     let visibleClients = [];
5:     let activeFilter = 'all';
6:     let searchTimer = null;
7:     let controller = null;
```

These variables store client data on the frontend:

- `allClients`: clients loaded from the dashboard backend
- `visibleClients`: clients currently shown after search/filter
- `activeFilter`: selected filter
- `searchTimer`: delay before searching
- `controller`: cancels older search requests

```js
9:     function getActiveJobCount(client) {
10:         if (Number.isFinite(Number(client.activeJobs))) {
11:             return Number(client.activeJobs);
12:         }
14:         if (Number.isFinite(Number(client.active_jobs))) {
15:             return Number(client.active_jobs);
16:         }
18:         const detailMatch = String(client.detail ?? '').match(/\d+/);
19:         return detailMatch ? Number(detailMatch[0]) : 0;
20:     }
```

This extracts the active job count from client data.

It supports multiple possible backend field names:

- `activeJobs`
- `active_jobs`
- number inside `detail`

```js
22:     function filterClients(clients) {
23:         if (activeFilter === 'inactive') {
24:             return clients.filter((client) => getActiveJobCount(client) === 0);
25:         }
27:         if (activeFilter === 'active') {
28:             return clients.filter((client) => getActiveJobCount(client) > 0);
29:         }
31:         return clients;
32:     }
```

This filters already-loaded backend data.

It does not call PHP; it works on the JavaScript array.

```js
60:     function renderClients(clients) {
61:         const container = document.querySelector('#clients-list');
62:         const filteredClients = filterClients(clients);
63:         const normalizedClients = filteredClients.map(AdminPages.normalizeClient);
```

This prepares the client data before rendering.

First it filters clients, then it normalizes each client using the shared admin helper.

```js
65:         container.innerHTML = '';
```

This clears the old client list before rendering new data.

```js
68:         if (normalizedClients.length === 0) {
69:             AdminPages.renderEmpty(container, getEmptyMessage());
```

If no clients are available, the page shows an empty message.

```js
71:             normalizedClients.forEach((client) => {
72:                 const card = document.createElement('article');
73:                 container.appendChild(card);
74:                 createClientMiniCard(card, client, () => {
75:                     window.location.href = `client-details.html?client_id=${encodeURIComponent(client.id)}`;
76:                 });
77:             });
```

This creates one card per client.

When a card is clicked, the browser opens:

```text
client-details.html?client_id=...
```

That `client_id` is later sent to the backend by `client-details.js`.

```js
80:         document.querySelector('[data-clients-count]').textContent = `${normalizedClients.length} kliente ne total`;
```

This updates the visible client count based on the processed data.

```js
102:     async function searchClients(query) {
103:         const value = query.trim();
104:         clearTimeout(searchTimer);
```

This function receives search text from the search bar.

It trims the value and clears the previous search delay.

```js
106:         if (controller) {
107:             controller.abort();
108:         }
```

This cancels an older backend search request if the admin types a new search quickly.

```js
110:         if (value.length < 2) {
111:             visibleClients = allClients;
112:             renderClients(visibleClients);
113:             return;
114:         }
```

If the search text is shorter than 2 characters, JavaScript does not call the backend.

It returns to the full client list already loaded from dashboard data.

```js
116:         searchTimer = setTimeout(async () => {
117:             controller = new AbortController();
```

This waits briefly before searching.

That avoids sending a backend request on every single keypress.

```js
120:                 const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(value)}`, {
121:                     headers: { Accept: 'application/json' },
122:                     credentials: 'same-origin',
123:                     signal: controller.signal
124:                 });
```

This sends the search request to:

```text
../api/search_clients.php?q=...
```

`encodeURIComponent(value)` safely places the search text into the URL.

`credentials: 'same-origin'` sends the admin session cookie.

```js
126:                 if (!response.ok) throw new Error(`Search failed with ${response.status}`);
127:                 visibleClients = await response.json();
128:                 renderClients(visibleClients);
```

If the backend response is successful, JavaScript converts the JSON into an array and renders it.

```js
129:             } catch (error) {
130:                 if (error.name !== 'AbortError') {
131:                     console.warn('Client search failed:', error);
132:                     AdminPages.showToast('Kerkimi i klienteve deshtoi');
133:                 }
134:             }
```

This handles backend search failures.

Abort errors are ignored because they happen normally when newer searches replace older ones.

```js
138:     AdminPages.loadPage((data) => {
139:         allClients = Array.isArray(data.clients) ? data.clients : [];
140:         visibleClients = allClients;
```

This receives data from `admin_common.js`.

The `clients` array originally comes from:

```text
src/admin/api/get_dashboard_data.php
```

```js
142:         createSearchBar(document.querySelector('#clients-search'), {
143:             placeholder: 'Kerko klient sipas emrit ose telefonit',
144:             onSearch: searchClients
145:         });
```

This creates the search bar and connects it to the `searchClients()` function.

```js
147:         bindClientFilters();
148:         renderClients(visibleClients);
```

This activates the filter buttons and renders the initial client list.

## Client Details Page HTML

File:

```text
src/admin/pages/client-details.html
```

Only backend/data-relevant lines are covered here.

Important lines:

```html
52: <div class="go-back-button-shell" id="client-details-back"></div>
54: <div id="client-details-panel"></div>
```

The first container receives the back button.

The second container receives the client details loaded from the backend.

```html
61: <script src="../js/admin_common.js"></script>
62: <script src="../../components/go-back-button/go-back.js?v=1"></script>
63: <script src="../../components/client-specification-panel/client-specification-panel.js?v=back-2"></script>
64: <script src="../js/client-details.js"></script>
```

These scripts are relevant because:

- `admin_common.js` checks admin access by loading backend dashboard data
- `client-specification-panel.js` renders the final client object
- `client-details.js` calls `get_client_details.php`

## Client Details JavaScript

File:

```text
src/admin/js/client-details.js
```

Important data/backend lines:

```js
2:     function getClientId() {
3:         return new URLSearchParams(window.location.search).get('client_id');
4:     }
```

This reads `client_id` from the page URL.

Example:

```text
client-details.html?client_id=7
```

The value `7` is later sent to the PHP backend.

```js
6:     async function fetchClientDetails(clientId) {
7:         const response = await fetch(`../api/get_client_details.php?client_id=${encodeURIComponent(clientId)}`, {
8:             headers: { Accept: 'application/json' },
9:             credentials: 'same-origin'
10:         });
```

This sends the selected client id to:

```text
src/admin/api/get_client_details.php
```

`encodeURIComponent(clientId)` safely puts the id into the URL.

`credentials: 'same-origin'` sends the admin session cookie.

```js
12:         if (!response.ok) {
13:             throw new Error(`Client details API failed with ${response.status}`);
14:         }
```

If the backend returns an error status, JavaScript stops and enters the catch block later.

```js
16:         return response.json();
```

This converts the backend response into a JavaScript object.

```js
19:     AdminPages.loadPage(async () => {
20:         const mount = document.querySelector('#client-details-panel');
```

This waits for the shared admin page loader, then gets the container where client details will be rendered.

```js
25:         const clientId = getClientId();
```

This reads the id from the URL.

```js
27:         if (!clientId) {
28:             AdminPages.renderEmpty(mount, 'Mungon ID e klientit.');
29:             return;
30:         }
```

If there is no client id, JavaScript does not call the backend.

```js
35:             const payload = await fetchClientDetails(clientId);
```

This calls the backend details API.

```js
37:             if (!payload.success) {
38:                 AdminPages.renderEmpty(mount, payload.message || 'Klienti nuk u gjet.');
39:                 return;
40:             }
```

If PHP returns `"success": false`, JavaScript shows the backend message.

```js
42:             createClientSpecificationPanel(mount, payload.client);
```

This sends the backend client object to the UI component that displays it.

```js
43:         } catch (error) {
44:             console.warn('Client details could not be loaded:', error);
45:             AdminPages.renderEmpty(mount, 'Detajet e klientit nuk u ngarkuan.');
46:         }
```

This handles failed backend requests or invalid JSON responses.

## Register Job JavaScript Using `search_user.php`

File:

```text
src/components/register-job-panel/register-job-panel.js
```

This file is not the main admin clients page, but it is relevant because it uses `search_user.php` to search existing clients when registering a job.

Important data/backend lines:

```js
2:     const endpoints = {
3:         vehicles: '../api/search_vehicles.php',
4:         clients: '../api/search_user.php',
5:         cars: '../api/search_car_model.php',
6:         staff: '../api/search_staff_simple.php',
7:         create: '../actions/createJob.php'
8:     };
```

This defines backend endpoints used by the register-job form.

For this document, the relevant endpoint is:

```js
clients: '../api/search_user.php'
```

```js
45:     async function fetchJson(url) {
46:         const response = await fetch(url, {
47:             headers: { Accept: 'application/json' },
48:             credentials: 'same-origin'
49:         });
```

This helper sends requests to backend JSON APIs.

It includes the session cookie with `credentials: 'same-origin'`.

```js
51:         if (!response.ok) {
52:             throw new Error(`Request failed with ${response.status}`);
53:         }
55:         return response.json();
```

This checks the backend response and converts JSON into JavaScript data.

```js
159:     function fillSelectedClient(container, client) {
160:         state.selectedClient = {
161:             id: Number(client.user_id || client.id),
162:             name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim(),
163:             email: client.email,
164:             phone: client.phone_number || client.phone
165:         };
```

This takes a client returned by `search_user.php` and stores it in frontend state.

It supports both `user_id` and `id` because backend responses can differ.

```js
167:         field(container, '[data-existing-client-search]').value = state.selectedClient.name;
168:         field(container, '[data-client-name]').value = state.selectedClient.name;
169:         field(container, '[data-client-email]').value = state.selectedClient.email || '';
170:         field(container, '[data-client-phone]').value = state.selectedClient.phone || '';
```

This copies the selected backend client data into the visible form fields.

```js
405:         field(container, '[data-existing-client-search]').addEventListener('input', (event) => {
406:             const query = event.target.value.trim();
407:             if (query.length < 2) {
408:                 field(container, '[data-results="clients"]').innerHTML = '';
409:                 return;
410:             }
```

This listens when the admin types in the existing-client search field.

If the query is shorter than 2 characters, it does not call the backend.

```js
412:             debounce('clients', async () => {
413:                 const clients = await fetchJson(`${endpoints.clients}?q=${encodeURIComponent(query)}`);
```

This sends the client search to:

```text
src/admin/api/search_user.php?q=...
```

Again, the search behavior is the same pattern already explained: trim, minimum length, encoded query string, JSON response.

```js
414:                 renderResults(container, 'clients', clients, (client, index) => `
415:                     <button class="register-job-panel__result" type="button" data-result-index="${index}">
416:                         <span class="register-job-panel__result-title">${escapeHTML(client.first_name)} ${escapeHTML(client.last_name)}</span>
417:                         <span class="register-job-panel__result-meta">${escapeHTML(client.phone_number)} | ${escapeHTML(client.email)}</span>
418:                     </button>
419:                 `, (client) => fillSelectedClient(container, client));
```

This renders each client result.

When one result is clicked, `fillSelectedClient()` stores and displays the selected backend client data.

## Client Search API

File:

```text
src/admin/api/search_clients.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
```

These lines protect the API so only an authenticated admin can search client data.

This pattern was already explained in the admin dashboard backend document.

```php
6: $mysqli = require __DIR__ . "/../../config/db.php";
```

This loads the database connection.

```php
7: require_once __DIR__ . "/../actions/searchService.php";
```

This loads the shared search functions.

For this file, the important function from `searchService.php` is:

```php
searchClients($mysqli, $q)
```

```php
9: header("Content-Type: application/json");
```

The endpoint returns JSON because it is used by JavaScript, not as a normal HTML page.

```php
11: $q = trim($_GET["q"] ?? "");
```

This reads the search text from the URL query parameter.

Example:

```text
search_clients.php?q=John
```

`trim()` removes spaces at the beginning and end.

The `?? ""` part means: if `q` does not exist, use an empty string.

```php
13: if (strlen($q) < 2) {
14:     echo json_encode([]);
15:     exit;
16: }
```

This blocks very short searches.

If the user types fewer than 2 characters, the API returns an empty array:

```json
[]
```

This avoids running database searches for empty or one-letter input.

```php
18: echo json_encode(searchClients($mysqli, $q));
```

This calls the search helper and immediately converts the result to JSON.

The actual SQL is not in this file. It is inside `searchService.php`.

## Shared Client Search Helper

File:

```text
src/admin/actions/searchService.php
```

Only the client-related functions are covered here.

## Function: searchClientUsers()

Important lines:

```php
3: function searchClientUsers($conn, $query) {
4:     $search = "%" . $query . "%";
```

This prepares the search value for SQL `LIKE`.

The `%` symbols mean the database can match the query anywhere inside the text.

Example:

```text
ana
```

can match:

```text
Elvana
```

This search pattern was introduced before, so the main point here is that this function searches client users only.

```php
6:     $sql = "
7:         SELECT
8:             u.user_id,
9:             u.first_name,
10:             u.last_name,
11:             u.phone_number,
12:             u.email,
13:             COUNT(j.job_id) AS active_jobs
14:         FROM users u
15:         LEFT JOIN jobs j
16:             ON j.client_id = u.user_id
17:             AND j.status IN ('created', 'in_progress')
18:         WHERE u.role = 'client'
```

This query searches only users with the role `client`.

It also counts each client's active jobs.

The active job filter is inside the `LEFT JOIN`, so clients with zero active jobs can still appear.

```php
19:           AND (
20:             u.first_name LIKE ?
21:             OR u.last_name LIKE ?
22:             OR u.phone_number LIKE ?
23:             OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
24:           )
```

This allows searching by:

- first name
- last name
- phone number
- full name

The `?` placeholders are used because this query uses a prepared statement.

```php
25:         GROUP BY u.user_id, u.first_name, u.last_name, u.phone_number, u.email
26:         ORDER BY u.first_name, u.last_name
27:         LIMIT 10
```

`GROUP BY` is needed because the query uses `COUNT(j.job_id)`.

`ORDER BY` sorts clients alphabetically.

`LIMIT 10` prevents returning too many results at once.

```php
30:     $stmt = $conn->prepare($sql);
32:     if (!$stmt) {
33:         return [];
34:     }
```

This prepares the SQL safely.

If prepare fails, the function returns an empty array.

```php
36:     $stmt->bind_param("ssss", $search, $search, $search, $search);
37:     $stmt->execute();
```

This binds four string values to the four `?` placeholders.

`"ssss"` means all four values are strings.

```php
39:     return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
```

This returns all matching rows as associative arrays.

## Function: searchClients()

Important lines:

```php
42: function searchClients($conn, $query) {
43:     $rows = searchClientUsers($conn, $query);
44:     $clients = [];
```

This function uses `searchClientUsers()` to get raw database rows.

Then it prepares a cleaner frontend response.

```php
46:     foreach ($rows as $row) {
47:         $clients[] = [
48:             "id" => (int) $row["user_id"],
49:             "name" => trim($row["first_name"] . " " . $row["last_name"]),
50:             "phone" => $row["phone_number"],
51:             "email" => $row["email"],
52:             "activeJobs" => (int) $row["active_jobs"],
53:             "detail" => $row["active_jobs"] . " pune aktive"
54:         ];
55:     }
```

This converts each database row into the format expected by the admin client UI.

The id and active job count are cast to integers.

```php
57:     return $clients;
```

This returns the final searchable client list.

## Client Details API

File:

```text
src/admin/api/get_client_details.php
```

Important lines:

```php
3: header("Content-Type: application/json");
5: require_once __DIR__ . "/../../auth/session.php";
6: requireAdminJson();
8: $conn = require __DIR__ . "/../../config/db.php";
```

These lines repeat the standard protected JSON API pattern:

- return JSON
- load session helpers
- require admin access
- connect to the database

```php
10: $client_id = (int) ($_GET["client_id"] ?? 0);
```

This reads `client_id` from the URL and converts it to an integer.

Example:

```text
get_client_details.php?client_id=5
```

```php
12: if ($client_id <= 0) {
13:     echo json_encode([
14:         "success" => false,
15:         "message" => "Invalid client id."
16:     ]);
17:     exit;
18: }
```

This rejects missing or invalid client ids.

If the id is invalid, the API returns a JSON error and stops.

```php
20: $sql = "
21:     SELECT
22:         u.user_id,
23:         u.first_name,
24:         u.last_name,
25:         u.phone_number,
26:         u.email,
27:         u.login_identifier,
28:         COUNT(DISTINCT v.vehicle_id) AS vehicle_count,
29:         COUNT(DISTINCT j.job_id) AS total_jobs
30:     FROM users u
31:     LEFT JOIN vehicles v ON v.client_id = u.user_id
32:     LEFT JOIN jobs j ON j.client_id = u.user_id
33:     WHERE u.user_id = ?
34:       AND u.role = 'client'
```

This query gets the main client profile.

It also counts:

- the client's vehicles
- the client's total jobs

The query uses `?` for the client id, so the id is safely bound later.

The role check:

```sql
AND u.role = 'client'
```

prevents opening staff/admin users through this client-details endpoint.

```php
35:     GROUP BY
36:         u.user_id,
37:         u.first_name,
38:         u.last_name,
39:         u.phone_number,
40:         u.email,
41:         u.login_identifier
42:     LIMIT 1
```

`GROUP BY` is required because the query uses counts.

`LIMIT 1` is used because one `user_id` should identify one user.

```php
45: $stmt = $conn->prepare($sql);
47: if (!$stmt) {
48:     echo json_encode([
49:         "success" => false,
50:         "message" => "Client query failed."
51:     ]);
52:     exit;
53: }
```

This prepares the main client query.

If preparing fails, the API returns a JSON error.

```php
55: $stmt->bind_param("i", $client_id);
56: $stmt->execute();
57: $result = $stmt->get_result();
58: $row = $result->fetch_assoc();
```

This binds the client id as an integer, runs the query, and reads one client row.

```php
60: if (!$row) {
61:     echo json_encode([
62:         "success" => false,
63:         "message" => "Client not found."
64:     ]);
65:     exit;
66: }
```

If no client is found, the API returns a JSON error.

## Client Vehicles Query

Important lines:

```php
68: $vehicles = [];
69: $vehicles_sql = "
70:     SELECT
71:         v.vehicle_id,
72:         v.plate_number,
73:         v.vin,
74:         cm.company_name,
75:         cm.car_name,
76:         cm.fuel_type
77:     FROM vehicles v
78:     LEFT JOIN carsmodels cm ON cm.id = v.car_model_id
79:     WHERE v.client_id = ?
80:     ORDER BY v.vehicle_id DESC
81: ";
```

This gets all vehicles owned by the selected client.

It joins `carsmodels` so the response can include brand/model/fuel information.

```php
83: $vehicles_stmt = $conn->prepare($vehicles_sql);
85: if ($vehicles_stmt) {
86:     $vehicles_stmt->bind_param("i", $client_id);
87:     $vehicles_stmt->execute();
88:     $vehicles_result = $vehicles_stmt->get_result();
```

This prepares and runs the vehicles query.

If the statement cannot be prepared, the API does not crash; it simply leaves `$vehicles` as an empty array.

```php
90:     while ($vehicle = $vehicles_result->fetch_assoc()) {
91:         $vehicles[] = [
92:             "id" => (int) $vehicle["vehicle_id"],
93:             "plate_number" => $vehicle["plate_number"],
94:             "vin" => $vehicle["vin"],
95:             "company_name" => $vehicle["company_name"],
96:             "car_name" => $vehicle["car_name"],
97:             "fuel_type" => $vehicle["fuel_type"]
98:         ];
99:     }
```

This formats each vehicle for the JSON response.

## Client Active Jobs Query

Important lines:

```php
102: $active_jobs = [];
103: $jobs_sql = "
104:     SELECT
105:         j.job_id,
106:         j.status,
107:         j.updated_at,
108:         v.plate_number,
109:         CONCAT(staff_user.first_name, ' ', staff_user.last_name) AS staff_name
110:     FROM jobs j
111:     LEFT JOIN vehicles v ON v.vehicle_id = j.vehicle_id
112:     LEFT JOIN users staff_user ON staff_user.user_id = j.staff_id
113:     WHERE j.client_id = ?
114:       AND j.status IN ('created', 'in_progress')
115:     ORDER BY j.updated_at DESC
116: ";
```

This query gets only the selected client's active jobs.

Active jobs are:

```sql
'created', 'in_progress'
```

It also gets:

- vehicle plate number
- assigned staff name
- job status
- last update date

```php
118: $jobs_stmt = $conn->prepare($jobs_sql);
120: if ($jobs_stmt) {
121:     $jobs_stmt->bind_param("i", $client_id);
122:     $jobs_stmt->execute();
123:     $jobs_result = $jobs_stmt->get_result();
```

This prepares and runs the active jobs query.

Like the vehicles query, if prepare fails, the API keeps an empty active jobs array.

```php
125:     while ($job = $jobs_result->fetch_assoc()) {
126:         $active_jobs[] = [
127:             "id" => (int) $job["job_id"],
128:             "code" => $job["plate_number"],
129:             "staff" => trim($job["staff_name"] ?? ""),
130:             "date" => $job["updated_at"],
131:             "status" => $job["status"]
132:         ];
133:     }
```

This formats each active job for the client details response.

`trim($job["staff_name"] ?? "")` keeps staff text clean even if no staff is assigned.

## Client Details Response

Important lines:

```php
136: $name = trim(($row["first_name"] ?? "") . " " . ($row["last_name"] ?? ""));
137: $code = $row["login_identifier"] ?: "KL-" . $row["user_id"];
```

This prepares display values.

`$name` combines first and last name.

`$code` uses `login_identifier` if it exists. If not, it creates a fallback client code like:

```text
KL-5
```

```php
139: echo json_encode([
140:     "success" => true,
141:     "client" => [
142:         "id" => (int) $row["user_id"],
143:         "name" => $name,
144:         "code" => $code,
145:         "email" => $row["email"],
146:         "phone" => $row["phone_number"],
147:         "vehicle_count" => (int) $row["vehicle_count"],
148:         "total_jobs" => (int) $row["total_jobs"],
149:         "vehicles" => $vehicles,
150:         "active_jobs" => $active_jobs
151:     ]
152: ]);
```

This sends the final JSON response.

It contains:

- main client data
- vehicle count
- total job count
- vehicle list
- active job list

## Create Client Action

File:

```text
src/admin/actions/createClient.php
```

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
```

This protects client creation so only admins can create client accounts.

```php
6: $conn=require __DIR__ . "/../../config/db.php";
7: require_once __DIR__ . "/../../audit/audit_logger.php";
8: require_once __DIR__ . "/../../notifications/notification_service.php";
```

These lines load:

- the database connection
- the audit logging helper
- the notification helper

This means creating a client is not only a database insert. It also creates an audit trail and sends a profile-created notification.

```php
10: print_r($_POST);
```

This prints the submitted POST data.

In defense, explain that this appears to be a debugging line. In production, it would usually be removed because it can expose submitted form values.

```php
12: $firstName = $_POST['firstName'];
13: $lastName = $_POST['lastName'];
14: $email = $_POST['email'];
15: $phone = $_POST['phone'];
16: $plainPassword = $_POST['password'];
```

These lines read the submitted client form values.

They come from the frontend form fields:

- first name
- last name
- email
- phone
- password

```php
17: $password = password_hash($plainPassword,PASSWORD_DEFAULT);
```

This hashes the plain password before saving it.

The database should store the hashed password, not the plain password.

`PASSWORD_DEFAULT` tells PHP to use the current recommended hashing algorithm.

```php
18: $role = 'client';
```

This forces the new user role to `client`.

The role is not taken from user input, which prevents the form from creating an admin or staff account through this action.

```php
20: $query = "INSERT INTO users (first_name, last_name, phone_number, email, login_identifier, role,password_hash) VALUES ('$firstName', '$lastName', '$phone', '$email', null , '$role', '$password')";
```

This builds the SQL insert for the new client.

It inserts:

- first name
- last name
- phone number
- email
- `null` login identifier
- client role
- hashed password

Defense note:

This line directly places POST values into SQL. The safer pattern, used in other files like `get_client_details.php`, is a prepared statement. So the purpose is clear, but this line is a security-sensitive place because direct SQL string interpolation can allow SQL injection if input is not controlled.

```php
22: if ($conn->query($query) === TRUE) {
23:     $clientId = (int) $conn->insert_id;
```

This runs the insert.

If it succeeds, `$conn->insert_id` gets the new user's id from MySQL.

The id is cast to an integer.

```php
24:     audit_log_event($conn, [
25:         "action" => "INSERT",
26:         "entity_type" => "users",
27:         "entity_id" => $clientId,
28:         "entity_label" => $firstName . " " . $lastName,
29:         "description" => "Create Klient - " . $firstName . " " . $lastName,
```

This records the client creation in the audit log.

It says:

- the action was an insert
- the affected table/entity is users
- the new entity id is the new client id
- the label and description identify the created client

```php
30:         "new_values" => [
31:             "role" => "client",
32:             "first_name" => $firstName,
33:             "last_name" => $lastName,
34:             "phone" => $phone,
35:             "email" => $email
36:         ],
37:         "changed_fields" => ["role", "first_name", "last_name", "phone", "email"]
38:     ]);
```

This stores the important created values in the audit event.

The password is not included in the audit log, which is correct because passwords should not be logged.

```php
39:     notify_user_profile_created($conn, $clientId, $plainPassword, $phone);
```

This sends a notification to the newly created client.

It passes:

- the database connection
- the new client id
- the plain password
- the phone number

Defense note:

The plain password is needed here because the notification likely tells the client their initial login details. After this point, only the hash should remain stored in the database.

```php
40:     echo "New client created successfully";
```

This sends a success message.

Unlike the search and details APIs, this file returns plain text, not JSON.

```php
41: } else {
42:     echo "Error: " . $query . "<br>" . $conn->error;
43: }
```

If the insert fails, this prints an error.

Defense note:

This helps during development, but in production it would be safer to return a generic error instead of printing the SQL query.

## Simple User Search API

File:

```text
src/admin/api/search_user.php
```

This endpoint overlaps with `search_clients.php`. The search concept is the same, so only the differences are explained here.

Important lines:

```php
3: require_once __DIR__ . "/../../auth/session.php";
4: requireAdminJson();
6: $mysqli = require __DIR__ . "/../../config/db.php";
8: header("Content-Type: application/json");
```

This repeats the protected JSON API setup:

- load session protection
- require admin
- connect to database
- return JSON

```php
10: $q = trim($_GET["q"] ?? "");
12: if (strlen($q) < 2) {
13:     echo json_encode([]);
14:     exit;
15: }
17: $search = "%" . $q . "%";
```

This repeats the same search-input pattern:

- read `q`
- trim spaces
- reject searches shorter than 2 characters
- wrap the value in `%` for SQL `LIKE`

```php
19: $sql = "
20:     SELECT 
21:         user_id,
22:         first_name,
23:         last_name,
24:         phone_number,
25:         email
26:     FROM users
27:     WHERE role = 'client'
```

This searches only client users and returns basic user fields.

Unlike `search_clients.php`, this query does not count active jobs.

```php
28:       AND (
29:         first_name LIKE ?
30:         OR last_name LIKE ?
31:         OR phone_number LIKE ?
32:         OR CONCAT(first_name, ' ', last_name) LIKE ?
33:       )
34:     LIMIT 10
35: ";
```

This searches by first name, last name, phone number, or full name.

It returns at most 10 users.

```php
37: $stmt = $mysqli->prepare($sql);
39: if (!$stmt) {
40:     echo json_encode([]);
41:     exit;
42: }
```

This prepares the SQL safely.

If preparing fails, the endpoint returns an empty array.

```php
44: $stmt->bind_param("ssss", $search, $search, $search, $search);
45: $stmt->execute();
47: $result = $stmt->get_result();
```

This binds the four search values, runs the query, and gets the result.

```php
49: $users = [];
51: while ($row = $result->fetch_assoc()) {
52:     $users[] = $row;
53: }
55: echo json_encode($users);
```

This collects matching users and returns them as JSON.

The response here is closer to raw database rows than `search_clients.php`, which formats rows into frontend client cards.

## Final Backend Flow Summary

The admin clients backend has three main actions:

1. Search clients:

```text
search_clients.php -> searchService.php -> searchClients()
```

2. View client details:

```text
get_client_details.php -> client profile query -> vehicles query -> active jobs query
```

3. Create a client:

```text
createClient.php -> INSERT users -> audit_log_event() -> notify_user_profile_created()
```

`search_user.php` is a simpler search endpoint that returns basic client user rows without the active job count formatting.

## Defense Questions And Answers

Question:

Why does `search_clients.php` return an empty array when the search is shorter than 2 characters?

Answer:

Because very short searches are too broad and can cause unnecessary database work. Returning `[]` keeps the API lightweight.

Question:

Why does `searchClientUsers()` use prepared statements?

Answer:

Because the search text comes from the URL. Prepared statements keep user input separate from SQL code.

Question:

Why does `get_client_details.php` cast `client_id` to an integer?

Answer:

Because `client_id` comes from the URL and is used to select a database record. Casting protects the query from non-numeric input.

Question:

Why does `get_client_details.php` check `u.role = 'client'`?

Answer:

Because the endpoint is only for client profiles. This prevents admin or staff users from being returned by client details.

Question:

Why does the client details response include vehicles and active jobs?

Answer:

Because the admin client profile needs both the client's registered vehicles and the client's current work in progress.

Question:

Why is `password_hash()` used in `createClient.php`?

Answer:

Because the system must store a password hash, not the real password.

Question:

Why does `createClient.php` set `$role = 'client'` manually?

Answer:

Because this action is specifically for creating clients. The role should not be controlled by the submitted form.

Question:

What is the security-sensitive line in `createClient.php`?

Answer:

The SQL insert line directly places POST values into the query string. It works as the insert logic, but the safer pattern would be a prepared statement.

Question:

Why does `createClient.php` call `audit_log_event()`?

Answer:

Because creating a client changes important system data, so the action should be recorded in the audit log.

Question:

Why does `createClient.php` call `notify_user_profile_created()`?

Answer:

Because the newly created client needs to receive their profile/login information.

Question:

What is the difference between `search_clients.php` and `search_user.php`?

Answer:

`search_clients.php` uses `searchService.php` and returns formatted client cards with active job counts. `search_user.php` directly queries basic client user fields and returns simpler rows.
