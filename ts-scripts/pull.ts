import { getBranch, run } from './utils';

getBranch().then((branch) => {
    console.log(`git pull origin ${branch}`);
    return run('git', ['pull', 'origin', branch]);
});
