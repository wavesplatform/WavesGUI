(function () {
    'use strict';

    const factory = function (utils, EVENT_STATUSES) {

        class EventComponent {

            constructor(data) {
                this._data = data || Object.create(null);
            }

            getStatus() {
                return utils.when(EVENT_STATUSES.SUCCESS);
            }

            addId(id) {
                this.id = id;
            }

            toJSON() {
                return this._data;
            }

        }

        return EventComponent;
    };

    factory.$inject = ['utils', 'EVENT_STATUSES'];

    angular.module('app.ui').factory('EventComponent', factory);
})();
