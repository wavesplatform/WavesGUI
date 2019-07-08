"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../ts-scripts/utils");
function createLocalesTask(output) {
    return function localeTask() {
        return utils_1.loadLocales(output);
    };
}
exports.createLocalesTask = createLocalesTask;
//# sourceMappingURL=localesTask.js.map