(function () {
    'use strict';

    const MIN_ALIAS_LENGTH = 4;
    const MAX_ALIAS_LENGTH = 30;
    const ALIAS_PATTERN = /^[a-z0-9-@_.]*$/;

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {Waves} waves
     * @param {INotification} notification
     * @param {createPoll} createPoll
     * @return {AccountInfoCtrl}
     */
    const controller = function (Base, $scope, user, waves, notification, createPoll) {

        class AccountInfoCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {string}
                 */
                this.address = user.address;
                /**
                 * @type {number}
                 */
                this.createAliasStep = 0;
                /**
                 * @type {Array<string>}
                 */
                this.aliases = null;
                /**
                 * @type {string}
                 */
                this.newAlias = '';
                /**
                 * @type {Money}
                 */
                this.fee = null;
                /**
                 * @type {boolean}
                 */
                this.noMoneyForFee = true;
                /**
                 * @type {boolean}
                 */
                this.invalid = false;
                /**
                 * @type {boolean}
                 */
                this.invalidMinLength = false;
                /**
                 * @type {boolean}
                 */
                this.invalidMaxLength = false;
                /**
                 * @type {boolean}
                 */
                this.invalidPattern = false;
                /**
                 * @type {string}
                 */
                this.transactionId = '';
                /**
                 * @type {boolean}
                 */
                this.signLoader = false;
                /**
                 * @type {boolean}
                 */
                this.signDeviceFail = false;
                /**
                 * @type {boolean}
                 */
                this.invalidExist = false;
                /**
                 * @type {Money}
                 * @private
                 */
                this._balance = null;

                const poll = createPoll(this, this._getBalance, '_balance', 5000, { isBalance: true, $scope });
                const feePromise = waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.CREATE_ALIAS });

                Promise.all([feePromise, poll.ready])
                    .then(([fee]) => {
                        this.fee = fee;
                        this.observe(['_balance', 'fee'], this._onChangeBalance);
                        this._onChangeBalance();
                        $scope.$digest();
                    });

                this.aliases = waves.node.aliases.getAliasList();
                this.observe(['newAlias'], this._validateNewAlias);
            }

            getSignableTx() {
                const type = 10;
                const timestamp = ds.utils.normalizeTime(Date.now());
                const data = { alias: this.newAlias, fee: this.fee, timestamp };
                return ds.signature.getSignatureApi()
                    .makeSignable({ type, data });
            }

            createAlias() {
                const signable = this.getSignableTx();
                return signable.getId()
                    .then(
                        (id) => {
                            this.signDeviceFail = false;
                            this.transactionId = id;
                            this.signLoader = user.userType && user.userType !== 'seed';
                            $scope.$digest();
                        })
                    .then(() => signable.getDataForApi())
                    .then(
                        (preparedTx) => {
                            this.signLoader = false;
                            return ds.broadcast(preparedTx).then(() => {
                                analytics.push('User', `User.CreateAlias.Success.${WavesApp.type}`);
                                this.aliases.push(this.newAlias);
                                this.newAlias = '';
                                this.createAliasStep = 0;
                                notification.info({
                                    ns: 'app.utils',
                                    title: { literal: 'modal.account.notifications.aliasCreated' }
                                });
                                $scope.$digest();
                            });
                        },
                        () => {
                            this.signDeviceFail = true;
                            this.signLoader = false;
                            $scope.$digest();
                        });
            }

            onCopyAddress() {
                analytics.push('User', `User.CopyAddress.${WavesApp.type}`);
            }

            onCopyAlias() {
                analytics.push('User', `User.CopyAlias.${WavesApp.type}`);
            }

            reset() {
                this.newAlias = '';
            }

            /**
             * @private
             */
            _onChangeBalance() {
                this.noMoneyForFee = (!this.fee || !this._balance) ||
                    this._balance.available.getTokens().lt(this.fee.getTokens());
                this.invalid = this.invalid || this.noMoneyForFee;
                $scope.$digest();
            }

            /**
             * @return {Promise<Money>}
             * @private
             */
            _getBalance() {
                return waves.node.assets.balance(WavesApp.defaultAssets.WAVES);
            }

            /**
             * @return {Promise<Money>}
             * @private
             */
            async _validateNewAlias() {
                this.invalidMinLength = this.newAlias && this.newAlias.length < MIN_ALIAS_LENGTH;
                this.invalidMaxLength = this.newAlias && this.newAlias.length > MAX_ALIAS_LENGTH;
                this.invalidPattern = this.newAlias && !ALIAS_PATTERN.test(this.newAlias);
                const invalid = this.noMoneyForFee || this.invalidMinLength ||
                this.invalidMaxLength || this.invalidPattern;

                if (this.newAlias && !invalid) {
                    this.pendingAlias = true;
                    this.invalid = true;
                    try {
                        await ds.api.aliases.getAddressByAlias(this.newAlias);
                        this.invalidExist = true;
                    } catch (e) {
                        this.invalidExist = false;
                    }

                    this.pendingAlias = false;
                    this.invalid = invalid || this.invalidExist;
                    $scope.$digest();
                } else {
                    this.invalidExist = false;
                    this.invalid = invalid;
                }
            }

        }

        return new AccountInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves', 'notification', 'createPoll'];

    angular.module('app.utils')
        .controller('AccountInfoCtrl', controller);
})();
