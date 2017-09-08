import * as connect from 'connect';
import { createServer } from 'http';
import { join } from 'path';
import * as serveStatic from 'serve-static';
import { isPage, route } from './ts-scripts/utils';


const connectionTypes = ['mainnet', 'testnet'];
const buildTypes = ['dev', 'normal', 'min'];

function createMyServer(localPath: string, port: number) {
    const app = connect();

    const connectionTypesHash = arrToHash(connectionTypes);
    const buildTypesHash = arrToHash(buildTypes);

    app.use(function (req, res, next) {
        const parsed = parseDomain(req.headers.host);
        if (!parsed) {
            res.writeHead(302, { Location: 'http://testnet.dev.localhost:8080' });
            res.end();
        } else {
            route(parsed.connectionType, parsed.buildType)(req, res, next);
        }
    });

    connectionTypes.forEach((connectionType) => {
        buildTypes.forEach((buildType) => {
            app.use(serveStatic(`dist/build/${connectionType}/${buildType}`));
        });
    });

    app.use(serveStatic(__dirname));
    app.use(serveStatic(join(__dirname, 'src')));

    createServer(app).listen(port);
    console.log(`Run server on port ${port}`);

    function parseDomain(host: string): { connectionType: string, buildType: string } {
        const toParse = host.replace('localhost:8080', '');
        const [connectionType, buildType] = toParse.split('.');

        if (!connectionType || !buildType || !buildTypesHash[buildType] || !connectionTypesHash[connectionType]) {
            return null;
        }

        return { buildType, connectionType };
    }
}

createMyServer('./dist/build', 8080);

function arrToHash(arr: Array<string>): Object {
    const result = Object.create(null);
    arr.forEach((some) => result[some] = true);
    return result;
}
