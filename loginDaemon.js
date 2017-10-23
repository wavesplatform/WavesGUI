window.onload = function () {
    const password = localStorage.getItem('__password-demon-data');

    const find = function () {
        const get = function (resolve) {
            const $input = $('input[name="password"]');
            $input.length ? resolve($input) : setTimeout(() => get(resolve), 500);
        };

        return new Promise((resolve) => {
            get(resolve);
        });
    };

    if (location.href.indexOf('loginDaemon=false') === -1) {
        const fill = function () {
            find()
                .then(($input) => {

                    if (password) {
                        $input.val(password);
                        setTimeout(() => {
                            $input.focus();
                            $input.change();
                            $input.closest('form')
                                .find('button[type="submit"]')
                                .click();

                            fill();
                        }, 500);
                    } else {
                        $input.on('input', () => {
                            localStorage.setItem('__password-demon-data', $input.val());
                        });
                    }

                });
        };
        fill();
    }

};
