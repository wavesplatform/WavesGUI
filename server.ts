import * as connect from 'connect';
import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as serveStatic from 'serve-static';
import { readJSON } from 'fs-extra';

import { IMetaJSON } from './ts-scripts/interface';


const START_PORT = 8080;
const SERVERS = ['testnet', 'mainnet'];

function isPage(url: string) {
    return url === '/' || url.split('/').length === 2;
}

function createMyServer(localPath: string, port: number, name: string) {
    const app = connect();

    app.use(function middleware1(req, res, next) {
        if (isPage(req.url)) {
            res.end(fs.readFileSync(path.join(__dirname, localPath, 'index.html')));
        } else {
            next();
        }
    });

    app.use(serveStatic(__dirname));

    app.use(serveStatic(path.join(__dirname, localPath)));

    createServer(app).listen(port);
    console.log(`Run server for "${name}" on port ${port}`);
}

readJSON('./ts-scripts/meta.json').then((meta: IMetaJSON) => {

    let port = START_PORT;

    createMyServer('./dist/dev', port, 'develop');

    SERVERS.forEach((name) => {
        port++;
        createMyServer(`./dist/${name}`, port, name);
    });

});

