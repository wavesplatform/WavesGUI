import * as connect from 'connect';
import { createServer } from 'http';
import * as path from 'path';
import { join } from 'path';
import * as fs from 'fs-extra';
import * as serveStatic from 'serve-static';
import { replaceStyles, replaceScripts, getFilesFrom, moveTo } from './ts-scripts/utils';
import { compile } from 'handlebars';
import { IMetaJSON } from './ts-scripts/interface';


const connectionTypes = ['mainnet', 'testnet'];
const buildTypes = ['dev', 'normal', 'min'];
const meta: IMetaJSON = fs.readJSONSync(path.join(__dirname, 'ts-scripts/meta.json'));
const pack: IMetaJSON = fs.readJSONSync(path.join(__dirname, 'package.json'));

const networks = connectionTypes.reduce((result, item) => {
    result[item] = meta.configurations[item];
    return result;
}, Object.create(null));

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
            if (isPage(req.url)) {
                if (parsed.buildType !== 'dev') {
                    res.end(fs.readFileSync(path.join(__dirname, localPath, parsed.connectionType, parsed.buildType, 'index.html')));
                } else {
                    let file = fs.readFileSync(path.join(__dirname, './src/index.html'), 'utf8');

                    file = compile(file)({
                        pack: pack,
                        build: {
                            type: 'web'
                        },
                        network: networks[parsed.connectionType]
                    });

                    const dist = path.join(__dirname, './dist/build', parsed.connectionType, 'dev');
                    const processor = moveTo(dist);
                    const styles = getFilesFrom('./src', '.css');
                    const scrits = getFilesFrom('./src', '.js', function (name, path) {
                        return !name.includes('.spec') && !path.includes('/test/');
                    });

                    file = replaceStyles(file, meta.stylesheets.concat(styles).map(processor));
                    file = replaceScripts(file, meta.vendors.concat(scrits).map(processor));

                    res.end(file);
                }
            } else {
                next();
            }
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

function isPage(url: string): boolean {
    const staticPathPartial = [
        'src', 'img', 'css', 'fonts', 'js', 'bower_components', 'node_modules', 'modules', 'locales'
    ];
    return !staticPathPartial.some((path) => {
        return url.includes(`/${path}/`);
    });
}

function arrToHash(arr: Array<string>): Object {
    const result = Object.create(null);
    arr.forEach((some) => result[some] = true);
    return result;
}
