# Search Service Reference

This document explains the search service used by the admin dashboard for the `Punet` and `Staff` pages.

The implementation uses vanilla JavaScript `fetch()`. This is AJAX-style behavior because the page asks PHP endpoints for JSON without reloading.

## Files Used

| File | Purpose |
| --- | --- |
| `src/admin/actions/searchService.php` | Shared PHP search functions and SQL queries. |
| `src/admin/search_utilitys/search_jobs.php` | HTTP endpoint for job search. |
| `src/admin/search_utilitys/search_staff.php` | HTTP endpoint for staff search. |
| `src/frontend/admin_dashboard.js` | Calls the search endpoints and re-renders cards. |

## Frontend Endpoint Setup

File: `src/frontend/admin_dashboard.js`

| Lines | Code | What it does |
| --- | --- | --- |
| 2 | `const API_ENDPOINT = './fetch%20data/get_dashboard_data.php';` | Existing dashboard endpoint used to load initial dashboard data. |
| 3-6 | `const SEARCH_ENDPOINTS = { ... }` | Stores the two search URLs used by the dashboard. |
| 4 | `jobs: '../admin/search_utilitys/search_jobs.php'` | Jobs page search endpoint. |
| 5 | `staff: '../admin/search_utilitys/search_staff.php'` | Staff page search endpoint. |
| 205-208 | search timers/controllers | Store debounce timers and `AbortController`s for jobs and staff searches. |

## Shared Frontend Fetch Helper

File: `src/frontend/admin_dashboard.js`

| Lines | Code | What it does |
| --- | --- | --- |
| 261 | `async function fetchSearchResults(endpoint, query, controller)` | Reusable function for AJAX-style search requests. |
| 262 | Builds `url` with `?q=...` | Sends the search text as a GET query parameter. `encodeURIComponent()` protects special characters. |
| 263-267 | `fetch(url, { ... })` | Sends the HTTP request without refreshing the page. |
| 264 | `Accept: 'application/json'` | Tells PHP that JavaScript expects JSON. |
| 265 | `credentials: 'same-origin'` | Keeps same-site cookies/session behavior available. |
| 266 | `signal: controller.signal` | Allows old searches to be cancelled when the user keeps typing. |
| 269-271 | `if (!response.ok) throw ...` | Converts HTTP errors into JavaScript errors. |
| 273 | `await response.json()` | Parses the PHP JSON response. |
| 274 | `Array.isArray(results) ? results : []` | Guarantees the rest of the UI receives an array. |

## Job Search Frontend Flow

File: `src/frontend/admin_dashboard.js`

| Lines | Code | What it does |
| --- | --- | --- |
| 669-672 | `getDefaultJobsPanelData()` | Gets the normal jobs list from loaded dashboard data, or demo data if backend data is empty. |
| 674 | `renderJobsResults(jobsData)` | Re-renders the jobs page using search results or default data. |
| 675 | `jobsData.map(normalizeJobForPanel)` | Normalizes backend job statuses/dates for the job card UI. |
| 676-677 | Split into `inProcessJobs` and `completedJobs` | Keeps the same grouped layout as the jobs page. |
| 678-680 | Find list and clear it | Removes old cards before drawing new search results. |
| 682-683 | Empty state | Shows `Nuk ka pune te regjistruara.` if no results come back. |
| 685-690 | `createJobsSection(...)` | Creates the grouped job card sections for returned results. |
| 694-697 | Update count | Displays the number of jobs currently rendered. |
| 700 | `filterJobsPanel(query = '')` | Runs whenever the Jobs search input changes. |
| 701 | `query.trim()` | Removes extra spaces from the search text. |
| 702 | `clearTimeout(jobsSearchTimer)` | Debounces input so the backend is not called on every keystroke instantly. |
| 704-706 | `jobsSearchController.abort()` | Cancels the previous pending request if the user typed again. |
| 708-710 | Short query fallback | If query is under 2 characters, restore the normal jobs list. |
| 713-725 | Debounced backend call | Waits 250ms, calls `search_jobs.php`, then renders results. |
| 717 | `fetchSearchResults(SEARCH_ENDPOINTS.jobs, ...)` | Calls the Jobs PHP search endpoint. |
| 718 | `renderJobsResults(results)` | Draws returned jobs using the existing job-card component. |
| 720-723 | Error handling | Ignores cancelled requests, but shows a toast for real failures. |
| 728-755 | `renderJobs()` | Builds the Jobs page and connects the search bar to `filterJobsPanel`. |
| 750-752 | `createSearchBar(... onSearch: filterJobsPanel)` | Wires the reusable search bar component to backend search. |

## Staff Search Frontend Flow

File: `src/frontend/admin_dashboard.js`

| Lines | Code | What it does |
| --- | --- | --- |
| 437-463 | `transformStaffDataForDetail(staff)` | Converts backend staff objects into the shape needed by `createStaffMemberDetail`. |
| 438-440 | Read `jobs`, `positions`, `jobsInProcess` | Safely handles missing fields from backend data. |
| 448-461 | Builds `sections` object | Matches the expected staff-jobcard component format. |
| 477 | `createStaffScrollContainer(...)` | Draws staff cards into the staff page. |
| 481 | `container.innerHTML = ''` | Clears previous staff cards before rendering search results. |
| 483-485 | Empty state | Shows `Nuk ka staf te regjistruar.` if no staff results exist. |
| 488-490 | Create grid wrapper | Builds the staff grid container. |
| 492-536 | Loop staff results | Creates one staff card per backend result. |
| 501-514 | `createStaffMemberDetail(...)` | Uses your existing `staff-jobcard` frontend component. |
| 539-546 | `getDefaultStaffPanelData()` | Gets normal backend staff data, falling back to demo data only if backend staff is empty. |
| 548-563 | `renderStaffResults(staffData)` | Re-renders staff cards from search results and updates the count. |
| 565 | `filterStaffPanel(query = '')` | Runs whenever the Staff search input changes. |
| 566 | `query.trim()` | Removes extra spaces. |
| 567 | `clearTimeout(staffSearchTimer)` | Debounces input. |
| 569-571 | `staffSearchController.abort()` | Cancels previous staff search request. |
| 573-575 | Short query fallback | If query is under 2 characters, restore all staff. |
| 578-590 | Debounced backend call | Waits 250ms, calls `search_staff.php`, then renders results. |
| 582 | `fetchSearchResults(SEARCH_ENDPOINTS.staff, ...)` | Calls the Staff PHP search endpoint. |
| 583 | `renderStaffResults(results)` | Draws returned staff using the staff-jobcard component. |
| 593-634 | `renderStaff()` | Builds the Staff page and connects the search bar to `filterStaffPanel`. |
| 626-628 | `createSearchBar(... onSearch: filterStaffPanel)` | Wires the reusable search bar component to backend search. |

## Jobs Search Endpoint

File: `src/admin/search_utilitys/search_jobs.php`

| Line | Code | What it does |
| --- | --- | --- |
| 3 | `require __DIR__ . "/../../configs/db.php"` | Opens the database connection. |
| 4 | `require_once ... searchService.php` | Loads shared search functions. |
| 6 | `header("Content-Type: application/json")` | Makes endpoint return JSON. |
| 8 | `$q = trim($_GET["q"] ?? "");` | Reads the search text from the URL query parameter. |
| 10-13 | `strlen($q) < 2` check | Rejects too-short searches and returns an empty JSON array. |
| 15 | `echo json_encode(searchJobs($mysqli, $q));` | Calls the shared job search function and returns JSON to JavaScript. |

## Staff Search Endpoint

File: `src/admin/search_utilitys/search_staff.php`

| Line | Code | What it does |
| --- | --- | --- |
| 3 | `require __DIR__ . "/../../configs/db.php"` | Opens the database connection. |
| 4 | `require_once ... searchService.php` | Loads shared search functions. |
| 6 | `header("Content-Type: application/json")` | Makes endpoint return JSON. |
| 8 | `$q = trim($_GET["q"] ?? "");` | Reads the search text from the URL query parameter. |
| 10-13 | `strlen($q) < 2` check | Rejects too-short searches and returns an empty JSON array. |
| 15 | `echo json_encode(searchStaffMembers($mysqli, $q));` | Calls the shared staff search function and returns JSON to JavaScript. |

## Job Search Query

File: `src/admin/actions/searchService.php`

| Lines | Code | What it does |
| --- | --- | --- |
| 71 | `function searchJobs($conn, $query)` | Defines reusable job search. |
| 72 | `$search = "%" . $query . "%";` | Adds SQL wildcards so partial matches work. |
| 74-92 | SQL string | Builds the job search SQL query. |
| 76-81 | Selected fields | Gets job id, status, date, plate number, client name, and staff name. |
| 82 | `FROM jobs j` | Searches from the jobs table. |
| 83 | `LEFT JOIN vehicles v ...` | Gets plate number for each job. |
| 84 | `LEFT JOIN users client_user ...` | Gets client name. |
| 85 | `LEFT JOIN users staff_user ...` | Gets assigned staff name. |
| 86 | `v.plate_number LIKE ?` | Allows searching by car plate. |
| 87 | client full name `LIKE ?` | Allows searching by client name. |
| 88 | staff full name `LIKE ?` | Allows searching by assigned staff name. |
| 89 | `j.status LIKE ?` | Allows searching by status, such as `created`. |
| 90 | `ORDER BY j.updated_at DESC` | Newest updated jobs appear first. |
| 91 | `LIMIT 30` | Prevents returning too many records. |
| 94 | `$stmt = $conn->prepare($sql);` | Creates a prepared statement. |
| 96-98 | `if (!$stmt) return []` | Safely returns no results if SQL preparation fails. |
| 100 | `$stmt->bind_param("ssss", ...)` | Binds four string parameters safely. |
| 101 | `$stmt->execute();` | Runs the query. |
| 103-104 | `$jobs = []; $result = ...` | Prepares output array and reads query result. |
| 106-123 | `while (...)` loop | Converts database rows into frontend job-card objects. |
| 109-111 | Staff name check | Adds assigned staff name into the `mechanics` array if it exists. |
| 113-122 | Job object shape | Returns fields expected by the existing job card component. |
| 125 | `return $jobs;` | Sends results back to the endpoint. |

## Staff Search Query

File: `src/admin/actions/searchService.php`

| Lines | Code | What it does |
| --- | --- | --- |
| 128 | `function searchStaffMembers($conn, $query)` | Defines reusable staff search. |
| 129 | `$search = "%" . $query . "%";` | Adds wildcards for partial matching. |
| 130 | `$staff = [];` | Creates output array keyed by staff id. |
| 132-154 | SQL string | Builds the staff search SQL query. |
| 133 | `SELECT DISTINCT` | Avoids duplicate staff rows when one staff has multiple matching jobs. |
| 134-138 | Selected fields | Gets staff id, name, role, and login identifier. |
| 139 | `FROM users staff_user` | Staff records live in `users`. |
| 140 | `LEFT JOIN jobs j ...` | Links staff to their assigned jobs. |
| 141 | `LEFT JOIN vehicles v ...` | Allows searching staff by assigned job plate number. |
| 142 | `LEFT JOIN users client_user ...` | Allows searching staff by assigned job client name. |
| 143 | `staff_user.role = 'staff'` | Only returns staff users. |
| 145-148 | Staff fields `LIKE ?` | Searches staff first name, last name, login code, and full name. |
| 149 | `v.plate_number LIKE ?` | Finds staff by vehicle plate assigned to them. |
| 150 | client full name `LIKE ?` | Finds staff by client assigned to their job. |
| 152 | `ORDER BY staff_user.first_name...` | Sorts staff alphabetically. |
| 153 | `LIMIT 30` | Prevents huge result sets. |
| 156 | `$stmt = $conn->prepare($sql);` | Creates prepared statement. |
| 158-160 | `if (!$stmt) return []` | Safely handles query preparation failure. |
| 162 | `$stmt->bind_param("ssssss", ...)` | Binds six string parameters safely. |
| 163 | `$stmt->execute();` | Runs the query. |
| 165-166 | Result and ids array | Reads matching staff and tracks ids for job lookup. |
| 168-186 | `while (...)` loop | Converts staff rows into frontend staff-card objects. |
| 172-185 | Staff object shape | Matches the existing staff-jobcard data structure. |
| 188-190 | Empty result check | Returns empty array if no staff matched. |
| 192 | `getActiveJobsForStaff(...)` | Loads active jobs for the matched staff members. |
| 194-198 | Attach jobs and counts | Adds assigned jobs and updates process count per staff member. |
| 200 | `return array_values($staff);` | Returns JSON-friendly indexed array. |

## Active Jobs For Staff Query

File: `src/admin/actions/searchService.php`

| Lines | Code | What it does |
| --- | --- | --- |
| 203 | `function getActiveJobsForStaff($conn, $staff_ids)` | Helper used by staff search. |
| 205 | `$placeholders = implode(...)` | Creates one `?` placeholder for each staff id. |
| 206 | `$types = str_repeat("i", ...)` | Builds bind types for integer staff ids. |
| 208-221 | SQL string | Loads active jobs for the matching staff ids. |
| 210-214 | Selected fields | Gets job id, staff id, date, plate number, and client name. |
| 215 | `FROM jobs j` | Reads from jobs table. |
| 216 | Join vehicles | Gets plate number. |
| 217 | Join client user | Gets client name. |
| 218 | `j.status IN ('created', 'in_progress')` | Only includes active/in-process jobs. |
| 219 | `j.staff_id IN (...)` | Only loads jobs for the staff found by the search. |
| 220 | `ORDER BY j.updated_at DESC` | Newest jobs first. |
| 223 | `$stmt = $conn->prepare($sql);` | Creates prepared statement. |
| 225-227 | Failure check | Returns empty job map if preparation fails. |
| 229 | `$stmt->bind_param($types, ...$staff_ids);` | Safely binds all staff ids. |
| 230 | `$stmt->execute();` | Runs query. |
| 234-247 | `while (...)` loop | Groups jobs by `staff_id`. |
| 241-246 | Job object shape | Returns fields expected by mini job cards. |
| 249 | `return $jobs_by_staff;` | Sends grouped jobs back to `searchStaffMembers()`. |

## Request Flow Summary

1. User types in the Jobs or Staff search bar.
2. `admin_dashboard.js` waits 250ms so it does not call PHP too often.
3. Any older search request is cancelled with `AbortController`.
4. JavaScript calls `search_jobs.php?q=...` or `search_staff.php?q=...`.
5. The endpoint loads `searchService.php`.
6. `searchService.php` runs a prepared SQL query.
7. PHP returns JSON.
8. JavaScript parses the JSON.
9. The dashboard clears old cards and renders the returned results with the existing card components.

## Example URLs

```text
http://localhost/mechanic-system/src/admin/search_utilitys/search_jobs.php?q=AB
http://localhost/mechanic-system/src/admin/search_utilitys/search_staff.php?q=Medin
```

## Safety Notes

- Prepared statements are used for all dynamic SQL values.
- Search text is passed as a bound parameter, not directly concatenated into the SQL.
- The frontend encodes query text with `encodeURIComponent()`.
- The endpoints reject searches shorter than 2 characters.
- Results are limited to 30 rows for jobs and staff.
