(function () {
    'use strict';


    const { fetch } = require('data-service');
    const { Signal, getPaths, get, clone } = require('ts-utils');


    const factory = function (Base, createPoll) {

        class ConfigService extends Base {

            /**
             * @type {Poll}
             * @private
             */
            _poll;
            /**
             * @type {ConfigService.IConfig}
             * @private
             */
            _config = Object.create(null);
            /**
             * @type {Signal<string>}
             */
            change = new Signal();


            constructor() {
                super();

                this._poll = createPoll(this, this._getConfig, this._setConfig, 30000);
            }

            /**
             * @param {string} path
             */
            get(path) {
                return clone(get(this._config, path));
            }

            /**
             * @return {Promise<ConfigService.IConfig>}
             * @private
             */
            _getConfig() {
                return fetch(WavesApp.network.featuresConfigUrl)
                    .then(JSON.parse);
            }

            /**
             * @param {ConfigService.IConfig} config
             * @private
             */
            _setConfig(config) {
                const paths = getPaths(config);
                const dispatchList = paths.filter(path => {
                    return get(this._config, path) !== get(config, path);
                });

                if (dispatchList.length) {
                    dispatchList.forEach(path => {
                        this.change.dispatch(String(path));
                    });
                }

                this._config = config;
            }

        }

        return new ConfigService();
    };

    factory.$inject = ['Base', 'createPoll'];

    angular.module('app').factory('configService', factory);
})();

/**
 * @name ConfigService
 */

/**
 * @typedef {object} ConfigService#IConfig
 * @property {object} PERMISSIONS
 * @property {object} SETTINGS
 * @property {object} SETTINGS.DEX
 * @property {Array<string>} SETTINGS.DEX.WATCH_LIST_PAIRS
 */
