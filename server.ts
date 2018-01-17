import { createSecureServer } from 'http2';
import { route } from './ts-scripts/utils';
import { readFileSync } from 'fs';


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
            route(parsed.connectionType, parsed.buildType)(req, res);
        }
    };

    function parseDomain(host: string): { connectionType: string, buildType: string } {
        const [connectionType, buildType] = host.split('.');

        if (!connectionType || !buildType || !buildTypesHash[buildType] || !connectionTypesHash[connectionType]) {
            return null;
        }

        return { buildType, connectionType };
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

createMyServer(8080);

function arrToHash(arr: Array<string>): Object {
    const result = Object.create(null);
    arr.forEach((some) => result[some] = true);
    return result;
}
