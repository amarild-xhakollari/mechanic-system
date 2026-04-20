const staffForm = document.getElementById("staffForm");
const staffInfoButton = document.getElementById("infoButton");
const staffRoleTabs = document.querySelectorAll(".role-switch__tab[data-target]");

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
