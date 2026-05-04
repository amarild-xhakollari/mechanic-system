const profileButton = document.getElementById("profileBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const dropdownArrow = document.getElementById("dropdownArrow");
const logoutButton = document.getElementById("logoutBtn");
const notificationButton = document.getElementById("notificationBtn");

if (profileButton && dropdownMenu && dropdownArrow) {
    profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        dropdownMenu.classList.toggle("show");
        dropdownArrow.classList.toggle("open");
    });

    document.addEventListener("click", function (event) {
        if (!dropdownMenu.contains(event.target) && !profileButton.contains(event.target)) {
            dropdownMenu.classList.remove("show");
            dropdownArrow.classList.remove("open");
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        window.location.href = "../src/auth/session.php?action=logout";
    });
}

if (notificationButton) {
    notificationButton.addEventListener("click", function () {
        alert("Ju keni 2 njoftime te reja!");
    });
}
