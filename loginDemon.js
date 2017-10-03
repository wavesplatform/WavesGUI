window.onload = function () {
    const password = localStorage.getItem('__password-demon-data');

    const find = function () {
        const get = function (resolve) {
            const $input = $('body.welcome input[name="password"]');
            $input.length ? resolve($input) : setTimeout(() => get(resolve), 50);
        };

        return new Promise((resolve) => {
            get(resolve);
        });
    };

    if (location.href.indexOf('loginDemon=false') === -1) {
        find()
            .then(($input) => {

                if (password) {
                    $input.val(password);
                    setTimeout(() => {
                        $input.focus();
                        $input.change();
                        $('body.welcome button[type="submit"]')
                            .click();
                    }, 500);
                } else {
                    $input.on('input', () => {
                        localStorage.setItem('__password-demon-data', $input.val());
                    });
                }

            });
    }

};
