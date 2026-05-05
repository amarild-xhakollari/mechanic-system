const staffRoleTabs = document.querySelectorAll(".role-switch__tab[data-target]");
const staffLoginMessage = document.querySelector("[data-login-message]");
const staffParams = new URLSearchParams(window.location.search);

if (staffLoginMessage && staffParams.get("error")) {
    staffLoginMessage.hidden = false;
    staffLoginMessage.textContent = "Te dhenat nuk jane te sakta. Kontrolloni kodin identifikues dhe fjalekalimin.";
    window.history.replaceState({}, document.title, window.location.pathname);
}

staffRoleTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        window.location.href = tab.dataset.target;
    });
});
