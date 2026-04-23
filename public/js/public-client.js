const clientForm = document.getElementById("vehicleForm");
const clientInfoButton = document.getElementById("infoButton");
const clientRoleTabs = document.querySelectorAll(".role-switch__tab[data-target]");

if (clientForm) {
    clientForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const phone = document.getElementById("phoneInput").value;
        const code = document.getElementById("codeInput").value;
        alert("Duke kontrolluar automjetin per:\nTelefon: " + phone + "\nKod: " + code);
    });
}


if (clientInfoButton) {
    clientInfoButton.addEventListener("click", function () {
        alert("Te dhenat tuaja perdoren vetem per kontrollin e sherbimit te automjetit.");
    });
}

clientRoleTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
        window.location.href = tab.dataset.target;
    });
});
