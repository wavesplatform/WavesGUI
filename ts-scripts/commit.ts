import { getBranchDetail, run } from './utils';


getBranchDetail().then((detail) => {
    const args = Array.prototype.slice.call(process.argv, 2);

    function commit(message) {
        run('git',  ['commit', '-m', message]).then((data) => {
            process.exit(data.code);
        });
    }

    if (detail.ticket && detail.project) {
        commit(`${detail.project}-${detail.ticket}: ${args.join(' ')}`);
    } else {
        console.warn('\x1b[31m%s\x1b[0m', 'Wrong branch name!');
        commit(`${args.join(' ')}`);
    }
});
