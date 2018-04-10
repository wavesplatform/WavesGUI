window.addEventListener('load', function () {
    const password = localStorage.getItem('__password-demon-data');

    const find = function (): Promise<JQuery> {
        const get = function (resolve) {
            const $input: JQuery = $('input[name="password"]');
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
                        setTimeout(() => {
                            $input.focus();
                            $input.val(password);
                            $input.change();
                            setTimeout(() => {
                                $input.closest('form')
                                    .find('button[type="submit"]')
                                    .click();

                                setTimeout(fill, 5000);
                            }, 500);
                        }, 500);
                    } else {
                        $input.on('input', () => {
                            localStorage.setItem('__password-demon-data', String($input.val()));
                        });
                    }

                });
        };
        fill();
    }

});
