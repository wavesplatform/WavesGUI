(function () {
    'use strict';

    var ASSET_DESCRIPTION_MAX = 1000;
    var ASSET_NAME_MIN = 4;
    var ASSET_NAME_MAX = 16;
    var TOKEN_DECIMALS_MAX = 8;

    angular
        .module('app.tokens')
        .controller('tokenCreateController', ['$scope', 'constants.ui', 'dialogService', function ($scope, constants, dialogService) {
            var transaction;
            var ctrl = this;

            ctrl.issuanceValidationOptions = {
                rules: {
                    assetName: {
                        required: true,
                        minlength: ASSET_NAME_MIN,
                        maxlength: ASSET_NAME_MAX
                    },
                    assetDescription: {
                        maxlength: ASSET_DESCRIPTION_MAX
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
                        minlength: 'Asset name minimum length must be ' + ASSET_NAME_MIN + ' characters',
                        maxlength: 'Asset name maximum length must be ' + ASSET_NAME_MAX + ' characters'
                    },
                    assetDescription: {
                        maxlength: 'Maximum length of asset description must be less than ' + ASSET_DESCRIPTION_MAX +
                            ' characters'
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
            ctrl.confirm = {
                pendingIssuance: false
            };
            ctrl.broadcastIssueTransaction = broadcastIssueTransaction;
            ctrl.assetIssueConfirmation = assetIssueConfirmation;

            function assetIssueConfirmation(form) {
                if (!form.validate())
                    return;

                //to the stuff
                dialogService.open('#create-asset-confirmation');
            }

            function broadcastIssueTransaction() {
                console.log('broadcast');
            }
        }]);
})();
