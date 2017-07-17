import * as connect from 'connect';
import * as path from 'path';
import * as fs from 'fs';
import * as serveStatic from 'serve-static';

const app = connect();

function isPage(url: string) {
    return url === '/' || url.split('/').length === 2;
}

app.use(function middleware1(req, res, next) {
    if (isPage(req.url)) {
        res.end(fs.readFileSync(path.join(__dirname, 'dist/dev/index.html')));
    } else {
        next();
    }
});

app.use(serveStatic(__dirname));

app.use(serveStatic(path.join(__dirname, './dist/dev')));

app.listen(8080, function () {
    console.log('Server running on 8080...');
});