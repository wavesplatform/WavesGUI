(function () {
    'use strict';

    const factory = function () {

        class UserRouteState {

            get state() {
                const base = `${this.base}.${this.name}`;
                return this.child ? `${base}.${this.child}` : base;
            }

            constructor(base, name, child) {
                this.base = base;
                this.name = name;
                this.child = child;
            }

            /**
             * @param state
             * @param {User} user
             */
            applyState(state, user) {
                if (this._hitTest(state.name)) {
                    this.child = state.name.split('.')[2];
                    user.setSetting(`${this.name}.activeState`, this.child);
                    return true;
                } else {
                    return false;
                }
            }

            _hitTest(stateName) {
                const [base, name] = stateName.split('.');
                return base === this.base && name === this.name;
            }

        }

        return UserRouteState;
    };

    factory.$inject = [];

    angular.module('app.utils').factory('UserRouteState', factory);
})();
