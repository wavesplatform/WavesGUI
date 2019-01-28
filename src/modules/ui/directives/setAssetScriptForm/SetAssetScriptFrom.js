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
     */
    const controller = function (Base, waves, $scope, user) {

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
             * @type {function(data: {signable: Signable}): void}
             */
            onSuccess;
            /**
             * @type {JQueryXHR | null}
             * @private
             */
            _activeXHR = null;


            constructor() {
                super();
                this.observe('state', this._onChangeState);
                this.observe('script', this._onChangeScript);
            }

            onClickNext() {
                const tx = this._getTx();
                const signable = signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });
                this.onSuccess({ signable });
            }

            _onChangeScript() {
                const script = this.script;

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

                this._scriptValidationXHR
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
                return {
                    type: SIGN_TYPE.SET_ASSET_SCRIPT,
                    assetId: this.state.assetId,
                    script: this.isAllOk ? this.script : 'AQa3b8tH'
                };
            }

        }

        return new SetAssetScriptFrom();
    };

    controller.$inject = ['Base', 'waves', '$scope', 'user'];

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
