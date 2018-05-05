(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {app.utils.decorators} decorators
     * @return {InputContainer}
     */
    const controller = function (Base, $element, $scope, createPoll, utils, decorators) {

        const tsUtisl = require('ts-utils');

        class InputContainer extends Base {

            constructor() {
                super();
                /**
                 * @type {form.FormController}
                 */
                this.form = null;
                /**
                 * @type {Signal<Array<HTMLInputElement|HTMLTextAreaElement>>}
                 */
                this.tik = new tsUtisl.Signal();
            }

            $postLink() {
                const name = $element.closest('form').attr('name');
                this.form = name && $scope.$parent.$eval(name);

                if (!this.form) {
                    throw new Error('Can\'t get form!');
                }

                this.receive(utils.observe(this.form, '$valid'), this._runApply, this);

                createPoll(this, () => null, () => {
                    this.tik.dispatch(this._getElements());
                }, 250);
            }

            /**
             * @return {Array<HTMLInputElement|HTMLTextAreaElement>}
             * @private
             */
            _getElements() {
                return $element.find('input,textarea').toArray();
            }

            /**
             * @private
             */
            @decorators.async()
            _runApply() {
                $scope.$apply();
            }

        }

        return new InputContainer();
    };

    controller.$inject = ['Base', '$element', '$scope', 'createPoll', 'utils', 'decorators'];

    angular.module('app.ui')
        .component('wInputContainer', {
            transclude: true,
            template: '<ng-transclude></ng-transclude>',
            controller
        });
})();
