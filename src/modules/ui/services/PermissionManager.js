(function () {
    'use strict';

    /**
     * @param {ConfigService} configService
     * @return {PermissionManager}
     */
    const factory = function (configService) {

        const { Signal } = require('ts-utils');


        /**
         * @class
         */
        class PermissionManager {

            change = new Signal();
            _permissions = Object.create(null);


            constructor() {
                this._permissions = configService.get('PERMISSIONS') || Object.create(null);
                configService.change.on(this._onChangeConfig, this);
            }

            /**
             * @param name
             * @return {boolean}
             */
            isPermitted(name) {
                const permission = this._permissions[name];
                return permission == null || permission; // Fallback for the case when config is failed to download
            }

            /**
             * @param {string} path
             * @private
             */
            _onChangeConfig(path) {
                if (!path.includes('PERMISSIONS')) {
                    return null;
                }
                const permissions = configService.get('PERMISSIONS') || Object.create(null);
                this._permissions = PermissionManager._parsePermissions(permissions);
                this.change.dispatch();
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

    factory.$inject = ['configService'];

    angular.module('app.ui').factory('permissionManager', factory);
})();
