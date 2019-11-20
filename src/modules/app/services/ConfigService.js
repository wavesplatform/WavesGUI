(function () {
    'use strict';

    const { utils } = require('data-service');
    const BaseConfigService = utils.ConfigService;


    const factory = function (Base, createPoll) {

        class ConfigService extends Base {

            change;
            /**
             * @type Promise<IConfig>
             */
            configReady;
            /**
             * @type Promise<void>
             */
            configReadyPromise;

            service = new BaseConfigService(WavesApp);


            constructor() {
                super();
                this.change = this.service.change;
                this.configReadyPromise = this.service.configReady;
                this.configReady = createPoll(this, () => this.service.fetchConfig(), () => null, 30000);
            }

            /**
             * @param {string} path
             */
            get(path) {
                return this.service.getConfig(path);
            }

            /**
             * @return {ConfigService.IFeeConfig}
             */
            getFeeConfig() {
                return this.service.getFeeConfig();
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
