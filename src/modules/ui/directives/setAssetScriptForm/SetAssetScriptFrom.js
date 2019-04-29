(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const { signature } = require('data-service');
    const $ = require('jquery');

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {BalanceWatcher} balanceWatcher
     */
    const controller = function (Base, waves, $scope, user, balanceWatcher, utils) {

        const analytics = require('@waves/event-sender');

        class SetAssetScriptFrom extends Base {

            /**
             * @return {boolean}
             */
            get isAllOk() {
                return this.isValidScript && !this.isPendingScrip;
            }

            /**
             * @type {SetAssetScriptFrom.IState}
             */
            state;
            /**
             * @type {Asset}
             */
            asset;
            /**
             * @type {string}
             */
            script = '';
            /**
             * @type {boolean}
             */
            isValidScript = true;
            /**
             * @type {boolean}
             */
            isPendingScrip = false;
            /**
             * @type {Money}
             */
            fee;
            /**
             * @type {boolean}
             */
            isVerified;
            /**
             * @type {boolean}
             */
            isGateway;
            /**
             * @type {boolean}
             */
            isSuspicious;
            /**
             * @type {boolean}
             */
            hasLabel;
            /**
             * @type {function(data: {signable: Signable}): void}
             */
            onSuccess;
            /**
             * @type {boolean}
             */
            hasFee = true;
            /**
             * @type {JQueryXHR | null}
             * @private
             */
            _activeXHR = null;


            constructor() {
                super();
                this.observe('state', this._onChangeState);
                this.observe('script', this._onChangeScript);
                this.observe('fee', this._currentHasFee);
                this.receive(balanceWatcher.change, this._currentHasFee, this);
                this._currentHasFee();
            }

            onClickSign() {
                analytics.send({ name: 'Update Script Continue Click', target: 'ui' });
                const tx = this._getTx();
                const signable = signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });
                return signable;
            }

            /**
             * @return
             * @private
             */
            _onChangeScript() {
                const script = this.script.replace('base64:', '');

                if (this._activeXHR) {
                    this._activeXHR.abort();
                    this._activeXHR = null;
                }

                if (!script) {
                    this.isValidScript = true;
                    this.isPendingScrip = false;
                    return null;
                }

                this._activeXHR = $.ajax({
                    url: `${user.getSetting('network.node')}/utils/script/estimate`,
                    method: 'POST',
                    data: script
                });

                this._activeXHR
                    .then(() => {
                        this.isValidScript = true;
                    })
                    .catch(() => {
                        this.isValidScript = false;
                    })
                    .always(() => {
                        this.isPendingScrip = false;
                        $scope.$apply();
                    });
            }

            /**
             * @private
             */
            _onChangeState() {
                if (!this.state || !this.state.assetId) {
                    throw new Error('Has no assetId!');
                }
                this.script = this.state.script || '';
                waves.node.assets.getAsset(this.state.assetId).then(asset => {
                    if (!asset.hasScript) {
                        throw new Error('This asset has no script!');
                    }
                    const {
                        isVerified,
                        isGateway,
                        isTokenomica,
                        isSuspicious,
                        hasLabel
                    } = utils.getDataFromOracles(asset.id);
                    this.isVerified = isVerified;
                    this.isGateway = isGateway;
                    this.isTokenomica = isTokenomica;
                    this.isSuspicious = isSuspicious;
                    this.hasLabel = hasLabel;
                    this.asset = asset;
                    $scope.$apply();
                });
                waves.node.getFee(this._getTx()).then(fee => {
                    this.fee = fee;
                    $scope.$apply();
                });
            }

            /**
             * @return {{assetId: string, type: SIGN_TYPE.SET_ASSET_SCRIPT, script: string}}
             * @private
             */
            _getTx() {
                const script = this.script.replace('base64:', '');
                return {
                    type: SIGN_TYPE.SET_ASSET_SCRIPT,
                    assetId: this.state.assetId,
                    script: this.isAllOk && this.script ? `base64:${script}` : 'base64:AQa3b8tH',
                    fee: this.fee || null
                };
            }

            /**
             * @private
             */
            _currentHasFee() {
                const waves = balanceWatcher.getBalance().WAVES;

                if (!this.fee) {
                    return null;
                }

                this.hasFee = waves ? waves.gte(this.fee) : false;
            }

        }

        return new SetAssetScriptFrom();
    };

    controller.$inject = ['Base', 'waves', '$scope', 'user', 'balanceWatcher', 'utils'];

    angular.module('app.ui').component('wSetAssetScriptFrom', {
        bindings: {
            state: '<',
            onSuccess: '&'
        },
        templateUrl: 'modules/ui/directives/setAssetScriptForm/setAssetScriptFrom.html',
        transclude: false,
        controller
    });
})();

/**
 * @name SetAssetScriptFrom
 */

/**
 * @typedef {object} SetAssetScriptFrom#IState
 * @property {string} assetId
 * @property {string} script
 */
