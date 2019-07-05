"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
function createImageListTask(input, output, reg) {
    return function imageListTask() {
        const images = input.map((path) => path.replace(reg, ''));
        return fs_extra_1.writeFile(output, JSON.stringify(images));
    };
}
exports.createImageListTask = createImageListTask;
//# sourceMappingURL=imageListTask.js.map