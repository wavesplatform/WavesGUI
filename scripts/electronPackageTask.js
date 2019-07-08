"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function createElectronPackageTask(output, platform, meta, pack) {
    return function electronPackageTask() {
        if (platform === 'desktop') {
            const targetPackage = Object.create(null);
            meta.electron.createPackageJSONFields.forEach((name) => {
                targetPackage[name] = pack[name];
            });
            Object.assign(targetPackage, meta.electron.defaults);
            targetPackage.server = meta.electron.server;
            return fs_extra_1.writeFile(path_1.join(output, 'package.json'), JSON.stringify(targetPackage, null, 4));
        }
        else {
            return Promise.resolve();
        }
    };
}
exports.createElectronPackageTask = createElectronPackageTask;
//# sourceMappingURL=electronPackageTask.js.map