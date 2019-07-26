import { writeFile } from 'fs-extra';
import { TaskFunction } from 'gulp';
import { join } from 'path';
import { IMetaJSON, IPackageJSON, TPlatform } from '../ts-scripts/interface';

export function createElectronPackageTask(
    output: string,
    platform: TPlatform,
    meta: IMetaJSON,
    pack: IPackageJSON
): TaskFunction {
    return function electronPackageTask() {
        if (platform === 'desktop') {
            const targetPackage = Object.create(null);

            meta.electron.createPackageJSONFields.forEach((name) => {
                targetPackage[name] = pack[name];
            });

            Object.assign(targetPackage, meta.electron.defaults);
            targetPackage.server = meta.electron.server;

            return writeFile(join(output, 'package.json'), JSON.stringify(targetPackage, null, 4));
        } else {
            return Promise.resolve();
        }
    }
}
