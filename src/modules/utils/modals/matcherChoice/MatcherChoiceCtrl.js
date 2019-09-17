(function () {
    'use strict';

    const controller = function (Base, $scope, user, $mdDialog) {

        class MatcherChoiceCtrl extends Base {

            /**
             * @public
             * @type {boolean}
             */
            matcherTerms = false;
            /**
             * @public
             * @type {boolean}
             */
            wavesTerms = false;
            /**
             * @public
             * @type {boolean}
             */
            isCustomForm = false;
            /**
             * @type {any}
             */
            customMatcherForm = null;

            constructor() {
                super($scope);
                this.readTermsAndConditions = false;
                this.privacyPolicy = false;
            }

            confirm() {
                user.setSetting('network.matcher', this.matcherUrl);
                $mdDialog.hide();
            }

            onChangeMatcher(matcher) {
                if (matcher && !matcher.custom) {
                    this.matcherTermsText = matcher.terms;
                    this.matcherName = matcher.name;
                    this.matcherUrl = matcher.url;
                    this.isCustomForm = false;
                } else if (matcher.custom) {
                    this.matcherTermsText = null;
                    this.matcherName = null;
                    this.matcherUrl = null;
                    this.matcherTerms = true;
                    this.isCustomForm = true;
                }
            }

        }

        return new MatcherChoiceCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', '$mdDialog'];

    angular.module('app.utils').controller('MatcherChoiceCtrl', controller);
})();
