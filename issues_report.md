# Issues Found in Mechanic System Login Implementation

## Overview
The login system has several path and naming inconsistencies that prevent proper functionality. When submitting the client login form, the redirect to `loginClient.php` fails with "URL not found" due to incorrect file paths and mismatched POST parameter names.

### 2. Mismatched Form Action Paths in HTML
**Location:** `public/staff-page.html` (form action on line ~25)

**Problem:** Form action is `loginStaff.php`, which from `public/` directory would look for `public/loginStaff.php`, but the file is at `src/login/loginStaff.php`.

**Why:** Incorrect relative path to the PHP login handler.

**How to Fix:**
- Change `action="loginStaff.php"` to `action="../src/login/loginStaff.php"`


## Additional Notes
- Ensure all PHP files have the `.php` extension (the workspace structure shows files without extensions, but they contain PHP code)
- The `loginClient` and `loginStaff` files are missing HTML output for the login forms - they only handle POST requests but don't render the forms themselves
- Consider implementing proper error handling and user feedback in the PHP files</content>
<parameter name="filePath">c:\xampp\htdocs\mechanic-system\issues_report.md