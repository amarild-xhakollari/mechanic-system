# Login Backend Deep Dive

This document explains the login module in backend depth. It focuses on every file and important line that connects the login pages to PHP, sessions, MySQL, password checking, redirects, and audit logs.

## Login Module Purpose

The login module decides:

- who the user is
- whether the password is correct
- what role the user has
- which dashboard the user should enter
- what session data should be saved
- whether the login attempt should be saved in audit logs

The system has two login flows:

- Client login
- Staff/Admin login

Clients log in with:

- phone number
- code/password

Staff and admins log in with:

- identifier, email, or phone number
- password

## Main Files

Login page files:

- `public/public-client.html`
- `public/staff-page.html`

Login page JavaScript:

- `public/js/public-client.js`
- `public/js/staff-page.js`

Backend login controllers:

- `src/auth/loginClient.php`
- `src/auth/loginStaff.php`

Backend helper files:

- `src/config/db.php`
- `src/auth/userLogin.php`
- `src/auth/userAuth.php`
- `src/auth/session.php`
- `src/audit/audit_logger.php`

Protected API example:

- `public/api/client_dashboard.php`

## Full Client Login Flow

1. Client opens `public/public-client.html`.
2. The form submits to `src/auth/loginClient.php`.
3. PHP connects to the database using `src/config/db.php`.
4. PHP finds a user by phone number using `findUserByPhone()`.
5. PHP validates the password and role using `validateClientLogin()`.
6. If valid, PHP creates a session using `createSession()`.
7. PHP writes a successful login audit log.
8. PHP redirects the client to the client dashboard.
9. If invalid, PHP writes a failed audit log.
10. PHP redirects back to the login page with an error query parameter.
11. JavaScript sees the error parameter and displays an error message.

## Full Staff/Admin Login Flow

1. Staff or admin opens `public/staff-page.html`.
2. The form submits to `src/auth/loginStaff.php`.
3. PHP connects to the database using `src/config/db.php`.
4. PHP finds a staff/admin user using `findStaffUserByLogin()`.
5. PHP validates the password and role using `validateStaffLogin()`.
6. If valid, PHP creates a session using `createSession()`.
7. PHP writes a successful login audit log.
8. If the role is `admin`, PHP redirects to the admin dashboard.
9. If the role is `staff`, PHP redirects to the staff dashboard.
10. If invalid, PHP writes a failed audit log.
11. PHP redirects back to the staff login page with an error query parameter.
12. JavaScript sees the error parameter and displays an error message.

## Client Login Page

File:

```text
public/public-client.html
```

Important backend-connected lines:

```html
28: <form class="stack-form" action="/mechanic-system/src/auth/loginClient.php" method="post">
```

This line connects the frontend to the backend.

- `action` tells the browser where to send the form.
- `method="post"` sends the data as a POST request.
- The target backend file is `src/auth/loginClient.php`.

```html
33: <input class="field__input" type="tel" name="phone_number" id="phoneInput" placeholder="06X XXXX XXX" required>
```

This input becomes:

```php
$_POST["phone_number"]
```

in `loginClient.php`.

```html
38: <input class="field__input " type="text" id="codeInput"  name="password" placeholder="AXXXXX" required >
```

This input becomes:

```php
$_POST["password"]
```

in `loginClient.php`.

```html
67: <script src="js/public-client.js"></script>
```

This loads the JavaScript that handles login error messages and role switching.

## Staff Login Page

File:

```text
public/staff-page.html
```

Important backend-connected lines:

```html
28: <form action="/mechanic-system/src/auth/loginStaff.php" method="post" class="stack-form">
```

This connects the staff/admin form to the backend file:

```text
src/auth/loginStaff.php
```

```html
33: <input class="field__input" type="text" name="identifier" id="codeInput" placeholder="Shkruaj ketu kodin special" required>
```

This input becomes:

```php
$_POST["identifier"]
```

in `loginStaff.php`.

```html
38: <input class="field__input" name="password" type="password" id="passwordInput" placeholder="Shkruaj ketu fjalekalimin" required>
```

This input becomes:

```php
$_POST["password"]
```

in `loginStaff.php`.

```html
65: <script src="js/staff-page.js"></script>
```

This loads the JavaScript that handles staff login errors and role switching.

## Client Login JavaScript

File:

```text
public/js/public-client.js
```

Important lines:

```js
1: const clientRoleTabs = document.querySelectorAll(".role-switch__tab[data-target]");
```

Finds role switch buttons that have a `data-target` attribute.

```js
2: const clientLoginMessage = document.querySelector("[data-login-message]");
```

Finds the hidden paragraph where an error message can be displayed.

```js
3: const clientParams = new URLSearchParams(window.location.search);
```

Reads the query string from the URL.

Example failed login URL:

```text
public-client.html?error=invalid_client_login
```

```js
5: if (clientLoginMessage && clientParams.get("error")) {
6:     clientLoginMessage.hidden = false;
7:     clientLoginMessage.textContent = "Te dhenat nuk jane te sakta. Kontrolloni numrin e telefonit dhe kodin.";
8:     window.history.replaceState({}, document.title, window.location.pathname);
9: }
```

If the backend redirected with `?error=...`, this block:

- shows the error message
- writes the Albanian error text
- removes the error query from the URL after showing it

```js
11: clientRoleTabs.forEach(function (tab) {
12:     tab.addEventListener("click", function () {
13:         window.location.href = tab.dataset.target;
14:     });
15: });
```

This is not backend authentication, but it connects the client login page to the staff login page by changing the browser location.

## Staff Login JavaScript

File:

```text
public/js/staff-page.js
```

It works almost the same as the client login JavaScript.

Important lines:

```js
3: const staffParams = new URLSearchParams(window.location.search);
```

Reads URL query parameters.

```js
5: if (staffLoginMessage && staffParams.get("error")) {
6:     staffLoginMessage.hidden = false;
7:     staffLoginMessage.textContent = "Te dhenat nuk jane te sakta. Kontrolloni kodin identifikues dhe fjalekalimin.";
8:     window.history.replaceState({}, document.title, window.location.pathname);
9: }
```

If backend redirects to:

```text
staff-page.html?error=invalid_staff_login
```

then this block shows the login error message.

## Database Connection

File:

```text
src/config/db.php
```

Important lines:

```php
3: $serverName = "localhost";
4: $database = "cars_db";
5: $username = "root";
6: $password = "password";
```

These variables define how PHP connects to MySQL.

```php
8: $conn = mysqli_connect($serverName, $username, $password, $database);
```

This opens the MySQL connection.

```php
10: if (!$conn) {
11:     die("Connection failed: " . mysqli_connect_error());
12: }
```

If the connection fails, the script stops.

```php
14: mysqli_set_charset($conn, "utf8mb4");
```

This sets the connection encoding. `utf8mb4` supports more characters and is safer for text data.

```php
16: $mysqli = $conn;
18: return $conn;
```

The file returns the database connection so other PHP files can use it.

Example from login:

```php
$conn = require __DIR__ . "/../config/db.php";
```

## Client Login Controller

File:

```text
src/auth/loginClient.php
```

This file handles the POST request from the client login form.

Important lines:

```php
3: $conn=require __DIR__ . "/../config/db.php";
```

Loads the database connection.

```php
4: require_once __DIR__ . "/userLogin.php";
5: require_once __DIR__ . "/userAuth.php";
6: require_once __DIR__ . "/session.php";
7: require_once __DIR__ . "/../audit/audit_logger.php";
```

These load helper functions:

- `userLogin.php`: find users in the database
- `userAuth.php`: validate passwords and roles
- `session.php`: create session and protect routes
- `audit_logger.php`: write audit logs

```php
9: if ($_SERVER["REQUEST_METHOD"] === "POST") {
```

Only handles form submissions using POST.

```php
11: $phone = $_POST["phone_number"] ?? "";
12: $password = $_POST["password"] ?? "";
```

Reads form values from the client login page.

These names match the HTML input names:

- `name="phone_number"`
- `name="password"`

```php
14: $user = findUserByPhone($conn, $phone);
```

Looks for a client user in the database using the phone number.

```php
16: if (validateClientLogin($user, $password)) {
```

Checks three things:

- user exists
- password is correct
- user role is `client`

```php
17: createSession($user);
```

Creates a PHP session and stores:

```php
$_SESSION["user_id"]
$_SESSION["role"]
```

```php
18-27: audit_log_event(...)
```

Writes a successful login record to `audit_log`.

Important values:

- `actor_user_id`: logged-in user id
- `actor_role`: `client`
- `action`: `LOGIN`
- `entity_type`: `auth`
- `status`: default success

```php
28: header("Location: /mechanic-system/src/client/pages/client-active-jobs.html");
29: exit;
```

Redirects the client to the client dashboard after successful login.

The `exit` is important because it stops PHP from continuing after the redirect.

```php
32-43: audit_log_event(...)
```

If login fails, this writes a failed login attempt to `audit_log`.

Important values:

- `actor_user_id`: `null`
- `actor_role`: `client`
- `status`: `failed`
- `error_message`: `Invalid client credentials`

```php
45: header("Location: /mechanic-system/public/public-client.html?error=invalid_client_login");
46: exit;
```

Redirects back to the client login page with an error flag.

The frontend JavaScript reads this error flag and shows the error message.

## Staff/Admin Login Controller

File:

```text
src/auth/loginStaff.php
```

This file handles staff and admin login.

Important lines:

```php
3: $conn=require __DIR__ . "/../config/db.php";
```

Loads the database connection.

```php
4: require_once __DIR__ . "/userLogin.php";
5: require_once __DIR__ . "/userAuth.php";
6: require_once __DIR__ . "/session.php";
7: require_once __DIR__ . "/../audit/audit_logger.php";
```

Loads the helper functions for database lookup, password validation, session creation, and audit logs.

```php
11: if ($_SERVER["REQUEST_METHOD"] === "POST" || $_SERVER["REQUEST_METHOD"] === "GET") {
```

This accepts both POST and GET requests.

For a real production login, POST is safer because GET can expose credentials in the URL. For this project, the form uses POST.

```php
13: $identifier = trim($_POST["identifier"] ?? $_GET["identifier"] ?? "");
14: $password = $_POST["password"] ?? $_GET["password"] ?? "";
```

Reads the identifier and password.

The identifier can be:

- login identifier
- email
- phone number

```php
16: $user = findStaffUserByLogin($conn, $identifier);
```

Looks for a user with role `staff` or `admin`.

```php
18: if (validateStaffLogin($user, $password)) {
```

Checks:

- user exists
- password is correct
- role is `staff` or `admin`

```php
19: createSession($user);
```

Stores logged-in user data in PHP session.

```php
20-29: audit_log_event(...)
```

Writes a successful login audit record.

```php
31: if ($user["role"] === "admin") {
32:     header("Location: /mechanic-system/src/admin/pages/admin-home.html");
33: } else {
34:     header("Location: /mechanic-system/src/staff/pages/staff_dashboard.html");
35: }
```

Redirects users based on role:

- admin goes to admin dashboard
- staff goes to staff dashboard

```php
40-51: audit_log_event(...)
```

If login fails, writes a failed audit record.

```php
53: header("Location: /mechanic-system/public/staff-page.html?error=invalid_staff_login");
54: exit;
```

Redirects back to the staff login page with an error flag.

## User Lookup Helpers

File:

```text
src/auth/userLogin.php
```

This file contains database queries for finding users.

### `fetchOneUser()`

```php
3: function fetchOneUser($conn, $sql, $types, ...$values) {
```

This is a reusable helper for selecting one user from the database.

```php
4-6: if (!$conn) { return null; }
```

If there is no database connection, return `null`.

```php
8: $stmt = $conn->prepare($sql);
```

Prepares a SQL statement.

This is important because prepared statements protect against SQL injection.

```php
15: $stmt->bind_param($types, ...$values);
```

Binds values into the prepared SQL query.

For example, `"s"` means the value is a string.

```php
17-20: if (!$stmt->execute()) { ... }
```

Executes the query and logs an error if it fails.

```php
22: $result = $stmt->get_result();
23: return $result ? $result->fetch_assoc() : null;
```

Gets one row as an associative array.

Example result:

```php
[
  "user_id" => 5,
  "phone_number" => "...",
  "role" => "client",
  "password_hash" => "..."
]
```

### `findUserByPhone()`

```php
26: function findUserByPhone($conn, $phone) {
27:     $phone = trim($phone ?? "");
```

Used for client login.

```php
29-31: if ($phone === "") { return null; }
```

If phone is empty, no login is possible.

```php
35: "SELECT * FROM users WHERE phone_number = ? AND role = 'client' LIMIT 1",
```

Finds only users where:

- phone number matches
- role is `client`

This prevents staff/admin users from logging in through the client form.

### `findStaffUserByLogin()`

```php
56: function findStaffUserByLogin($conn, $login) {
```

Used for staff/admin login.

```php
68: WHERE role IN ('staff', 'admin')
```

Only staff and admins are allowed.

```php
70: login_identifier = ?
71: OR email = ?
72: OR phone_number = ?
```

The same login value is checked against:

- login identifier
- email
- phone number

This gives staff/admin more than one way to log in.

## Password And Role Validation

File:

```text
src/auth/userAuth.php
```

Important lines:

```php
3: function verifyPassword($inputPassword, $hashedPassword) {
4:     return password_verify($inputPassword, $hashedPassword);
5: }
```

This checks a plain password against the hashed password stored in the database.

The database stores `password_hash`, not the plain password.

```php
7: function validateClientLogin($user, $password) {
8:     if (!$user) return false;
9:     if (!verifyPassword($password, $user['password_hash'])) return false;
10:    if ($user['role'] !== 'client') return false;
12:    return true;
13: }
```

Client login only succeeds if:

- user exists
- password is correct
- role is exactly `client`

```php
15: function validateStaffLogin($user, $password) {
16:     if (!$user) return false;
17:     if (!verifyPassword($password, $user['password_hash'])) return false;
18:     if (!in_array($user['role'], ['staff', 'admin'], true)) return false;
20:     return true;
21: }
```

Staff/admin login only succeeds if:

- user exists
- password is correct
- role is `staff` or `admin`

## Session Helper

File:

```text
src/auth/session.php
```

This file manages login state.

### Starting A Session

```php
3: function startSessionIfNeeded() {
4:     if (session_status() === PHP_SESSION_NONE) {
5:         session_start();
6:     }
7: }
```

PHP sessions must be started before reading or writing `$_SESSION`.

This helper starts the session only if one is not already active.

### Creating A Session

```php
9: function createSession($user) {
10:    startSessionIfNeeded();
12:    $_SESSION['user_id'] = $user['user_id'];
13:    $_SESSION['role'] = $user['role'];
14: }
```

This is called after successful login.

It stores the user id and role in the session.

This is the main reason the system remembers the logged-in user after redirecting to another page.

### Logging Out

```php
16: function logout($redirectTo = null) {
17:     startSessionIfNeeded();
18:     session_destroy();
```

This deletes the session.

```php
20-23: if ($redirectTo) { header("Location: " . $redirectTo); exit; }
```

After logout, the user is redirected.

### Checking Login State

```php
26: function isLoggedIn() {
27:     startSessionIfNeeded();
28:     return isset($_SESSION['user_id']);
29: }
```

Checks whether any user is logged in.

```php
31: function isAdmin() {
32:     startSessionIfNeeded();
33:     return isset($_SESSION['user_id'], $_SESSION['role']) && $_SESSION['role'] === 'admin';
34: }
```

Checks whether the logged-in user is admin.

```php
36: function isStaff() {
37:     startSessionIfNeeded();
38:     return isset($_SESSION['user_id'], $_SESSION['role']) && $_SESSION['role'] === 'staff';
39: }
```

Checks whether the logged-in user is staff.

### Protecting JSON APIs

```php
41: function requireAdminJson() {
42:     if (isAdmin()) {
43:         return;
44:     }
```

Allows the request only if the user is admin.

```php
46-52
```

If not admin:

- returns HTTP 403
- returns JSON error
- stops the script

```php
55: function requireStaffJson() {
56:     if (isStaff()) {
57:         return;
58:     }
```

Allows only staff users.

```php
69: function requireRoleJson($role) {
70:     startSessionIfNeeded();
72:     if (isset($_SESSION['user_id'], $_SESSION['role']) && $_SESSION['role'] === $role) {
73:         return;
74:     }
```

Allows only the role passed into the function.

Example:

```php
requireRoleJson("client");
```

means only clients can access that API.

```php
76-82
```

If the role does not match:

- HTTP 403
- JSON error message
- script stops

### Logout Endpoint

```php
85: if (isset($_GET['action']) && $_GET['action'] === 'logout') {
86:     logout("/mechanic-system/public/staff-page.html");
87: }
```

If the browser opens:

```text
/mechanic-system/src/auth/session.php?action=logout
```

then the system destroys the session and redirects to the staff login page.

## Audit Logger Connection

File:

```text
src/audit/audit_logger.php
```

Login controllers call:

```php
audit_log_event($conn, [...])
```

Important backend lines:

```php
25: function audit_log_event(mysqli $conn, array $event): void {
```

Main function for saving audit logs.

```php
27-31
```

Finds the actor user id. If one is provided, it uses it. Otherwise, it tries to read from `$_SESSION`.

```php
32-47
```

Reads the audit data:

- actor role
- action
- entity type
- entity id
- description
- old values
- new values
- request method
- request path
- IP address
- user agent
- session hash
- status
- error message

```php
49-53
```

Prepares the SQL insert into:

```sql
audit_log
```

```php
59-78
```

Binds all values into the prepared statement.

```php
79: $stmt->execute();
```

Actually inserts the audit log row.

For login, this means successful and failed attempts are recorded.

## Protected API Example

File:

```text
public/api/client_dashboard.php
```

Important lines:

```php
5: require_once __DIR__ . "/../../src/auth/session.php";
6: requireRoleJson("client");
```

This protects the client dashboard API.

If the user is not logged in as a client, the API returns 403 and stops.

```php
8: $conn = require __DIR__ . "/../../src/config/db.php";
9: $client_id = (int) ($_SESSION["user_id"] ?? 0);
```

After the session is checked, the API uses the logged-in user's id from `$_SESSION`.

```php
14: WHERE user_id = ?
15:   AND role = 'client'
```

The database query also checks that the user is really a client.

So protection happens in two places:

1. Session role check
2. Database role check

## Login Security Ideas Used

The login module uses several good security ideas:

- Passwords are checked using `password_verify()`.
- Passwords are stored as hashes, not plain text.
- Database queries use prepared statements.
- Sessions store only user id and role.
- Protected APIs check the session role before returning data.
- Failed login attempts are saved in `audit_log`.

## Things To Mention Carefully In Defense

You can say:

> The login system starts from an HTML form. The form sends POST data to a PHP login controller. The controller connects to MySQL, finds the user with a prepared statement, checks the password hash using `password_verify`, validates the role, creates a PHP session, writes an audit log, and redirects the user to the correct dashboard.

For client login:

> Clients log in with phone number and code/password. The backend only searches users where `role = 'client'`, so staff or admins cannot enter through the client login form.

For staff/admin login:

> Staff and admins use a separate login form. The backend accepts only users where the role is `staff` or `admin`. After login, admins are redirected to the admin dashboard and staff are redirected to the staff dashboard.

For sessions:

> After successful login, the system stores `user_id` and `role` in `$_SESSION`. Other APIs use this session data to decide whether the user is allowed to access that endpoint.

For audit logs:

> Both successful and failed login attempts are saved in the audit log. This helps the admin track access and failed attempts.

## Simple Diagram

```text
HTML Login Form
      |
      v
loginClient.php or loginStaff.php
      |
      v
db.php connects to MySQL
      |
      v
userLogin.php finds user
      |
      v
userAuth.php verifies password and role
      |
      v
session.php creates session
      |
      v
audit_logger.php stores login event
      |
      v
Redirect to correct dashboard
```

## Short Oral Answer

Use this if they ask you to explain login quickly:

> The login module has separate flows for clients and staff/admin. The HTML form sends data to a PHP controller. The controller loads the database connection, searches for the user with prepared statements, verifies the password using `password_verify`, checks the role, then creates a PHP session with `user_id` and `role`. If login succeeds, the user is redirected to the correct dashboard. If it fails, the system writes a failed audit log and redirects back with an error message. Protected APIs later use the session role to allow or block access.
