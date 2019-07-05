"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
function createCopyTask(params) {
    return function copyTask() {
        return Promise.all(params.map(param => fs_extra_1.copy(param.from, param.to)));
    };
}
exports.createCopyTask = createCopyTask;
//# sourceMappingURL=copyTask.js.map