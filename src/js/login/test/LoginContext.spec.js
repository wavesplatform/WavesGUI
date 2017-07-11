describe('LoginContext.Service', function () {

    /**
     * @type {LoginContext} loginContext
     */
    let loginContext;
    let accountList;

    angular.module('app.login')
        .factory('accountService', function () {
            return {
                getAccounts: function () {
                    return Promise.resolve(accountList);
                },
                removeAccountByIndex: function (index) {
                    accountList.splice(index, 1);
                    return Promise.resolve(accountList);
                },
                addAccount: function (account) {
                    accountList.push(account);
                }
            }
        });

    // Initialization of the module before each test case
    beforeEach(module('ui.router'));
    beforeEach(module('app.login'));

    // Injection of dependencies
    beforeEach(inject(function ($injector) {

        accountList = [
            {name: 'Vasia'},
            {name: 'Valera'}
        ];

        loginContext = $injector.get('loginContext');
    }));

    describe('check accountService integration', () => {

        it('getAccounts', function (done) {
            loginContext.getAccounts().then((list) => {
                expect(list).toEqual(accountList);
                done();
            });
        });

        it('removeAccountByIndex', (done) => {
            const start = accountList.length;
            loginContext.removeAccountByIndex(1).then((list) => {
                expect(list.length).toEqual(start - 1);
                done();
            });
        });

        it('addAccount', function () {
            const start = accountList.length;
            loginContext.addAccount({name: 'Boria'});
            expect(accountList.length).toEqual(start + 1);
        });

    });

    describe('$emit event', () => {

        const testData = [
            {method: 'showAccountsListScreen', args: [], argsEmit: ['change-mode', 'list']},
            {method: 'showInputSeedScreen', args: [], argsEmit: ['change-mode', 'create-seed']},
            {method: 'showLoginScreen', args: ['account'], argsEmit: ['change-mode', 'login', 'account']},
            {method: 'showRegisterScreen', args: ['seed'], argsEmit: ['change-mode', 'register', 'seed']},
            {method: 'notifyGenerateSeed', args: [], argsEmit: ['generate-seed']}
        ];

        testData.forEach((item) => {
            const $scope = {
                $emit: function (...args) {
                    args.forEach((argItem, i) => {
                        expect(argItem).toEqual(item.argsEmit[i]);
                    });
                }
            };

            it(item.method, () => {
                loginContext[item.method](...[$scope].concat(item.args));
            });
        });
    });
});
