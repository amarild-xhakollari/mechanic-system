(function () {
    AdminPages.loadPage(() => {
        createGoBackButton(document.querySelector('#register-job-back'), {
            label: 'Kthehu',
            fallbackHref: 'admin-jobs.html'
        });

        createRegisterJobPanel(document.querySelector('#register-job-panel'));
    });
}());
