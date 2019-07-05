"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function createEslintTask() {
    return function eslintTask() {
        return utils_1.createSpawn('node', [
            './node_modules/.bin/eslint',
            '-c', '.eslintrc.json',
            './src/modules/'
        ]);
    };
}
exports.createEslintTask = createEslintTask;
//# sourceMappingURL=eslintTask.js.map