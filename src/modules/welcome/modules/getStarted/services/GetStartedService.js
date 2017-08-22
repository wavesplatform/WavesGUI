(function () {
    'use strict';

    /**
     * @param $q
     * @param {AddressGenerator} addressGenerator
     * @return {GetStartedService}
     */
    const factory = function ($q, addressGenerator) {

        const PATH = 'modules/welcome/modules/getStarted/templates';
        const STEP_LIST = [
            {
                name: 'id',
                url: `${PATH}/createId.html`
            },
            {
                name: 'password',
                url: `${PATH}/createPassword.html`,
            },
            {
                name: 'backupEnter',
                url: `${PATH}/backupEnter.html`
            },
            {
                name: 'backupWarning',
                url: `${PATH}/backupWarning.html`
            },
            {
                name: 'backupSeed',
                url: `${PATH}/backupSeed.html`
            },
            {
                name: 'backupSeedRepeat',
                url: `${PATH}/backupSeedRepeat.html`
            },
            {
                name: 'backupSeedDone',
                url: `${PATH}/backupSeedDone.html`
            },
            {
                name: 'end',
                url: `${PATH}/end.html`
            }
        ];

        class GetStartedService {

            constructor() {
                this.generator = addressGenerator;
                this.stepList = STEP_LIST;
            }

        }

        return new GetStartedService();
    };

    factory.$inject = ['$q', 'AddressGenerator'];

    angular.module('app.welcome.getStarted').factory('GetStartedService', factory);
})();
