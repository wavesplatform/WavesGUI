window.addEventListener('load', function () {

    if (location.href.indexOf('console=false') !== -1) {
        return null;
    }

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

    window.onerror = function (message: string, filename?: string, lineno?: number, colno?: number, error?: Error) {
        const line = document.createElement('div');
        line.innerText = `Message: ${message}\nFile name: ${filename}\nLine: ${lineno}\nStack: ${error.stack}`;
        out.appendChild(line);
    };

});
