const clientRoleTabs = document.querySelectorAll(".role-switch__tab[data-target]");
const clientLoginMessage = document.querySelector("[data-login-message]");
const clientParams = new URLSearchParams(window.location.search);

if (clientLoginMessage && clientParams.get("error")) {
    clientLoginMessage.hidden = false;
    clientLoginMessage.textContent = "Te dhenat nuk jane te sakta. Kontrolloni numrin e telefonit dhe kodin.";
    window.history.replaceState({}, document.title, window.location.pathname);
}

clientRoleTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        window.location.href = tab.dataset.target;
    });
});
