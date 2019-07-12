/* eslint-disable no-var */
/* eslint-disable no-console */

window.addEventListener('load', function () {
    'use strict';

    var password = localStorage.getItem('__password-demon-data');

    var find = function () {
        var get = function (resolve) {
            var $input = $('input[name="password"]');

            if ($input.length) {
                resolve($input);
            } else {
                setTimeout(function () {
                    get(resolve);
                }, 500);
            }
        };

        return new Promise(function (resolve) {
            get(resolve);
        });
    };

    if (location.href.indexOf('loginDaemon=false') === -1) {
        var nsAttr = 'w-i18n-ns';

        $(document).on('mouseenter', '[w-i18n]', function () {
            var $element = $(this);
            var literal = $element.attr('w-i18n');
            var ns = $element.attr(nsAttr) || $element.closest(`[${nsAttr}]`).attr(nsAttr);
            console.log(`Namespace "${ns}", literal "${literal}"`);
        });

        var fill = function () {
            find()
                .then(function ($input) {
                    if (password) {
                        setTimeout(function () {
                            $input.focus();
                            $input.val(password);
                            $input.change();
                            setTimeout(function () {
                                $input.closest('form')
                                    .find('button[type="submit"]')
                                    .click();

                                setTimeout(fill, 5000);
                            }, 500);
                        }, 500);
                    } else {
                        $input.on('input', function () {
                            localStorage.setItem('__password-demon-data', String($input.val()));
                        });
                    }
                });
        };

        fill();
    }
});
