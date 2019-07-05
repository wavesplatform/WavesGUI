"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function createCleanTask() {
    return function cleanTask() {
        return utils_1.createSpawn('rm', [
            '-rf',
            './build',
            './dist',
            './tmp',
            './data-service-dist'
        ]);
    };
}
exports.createCleanTask = createCleanTask;
//# sourceMappingURL=cleanTask.js.map