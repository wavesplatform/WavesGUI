"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Storage_1 = require("./Storage");
process.once('loaded', () => {
    global.WebStorage = new Storage_1.Storage();
});
//# sourceMappingURL=preload.js.map