/* eslint-disable prefer-rest-params */
/* eslint-disable no-console */
/* eslint-disable prefer-template */
/* eslint-disable no-var */

(function () {
    'use strict';

    if (location.href.indexOf('console=true') !== -1) {
        var css = function (element, styles) {
            Object.keys(styles).forEach(function (styleName) {
                var value = styles[styleName];
                element.style[styleName] = value;
            });
        };

        var out = document.createElement('DIV');
        css(out, {
            position: 'absolute',
            top: '10%',
            left: '10%',
            fontSize: '25px',
            padding: '20px',
            lineHeight: '30px',
            width: '80%',
            zIndex: 100000,
            borderRadius: '10px',
            border: '1px solid #000',
            backgroundColor: '#eee'
        });
        document.body.appendChild(out);

        const origin = window.onerror || function () { /* pass */ };
        window.onerror = function (message, filename, lineno, colno, error) {
            origin(message, filename, lineno, colno, error);
            var line = document.createElement('div');
            line.innerText = 'Message: ' + message +
                '\nFile name: ' + filename + 'Line: ' + lineno +
                '\nStack: ' + error.stack;
            out.appendChild(line);
        };

        ['log', 'warn', 'error'].forEach(function (methodName) {
            var method = console[methodName];
            console[methodName] = function () {
                method.apply(console, arguments);
                var line = document.createElement('DIV');
                line.innerText = 'Type: ' + methodName + '\nMessage: ' + Array.prototype.join.call(arguments, ', ');
                out.appendChild(line);
            };
        });
    }
})();
