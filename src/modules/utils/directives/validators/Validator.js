(function () {
    'use strict';

    const factory = function (Base, utils) {

        class Validator extends Base {

            constructor({ $scope, $input, $attrs, $ngModel }) {
                super($scope);

                this.$scope = $scope;
                this.$input = $input;
                this.$attrs = $attrs;
                this.$ngModel = $ngModel;

                /**
                 * @type {Array}
                 * @private
                 */
                this._messages = [];
            }

            registerValidator(name, handler) {
                if (!tsUtils.find(this._messages, { name })) {
                    this._messages.push({ name, handler });
                } else {
                    throw new Error('Duplicate validator name!');
                }
            }

            onReady() {
                return utils.when();
            }

            validate() {
                this._messages.forEach((validator) => {
                    this.$ngModel.$setValidity(
                        validator.name,
                        validator.handler(this.$ngModel.$modelValue, this.$ngModel.$viewValue)
                    );
                });
            }

            getParser() {
                return null;
            }

            getFormatter() {
                return null;
            }

        }

        return Validator;
    };

    factory.$inject = ['Base', 'utils'];

    angular.module('app.utils').factory('Validator', factory);
})();
