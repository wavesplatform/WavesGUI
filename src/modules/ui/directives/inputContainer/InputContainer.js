(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @return {InputContainer}
     */
    const controller = function ($element, $scope) {

        const tsUtisl = require('ts-utils');

        class InputContainer {

            constructor() {
                /**
                 * @type {form.FormController}
                 */
                this.form = null;
                /**
                 * @type {Signal<InputContainer.ISignalData>}
                 */
                this.userAction = new tsUtisl.Signal();
                /**
                 * @type {JQuery.Deferred}
                 */
                this._ready = $.Deferred();
            }

            /**
             * @return {JQuery.Promise<any, any, any>}
             */
            onReady() {
                return this._ready.promise();
            }

            $postLink() {
                const name = $element.closest('form').attr('name');
                this.form = name && $scope.$parent.$eval(name);

                if (!this.form) {
                    throw new Error('Can\'t get form!');
                }

                $element.on('input blur focus', 'input,textarea', (event) => {
                    this.userAction.dispatch({
                        element: event.target,
                        eventName: event.type
                    });
                    requestAnimationFrame(() => {
                        angular.element($element.closest('form').get(0)).scope().$digest();
                    });
                });

                this._ready.resolve();
            }

            /**
             * @param {string} name
             * @return {HTMLInputElement|HTMLTextAreaElement}
             */
            getElementByName(name) {
                return $element.find(`input[name="${name}"],textarea[name="${name}"]`).get(0);
            }

        }

        return new InputContainer();
    };

    controller.$inject = ['$element', '$scope'];

    angular.module('app.ui')
        .component('wInputContainer', {
            transclude: true,
            template: '<ng-transclude></ng-transclude>',
            controller
        });
})();

/**
 * @name InputContainer
 */

/**
 * @typedef {object} InputContainer#ISignalData
 * @property {HTMLInputElement|HTMLTextAreaElement} element
 * @property {string} eventName
 */
