import { spawn } from 'child_process';

export function createSpawn(command: string, args?: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const sp = spawn(command, args);

        sp.stdout.pipe(process.stdout);
        sp.stderr.pipe(process.stderr);

        sp.on('error', reject);

        sp.on('exit', (code, signal) => {
            if (code === 0) {
                resolve(signal);
            } else {
                reject(signal);
            }
        })
    });
}
