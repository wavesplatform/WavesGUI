(function () {
    'use strict';

    const controller = function (Base, $element, ComponentList, $scope) {

        class StepByStep extends Base {

            constructor() {
                super();
                /**
                 * @type {ComponentList}
                 */
                this._steps = new ComponentList();
                this.activeStep = null;
                this.observe('activeStep', this._onChangeStep);

                $element.on('click', '[w-step-next]', () => {
                    this._setStep(this._getStepIndex() + 1);
                    $scope.$apply();
                });

                $element.on('click', '[w-step-prev]', () => {
                    this._setStep(this._getStepIndex() - 1);
                    $scope.$apply();
                });
            }

            /**
             * @param {Step} step
             */
            registerStep(step) {
                const id = step.id || this._steps.length;
                step.id = id;
                this._steps.push(step);
                if (this.activeStep == null) {
                    this.activeStep = step.id;
                }
                this._onChangeStep();
            }

            /**
             * @private
             */
            _onChangeStep() {
                this._steps.forEach((step) => {
                    step.displayToggle(this.activeStep === step.id);
                });
            }

            /**
             * @return {*}
             * @private
             */
            _getStepIndex() {
                return this._steps.index(this.activeStep, 'id');
            }

            /**
             * @param index
             * @private
             */
            _setStep(index) {
                if (this._steps.components[index]) {
                    this.activeStep = this._steps.components[index].id;
                }
            }

        }

        return new StepByStep();
    };

    controller.$inject = ['Base', '$element', 'ComponentList', '$scope'];

    angular.module('app.ui').component('wStepByStep', {
        bindings: {
            activeStep: '='
        },
        template: '<div class="step-list" ng-transclude></div>',
        transclude: true,
        controller
    });
})();
