"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../ts-scripts/utils");
function createElectronDebugTask() {
    return function electronDebugTask() {
        const root = path_1.join(__dirname, '..', 'dist', 'desktop', 'electron-debug');
        const srcDir = path_1.join(__dirname, '..', 'electron');
        const meta = fs_extra_1.readJSONSync(path_1.join(__dirname, '..', 'ts-scripts', 'meta.json'));
        const pack = fs_extra_1.readJSONSync(path_1.join(__dirname, '..', 'package.json'));
        const copyItem = name => fs_extra_1.copy(path_1.join(srcDir, name), path_1.join(root, name));
        const makePackageJSON = () => {
            const targetPackage = Object.create(null);
            meta.electron.createPackageJSONFields.forEach((name) => {
                targetPackage[name] = pack[name];
            });
            Object.assign(targetPackage, meta.electron.defaults);
            targetPackage.server = 'localhost:8080';
            return fs_extra_1.writeFile(path_1.join(root, 'package.json'), JSON.stringify(targetPackage));
        };
        const excludeTypeScrip = list => list.filter(name => path_1.extname(name) !== '.ts');
        const copyNodeModules = () => Promise.all(meta.copyNodeModules.map(name => fs_extra_1.copy(name, path_1.join(root, name))));
        const copyI18next = () => fs_extra_1.copy(path_1.join(__dirname, '..', 'node_modules', 'i18next', 'dist'), path_1.join(root, 'i18next'));
        const renameLocaleDirectory = () => {
            const localesPath = path_1.join(root, 'locales');
            const localePath = path_1.join(root, 'locale');
            if (!fs_1.existsSync(localesPath)) {
                fs_1.rename(localePath, localesPath, error => {
                    if (error) {
                        console.error('renaming of locale error', error);
                        return;
                    }
                });
            }
        };
        return fs_extra_1.readdir(srcDir)
            .then(excludeTypeScrip)
            .then(list => Promise.all(list.map(copyItem)))
            .then(makePackageJSON)
            .then(() => utils_1.loadLocales(root))
            .then(() => renameLocaleDirectory())
            .then(copyNodeModules)
            .then(copyI18next);
    };
}
exports.createElectronDebugTask = createElectronDebugTask;
//# sourceMappingURL=electronDebugTask.js.map