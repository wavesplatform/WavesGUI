(function () {
    'use strict';

    const factory = function (Validator) {

        class CompareTo extends Validator {

            constructor(data) {
                super(data);

                const $compare = this.$input.closest('form').find(`input[name="${this.$attrs.wCompareTo}"]`);
                if (!$compare.length) {
                    throw new Error('Element for compare not found!');
                }

                $compare.on('input', () => {
                    this.validate();
                });

                this.registerValidator('w-compare-to', (value) => {
                    return value === $compare.val();
                });
            }

        }

        return CompareTo;
    };

    factory.$inject = ['Validator', 'utils'];

    angular.module('app.utils').factory('CompareTo', factory);
})();
