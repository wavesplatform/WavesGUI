(function () {
    'use strict';

    const PATTERNS = {
        en: 'DD/MM/YYYY',
        ru: 'DD.MM.YYYY'
    };

    const controller = function ($scope, $element) {

        class WDate {

            get date() {
                if (this._date instanceof Date) {
                    return this._date;
                } else if (typeof this._date === 'string') {
                    return new Date(Number(this._date));
                } else {
                    return new Date(this._date);
                }
            }

            constructor() {
                /**
                 * @type {string}
                 */
                this._date = null;
                this.filter = tsUtils.date(PATTERNS[i18next.language]);

                this.listener = () => {
                    this.filter = tsUtils.date(PATTERNS[i18next.language]);
                    this.$onChanges();
                };
                i18next.on('languageChanged', this.listener);

                $scope.$watch('_date', () => this.$onChanges());
            }

            $onChanges() {

                if ($scope._date == null) {
                    return $element.html('');
                }

                this._date = $scope._date;

                $element.text(this.filter(this.date));
            }

            $onDestroy() {
                i18next.off('languageChanged', this.listener);
            }

        }

        return new WDate();
    };

    controller.$inject = ['$scope', '$element'];

    angular.module('app').directive('wDate', () => {
        return {
            restrict: 'A',
            scope: {
                _date: '<wDate'
            },
            controller: controller
        };
    });
})();
