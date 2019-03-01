"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loggable(constructor) {
    const constructorsClass = constructor.prototype;
    Object.getOwnPropertyNames(constructorsClass)
        .filter(name => typeof constructorsClass[name] === 'function')
        .forEach(propertyName => {
        const descriptor = Object.getOwnPropertyDescriptor(constructorsClass, propertyName);
        ;
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            console.log("Method's name " + propertyName);
            const result = originalMethod.apply(this, args);
            console.log("The return value is: " + result);
            return result;
        };
        Object.defineProperty(constructorsClass, propertyName, descriptor);
    });
}
exports.default = loggable;
//# sourceMappingURL=loggable.js.map