const staffForm = document.getElementById("staffForm");
const staffInfoButton = document.getElementById("infoButton");
const staffRoleTabs = document.querySelectorAll(".role-switch__tab[data-target]");
const staffLoginMessage = document.querySelector("[data-login-message]");
const staffParams = new URLSearchParams(window.location.search);

if (staffLoginMessage && staffParams.get("error")) {
    staffLoginMessage.hidden = false;
    staffLoginMessage.textContent = "Te dhenat nuk jane te sakta. Kontrolloni kodin identifikues dhe fjalekalimin.";
    window.history.replaceState({}, document.title, window.location.pathname);
}

if (staffForm) {
    staffForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const code = document.getElementById("codeInput").value;
        alert("Duke hyre ne sistem me kodin: " + code);
    });
}

if (staffInfoButton) {
    staffInfoButton.addEventListener("click", function () {
        alert("Kodi special dhe fjalekalimi jepen manualisht nga administratori.");
    });
}

staffRoleTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        window.location.href = tab.dataset.target;
    });
});
