"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function createSpawn(command, args) {
    return new Promise((resolve, reject) => {
        const sp = child_process_1.spawn(command, args);
        sp.stdout.pipe(process.stdout);
        sp.stderr.pipe(process.stderr);
        sp.on('error', reject);
        sp.on('exit', (code, signal) => {
            if (code === 0) {
                resolve(signal);
            }
            else {
                reject(signal);
            }
        });
    });
}
exports.createSpawn = createSpawn;
//# sourceMappingURL=utils.js.map