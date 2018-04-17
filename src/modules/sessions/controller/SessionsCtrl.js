(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {SessionBridge} sessionBridge
     * @return {SessionsCtrl}
     */
    const controller = function (Base, $scope, sessionBridge) {

        class SessionsCtrl extends Base {

            constructor() {
                super($scope);
                this.sessions = sessionBridge.getSessionsData();
                this.receive(sessionBridge.signals.changeSessions, (sessions) => {
                    this.sessions = sessions;
                    $scope.$digest();
                });
            }

            /**
             * @param {ISessionUserData} session
             */
            chooseSession(session) {
                sessionBridge.login(session.id);
            }

        }

        return new SessionsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'sessionBridge'];

    angular.module('app.sessions').controller('SessionsCtrl', controller);
})();
