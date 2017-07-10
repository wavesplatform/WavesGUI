var connect = require('connect');
var path = require('path');
var fs = require('fs');
var serveStatic = require('serve-static');

var app = connect();

function isPage(url) {
    return url === '/' || url.split('/').length === 2;
}

app.use(function middleware1(req, res, next) {
    if (isPage(req.url)) {
        res.end(fs.readFileSync(path.join(__dirname, 'src/index.html')));
    } else {
        next();
    }
});

app.use(serveStatic(__dirname));

app.use(serveStatic(path.join(__dirname, './src')));

app.listen(8080, function () {
    console.log('Server running on 8080...');
});