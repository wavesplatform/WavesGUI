import { spawn } from 'child_process';

export function createSpawn(command: string, args?: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const sp = process.platform === 'win32' && command !== 'rm'
            ? spawn('sh', [command, ...args], {
                stdio: [null, process.stdout, process.stderr]
            })
            : spawn(command, args, {
                stdio: [null, process.stdout, process.stderr]
            });

        sp.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
}
