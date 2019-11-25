(function () {
    'use strict';

    /**
     * @param {ng.IScope} $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param {app.utils.Storage} storage
     * @return {WelcomeCtrl}
     */
    const controller = function (
        $scope,
        user,
        utils,
        storage
    ) {

        const { uniqBy } = require('ramda');

        class WelcomeCtrl {

            /**
             * @type {boolean}
             */
            hasMultiAccount = false;

            constructor() {

                user.getMultiAccountData().then(data => {
                    this.hasMultiAccount = !!data;

                    if (!this.hasMultiAccount && WavesApp.isWeb()) {
                        storage.load('accountImportComplete').then(complete => {
                            if (!complete) {
                                this._loadUserListFromOldOrigin();
                            }
                        });
                    }
                });
            }

            /**
             * @private
             */
            _loadUserListFromOldOrigin() {
                const OLD_ORIGIN = 'https://client.wavesplatform.com';

                this.pendingRestore = true;

                utils.importAccountByIframe(OLD_ORIGIN, 5000)
                    .then((userList) => {
                        user.getFilteredUserList()
                            .then((list) => {
                                this.pendingRestore = false;
                                const newUserList = uniqBy(user => user.name, userList.concat(list) || list);

                                storage.save('accountImportComplete', true);
                                storage.save('userList', newUserList);
                                utils.postDigest($scope).then(() => {
                                    $scope.$apply();
                                });
                            });
                    })
                    .catch(() => {
                        this.pendingRestore = false;
                        storage.save('accountImportComplete', true);
                    });
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = [
        '$scope',
        'user',
        'utils',
        'storage'
    ];

    angular.module('app.welcome')
        .controller('WelcomeCtrl', controller);
})();
