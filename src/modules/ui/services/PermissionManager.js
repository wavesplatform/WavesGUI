(function () {
    'use strict';

    /**
     * @param {Poll} Poll
     * @return {PermissionManager}
     */
    const factory = function (Poll) {

        const tsUtils = require('ts-utils');
        const ds = require('data-service');

        class PermissionManager {

            constructor() {
                this.change = new tsUtils.Signal();
                this._permissions = {};

                new Poll(this._getFeaturesConfig, this._applyPermissions.bind(this), 10000);
            }

            /**
             * @param name
             * @return {boolean}
             */
            isPermitted(name) {
                const permission = this._permissions[name];
                return permission == null || permission; // Fallback for the case when config is failed to download
            }

            _getFeaturesConfig() {
                return ds.fetch(WavesApp.network.featuresConfigUrl);
            }

            _applyPermissions(features) {
                try {
                    const permissions = JSON.parse(features).PERMISSIONS;
                    this._permissions = PermissionManager._parsePermissions(permissions);
                    this.change.dispatch();
                } catch (e) {
                    throw new Error('Cannot parse features config');
                }
            }

            static _parsePermissions(raw) {
                return Object.keys(raw).reduce((acc, key) => {
                    if (typeof raw[key] === 'boolean') {
                        acc[key] = raw[key];
                    } else if (raw[key] instanceof Array) {
                        raw[key].forEach((item) => {
                            acc[`${key}.${item}`] = true;
                        });
                    }

                    return acc;
                }, {});
            }

        }

        return new PermissionManager();
    };

    factory.$inject = ['Poll'];

    angular.module('app.ui').factory('permissionManager', factory);
})();
