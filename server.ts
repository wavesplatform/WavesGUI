import { createSecureServer } from 'http2';
import { createServer } from 'https';
import { route, parseArguments } from './ts-scripts/utils';
import { readFileSync } from 'fs';
import { serialize, parse as parserCookie } from 'cookie';
import { compile } from 'handlebars';
import { parse } from 'url';
import { TBuild, TConnection, TPlatform } from './ts-scripts/interface';
import { readFile } from 'fs-extra';
import { join } from 'path';

const ip = require('my-local-ip')();


const connectionTypes: Array<TConnection> = ['mainnet', 'testnet'];
const buildTypes: Array<TBuild> = ['dev', 'normal', 'min'];

const privateKey = readFileSync('localhost.key').toString();
const certificate = readFileSync('localhost.crt').toString();

const handler = function (req, res) {
    const url = parse(req.url);

    if (url.href.includes('/choose/')) {
        const [platform, connection, build] = url.href.replace('/choose/', '').split('/');
        const cookie = serialize('session', `${platform},${connection},${build}`, {
            maxAge: 60 * 60 * 24,
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);
        res.statusCode = 302;
        res.setHeader('Location', req.headers.referer);
        res.end();

        return null;
    }

    const parsed = parseCookie(req.headers.cookie);
    if (!parsed) {
        readFile(join(__dirname, 'chooseBuild.hbs'), 'utf8').then((file) => {
            res.end(compile(file)({ links: getBuildsLinks(req.headers['user-agent']) }));
        });
    } else {
        route(parsed.connection, parsed.build, parsed.platform)(req, res);
    }
};

function createMyServer(port) {

    const server = createSecureServer({ key: privateKey, cert: certificate });

    server.addListener('request', handler);
    server.listen(port);

    console.log(`Listen port ${port}...`);
    console.log('Available urls:');

    console.log(`https://localhost:${port}`);
}

function createSimpleServer({ port = 8000 }) {
    const server = createServer({ key: privateKey, cert: certificate });
    server.addListener('request', handler);
    server.listen(port);
    console.log(`Listen port ${port}, for simple server`);
    console.log(`https://${ip}:${port}`);
}

createMyServer(8080);
const args = parseArguments() || Object.create(null);
if (args.startSimple) {
    createSimpleServer(args);
}

function getBuildsLinks(userAgent: string = ''): Array<{ url: string; text: string }> {
    const result = [];
    const platform: TPlatform = userAgent.includes('Electron') ? 'desktop' : 'web';

    connectionTypes.forEach((connection) => {
        buildTypes.forEach((build) => {
            result.push({
                url: `/choose/${platform}/${connection}/${build}`,
                text: `${platform} ${connection} ${build}`
            });
        });
    });

    return result;
}

function parseCookie(header = ''): IRequestData {
    const [platform, connection, build] = ((parserCookie(header) || Object.create(null)).session || '').split(',');
    if (!(build && connection && platform)) {
        return null;
    }
    return { platform, connection, build } as IRequestData;
}

interface IRequestData {
    platform: TPlatform;
    connection: TConnection;
    build: TBuild;
}
