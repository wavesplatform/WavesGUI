/* eslint-disable max-len */
(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {StandCtrl}
     */
    const controller = function (Base, $scope, userNotification, notification) {

        class StandCtrl extends Base {

            constructor() {

                super($scope);

                const seed = 'merry evil keep lost fox tech absent trololo both field get input div cosmic';
                /**
                 * @type {string}
                 */
                this.tab = 'info';
                this.qrData = 'Keep on waving, we`ll take care of the bad guys';
                this.info = this.dataCopy = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                /**
                 * @type {boolean}
                 */
                this.invalid = true;
                this.warning = true;
                this.success = true;
                this.error = true;
                this.active = true;
                this.inactive = true;
                this.seedConfirmWasFilled = false;
                this.seedIsValid = false;
                /**
                 * @type {string}
                 */
                this.seed = seed;

                const loop = (index) => {
                    userNotification.info({
                        body: {
                            literal: index + 1
                        }
                    }).then(() => loop(index + 1));
                };

                loop(0);

                const loop2 = (index) => {
                    userNotification.error({
                        body: {
                            literal: index + 1
                        }
                    }).then(() => loop2(index + 1));
                };

                loop2(0);

                const loop3 = (index) => {
                    userNotification.success({
                        body: {
                            literal: index + 1
                        }
                    }).then(() => loop3(index + 1));
                };

                loop3(0);

                const loop4 = (index) => {
                    userNotification.warn({
                        body: {
                            literal: index + 1
                        }
                    }).then(() => loop4(index + 1));
                };

                loop4(0);

                const loop0 = (index) => {
                    notification.info({
                        title: {
                            literal: 'Title info'
                        },
                        body: {
                            literal: 'Text body info'
                        }
                    }).then(() => loop0(index + 1));
                };

                loop0(0);


                const loop5 = (index) => {
                    notification.error({
                        title: {
                            literal: 'Title error'
                        },
                        body: {
                            literal: 'Text body error'
                        }
                    }).then(() => loop5(index + 1));
                };

                loop5(0);


            }

        }

        return new StandCtrl();
    };

    controller.$inject = ['Base', '$scope', 'userNotification', 'notification'];

    angular.module('app.stand').controller('StandCtrl', controller);
})();
