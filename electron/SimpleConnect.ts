import { createServer, IncomingHttpHeaders, Server, STATUS_CODES } from 'http';
import { URL } from 'url';

type Callback = (data: any, url: URL, headers: IncomingHttpHeaders) => Promise<any>;

export class SimpleConnect {
    public static listen(port: number, cb: Callback): Server {
        const server = createServer((req, res) => {
            let dataString = '';

            req.on('data', (chunk: string) => {
                dataString += chunk;
            });

            req.on('end', () => {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');

                try {
                    const data = JSON.parse(dataString || 'null');
                    const base = 'http://' + req.headers['host'].toString();
                    const url = new URL(req.url, base);

                    cb(data, url, req.headers).then((result: string) => {
                        res.writeHead(200);
                        res.end(result);
                    }).catch((error: string) => {
                        res.writeHead(400);
                        res.end(String(error) || STATUS_CODES[400]);
                    });
                } catch (e) {
                    res.writeHead(500);
                    res.end(String(e) || STATUS_CODES[500]);
                }
            });

            req.on('error', (e) => {
                res.writeHead(500);
                res.end(String(e) || STATUS_CODES[500]);
            });
        });

        server.listen(port);

        return server;
    }
}
