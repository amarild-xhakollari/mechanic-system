(function () {
    fetch('../api/get_dashboard_data.php', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
    }).then((response) => {
        if (response.status === 401 || response.status === 403) {
            window.location.href = '/mechanic-system/public/staff-page.html';
        }
    }).catch(() => {
        window.location.href = '/mechanic-system/public/staff-page.html';
    });
}());
