import { createSecureServer } from 'http2';
import { createServer } from 'https';
import { route, parseArguments } from './ts-scripts/utils';
import { readFileSync } from 'fs';
import { TBuilds, TConnection, TPlatforms } from './ts-scripts/interface';

const ip = require('my-local-ip')();


const connectionTypes = ['mainnet', 'testnet'];
const buildTypes = ['dev', 'normal', 'min'];

const privateKey = readFileSync('privatekey.pem').toString();
const certificate = readFileSync('certificate.pem').toString();

function createMyServer(port) {

    const connectionTypesHash = arrToHash(connectionTypes);
    const buildTypesHash = arrToHash(buildTypes);

    const handler = function (req, res) {
        const parsed = parseDomain(req.headers[':authority']);
        if (!parsed) {
            res.writeHead(302, { Location: `https://testnet.dev.localhost:${port}` });
            res.end();
        } else {
            route(parsed.connectionType, parsed.buildType, 'web')(req, res);
        }
    };

    function parseDomain(host: string): { connectionType: TConnection, buildType: TBuilds } {
        const [connectionType, buildType] = host.split('.');

        if (!connectionType || !buildType || !buildTypesHash[buildType] || !connectionTypesHash[connectionType]) {
            return null;
        }

        return { buildType, connectionType } as any;
    }

    const server = createSecureServer({ key: privateKey, cert: certificate });

    server.addListener('request', handler);
    server.listen(port);

    console.log(`Listen port ${port}...`);
    console.log('Available urls:');

    connectionTypes.forEach((connection) => {
        buildTypes.forEach((build) => {
            console.log(`https://${connection}.${build}.localhost:${port}`);
        });
    });
}

function createSimpleServer({ port = 8000, type = 'dev', connection = 'mainnet' }) {
    const handler = function (req, res) {
        route(connection as TConnection, type as TBuilds, 'web')(req, res);
    };

    const server = createServer({ key: privateKey, cert: certificate });
    server.addListener('request', handler);
    server.listen(port);
    console.log(`Listen port ${port}, type ${type}, connection ${connection} for simple server`);
    console.log(`https://${ip}:${port}`);
}

createMyServer(8080);
const args = parseArguments() || Object.create(null);
if (args.startSimple) {
    createSimpleServer(args);
}


function arrToHash(arr: Array<string>): Object {
    const result = Object.create(null);
    arr.forEach((some) => result[some] = true);
    return result;
}
