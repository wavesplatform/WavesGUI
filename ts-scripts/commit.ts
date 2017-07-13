import { getBranchDetail } from './utils';
import { spawn } from 'child_process';


getBranchDetail().then((detail) => {
    const args = Array.prototype.slice.call(process.argv, 2);

    function run(message: string): void {
        const commit = spawn('git', ['commit', '-m', message]);

        commit.stdout.on('data', (data: Buffer) => {
            console.log(String(data));
        });

        commit.stderr.on('data', (data: Buffer) => {
            console.log(String(data));
        });

        commit.on('close', (code: number) => {
            process.exit(code);
        });
    }

    if (detail.ticket && detail.project) {
        run(`"${detail.project}-${detail.ticket}: ${args.join(' ')}"`);
    } else {
        console.warn('\x1b[31m%s\x1b[0m', 'Wrong branch name!');
        run(`"${args.join(' ')}"`);
    }
});
