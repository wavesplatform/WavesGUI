import { readFile } from './utils';


const enum ARGUMENTS {
    INTERPRETER,
    FILE_PATH,
    COMMIT_MESSAGE_PATH
}
const path = process.argv[ARGUMENTS.COMMIT_MESSAGE_PATH];


readFile(path).then((message) => {

    const ERROR_MESSAGE = `Wrong commit message!
 Message: "${message}"
 Message pattern "PROJECT-TICKET: description"`;

    if (message.includes('Merge ')) {
        process.exit(0);
    }

    if (!message.includes(':')) {
        console.warn('\x1b[31m%s\x1b[0m', ERROR_MESSAGE);
        process.exit(1);
    }

    const [branchInfo] = message.split(':');
    const [project, ticket] = branchInfo.split('-');

    if (!project || !ticket) {
        console.warn('\x1b[31m%s\x1b[0m', ERROR_MESSAGE);
        process.exit(1);
    }

    if (/[a-z0-9]/.test(project)) {
        console.warn('\x1b[31m%s\x1b[0m', ERROR_MESSAGE);
        process.exit(1);
    }

    process.exit(0);
});
