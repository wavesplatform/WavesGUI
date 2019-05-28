(function () {
    'use strict';


    const { fetch } = require('data-service');
    const { Signal, getPaths, get, clone } = require('ts-utils');
    const { BigNumber } = require('@waves/data-entities');


    const factory = function (Base, createPoll) {

        class ConfigService extends Base {

            /**
             * @type {ConfigService.IConfig}
             * @private
             */
            _config = Object.create(null);
            /**
             * @type {ConfigService.IFeeConfig}
             * @private
             */
            _feeConfig = Object.create(null);
            /**
             * @type {Signal<string>}
             */
            change = new Signal();
            /**
             * @type Promise<IConfig>
             */
            configReady;


            constructor() {
                super();
                this.configReady = createPoll(this, this._getConfig, this._setConfig, 30000);
                createPoll(this, this._getFeeConfig, this._setFeeConfig, 30000);
            }

            /**
             * @param {string} path
             */
            get(path) {
                return clone(get(this._config, path));
            }

            /**
             * @return {ConfigService.IFeeConfig}
             */
            getFeeConfig() {
                return clone(this._feeConfig);
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
             * @return {Promise<ConfigService.IFeeConfig>}
             * @private
             */
            _getFeeConfig() {
                return fetch(WavesApp.network.feeConfigUrl)
                    .then(WavesApp.parseJSON)
                    .then(ConfigService._parseFeeConfig);
            }

            /**
             * @param {ConfigService.IFeeConfig} config
             * @private
             */
            _setFeeConfig(config) {
                this._feeConfig = config;
            }

            /**
             * @param {ConfigService.IConfig} config
             * @private
             */
            _setConfig(config) {
                const myConfig = this._config;
                this._config = config;

                ConfigService._getDifferencePaths(myConfig, config)
                    .forEach(path => this.change.dispatch(String(path)));
            }

            /**
             * @param {object} previous
             * @param {object} next
             * @return {string[]}
             * @private
             */
            static _getDifferencePaths(previous, next) {
                const paths = getPaths(next);
                return paths
                    .filter(path => get(previous, path) !== get(next, path))
                    .map(String);
            }

            /**
             * @param data
             * @return {*}
             * @private
             */
            static _parseFeeConfig(data) {
                switch (typeof data) {
                    case 'number':
                    case 'string':
                        return new BigNumber(data);
                    case 'object':
                        Object.entries(data).forEach(([key, value]) => {
                            data[key] = ConfigService._parseFeeConfig(value);
                        });
                        return data;
                    default:
                        return data;
                }
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
 * @property {boolean} SERVICE_TEMPORARILY_UNAVAILABLE
 * @property {object} SETTINGS.DEX
 * @property {Array<string>} SETTINGS.DEX.WATCH_LIST_PAIRS
 */

/**
 * @typedef {object} ConfigService#IFeeConfig
 * @property {BigNumber} smart_asset_extra_fee
 * @property {BigNumber} smart_account_extra_fee
 * @property {Record<number, Partial<ConfigService.IFeeItem>> & {default: ConfigService.IFeeItem}} calculate_fee_rules
 */

/**
 * @typedef {object} ConfigService#IFeeItem
 * @property {boolean} add_smart_asset_fee
 * @property {boolean} add_smart_account_fee
 * @property {BigNumber} min_price_step
 * @property {BigNumber} fee
 */
