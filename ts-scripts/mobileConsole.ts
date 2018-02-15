window.addEventListener('load', function () {

    if (location.href.indexOf('console=true') !== -1) {

        const out = document.createElement('DIV');
        $(out).css({
            position: 'absolute',
            top: '10px',
            lef: '10px',
            fontSize: '25px',
            padding: '20px',
            zIndex: 100000
        });
        document.body.appendChild(out);

        const origin = window.onerror || (() => null);
        window.onerror = function (message: string, filename?: string, lineno?: number, colno?: number, error?: Error) {
            origin(message, filename, lineno, colno, error);
            const line = document.createElement('div');
            line.innerText = `Message: ${message}\nFile name: ${filename}\nLine: ${lineno}\nStack: ${error.stack}`;
            out.appendChild(line);
        };

    }
});
