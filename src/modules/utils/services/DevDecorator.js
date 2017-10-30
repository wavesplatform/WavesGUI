// (function () {
//     'use strict';
//
//
//     /**
//      * @param {app.utils} utils
//      */
//     const factory = function (utils) {
//
//         class DevDecorator {
//
//             constructor() {
//                 window.devDecorators = this;
//                 this._cache = Object.create(null);
//                 this._cache.median = Object.create(null);
//             }
//
//             time(target, key, descriptor) {
//                 const origin = descriptor.value;
//                 descriptor.value = function (...args) {
//                     console.time(`${target.constructor.name}.${key}`);
//                     const result = origin.call(this, ...args);
//                     console.timeEnd(`${target.constructor.name}.${key}`);
//                     return result;
//                 };
//             }
//
//             median(target, key, descriptor) {
//                 const cache = this._cache.median;
//                 if (!cache[target.constructor.name]) {
//                     cache[target.constructor.name] = Object.create(null);
//                 }
//                 if (!cache[target.constructor.name][key]) {
//                     cache[target.constructor.name][key] = [];
//                 }
//                 const origin = descriptor.value;
//                 descriptor.value = function (...args) {
//                     const time = Date.now();
//                     const result = origin.call(this, ...args);
//                     cache[target.constructor.name][key].push(Date.now() - time);
//                     return result;
//                 };
//             }
//
//             logMedian() {
//                 const cache = this._cache.median;
//                 Object.keys(cache).forEach((className) => {
//                     Object.keys(cache[className]).forEach((method) => {
//                         cache[className][method].sort((a, b) => a - b);
//                         const index = Math.round(cache[className][method].length / 2);
//                         console.log(`${className}.${method}: ${cache[className][method][index]}`);
//                     });
//                 });
//             }
//
//         }
//
//         const item = new DevDecorator();
//         return utils.bind(item);
//     };
//
//     angular.module('app.utils')
//         .factory('devDecorators', factory);
// })();
