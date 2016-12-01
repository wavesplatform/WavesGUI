(function () {
    'use strict';

    var ASSET_DESCRIPTION_MAX = 1000;
    var ASSET_NAME_MIN = 4;
    var ASSET_NAME_MAX = 16;
    var TOKEN_DECIMALS_MAX = 8;
    var FIXED_ISSUE_FEE = new Money(1, Currency.WAV);

    function TokenCreateController($scope, $interval, constants, applicationContext, assetService, dialogService,
                                   apiService, notificationService, formattingService) {
        var refreshPromise;
        var refreshDelay = 15 * 1000;
        var transaction;
        var ctrl = this;

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        ctrl.wavesBalance = new Money(0, Currency.WAV);
        ctrl.issuanceValidationOptions = {
            rules: {
                assetName: {
                    required: true,
                    minbytelength: ASSET_NAME_MIN,
                    maxbytelength: ASSET_NAME_MAX
                },
                assetDescription: {
                    maxbytelength: ASSET_DESCRIPTION_MAX
                },
                assetTotalTokens: {
                    required: true,
                    min: 0,
                    max: constants.JAVA_MAX_LONG
                },
                assetTokenDecimalPlaces: {
                    required: true,
                    min: 0,
                    max: TOKEN_DECIMALS_MAX
                }
            },
            messages: {
                assetName: {
                    required: 'Asset name is required',
                    minbytelength: 'Asset name is too short. Please give your asset a longer name',
                    maxbytelength: 'Asset name is too long. Please give your asset a shorter name'
                },
                assetDescription: {
                    maxbytelength: 'Maximum length of asset description exceeded. Please make a shorter description'
                },
                assetTotalTokens: {
                    required: 'Total amount of issued tokens in required',
                    min: 'Total issued tokens amount must be greater than or equal to zero',
                    max: 'Total issued tokens amount must be less than ' + constants.JAVA_MAX_LONG
                },
                assetTokenDecimalPlaces: {
                    required: 'Number of token decimal places is required',
                    min: 'Number of token decimal places must be greater or equal to zero',
                    max: 'Number of token decimal places must be less than or equal to ' + TOKEN_DECIMALS_MAX
                }
            }
        };
        ctrl.asset = {
            fee: FIXED_ISSUE_FEE
        };
        ctrl.confirm = {
            pendingIssuance: false
        };
        ctrl.broadcastIssueTransaction = broadcastIssueTransaction;
        ctrl.assetIssueConfirmation = assetIssueConfirmation;

        loadDataFromBackend();
        resetIssueAssetForm();

        function assetIssueConfirmation(form, event) {
            event.preventDefault();

            if (!form.validate())
                return;

            if (ctrl.asset.fee.greaterThan(ctrl.wavesBalance)) {
                notificationService.error('Not enough funds for the issue transaction fee');

                return;
            }

            var asset = {
                name: ctrl.asset.name,
                description: ctrl.asset.description,
                totalTokens: ctrl.asset.totalTokens,
                decimalPlaces: Number(ctrl.asset.decimalPlaces),
                reissuable: ctrl.asset.reissuable,
                fee: ctrl.asset.fee
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            ctrl.confirm.name = ctrl.asset.name;
            ctrl.confirm.totalTokens = ctrl.asset.totalTokens;
            ctrl.confirm.reissuable = ctrl.asset.reissuable ? 'reissuable' : 'non-reissuable';

            transaction = assetService.createAssetIssueTransaction(asset, sender);

            dialogService.open('#create-asset-confirmation');
        }

        function broadcastIssueTransaction() {
            if (angular.isUndefined(transaction))
                return;

            // disable method while there is a pending issuance request
            if (ctrl.confirm.pendingIssuance)
                return;

            // disable confirm button
            ctrl.confirm.pendingIssuance = true;
            apiService.assets.issue(transaction).then(function (response) {
                var displayMessage = 'Asset ' + ctrl.confirm.name + ' has been issued!<br/>' +
                    'Total tokens amount: ' + ctrl.confirm.totalTokens + '<br/>' +
                    'Date: ' + formattingService.formatTimestamp(transaction.timestamp);
                notificationService.notice(displayMessage);

                applicationContext.cache.assets.put(response);

                transaction = undefined;
                ctrl.confirm.pendingIssuance = false;
                resetIssueAssetForm();
            }, function (response) {
                if (angular.isDefined(response.data))
                    notificationService.error('Error:' + response.data.error + ' - ' + response.data.message);
                else
                    notificationService.error('Request failed. Status: ' + response.status + ' - ' +
                        response.statusText);

                transaction = undefined;
                ctrl.confirm.pendingIssuance = false;
            });
        }

        function resetIssueAssetForm() {
            ctrl.asset.name = '';
            ctrl.asset.description = '';
            ctrl.asset.totalTokens = '0';
            ctrl.asset.decimalPlaces = '0';
            ctrl.asset.reissuable = false;
        }

        function loadDataFromBackend() {
            refreshBalance();

            refreshPromise = $interval(function() {
                refreshBalance();
            }, refreshDelay);
        }

        function refreshBalance() {
            apiService.address.balance(applicationContext.account.address)
                .then(function (response) {
                    ctrl.wavesBalance = Money.fromCoins(response.balance, Currency.WAV);
                });
        }
    }

    TokenCreateController.$inject = ['$scope', '$interval', 'constants.ui', 'applicationContext', 'assetService',
        'dialogService', 'apiService', 'notificationService', 'formattingService'];

    angular
        .module('app.tokens')
        .controller('tokenCreateController', TokenCreateController);
})();
