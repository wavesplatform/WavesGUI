(function () {
    'use strict';

    const factory = function (utils, EVENT_STATUSES) {

        class EventComponent {

            constructor(data) {
                this._name = data.name;
                this._data = data;
            }

            getStatus() {
                return utils.when(EVENT_STATUSES.SUCCESS);
            }

            addId(id) {
                this.id = id;
            }

            toJSON() {
                return {
                    name: this._name,
                    data: this._data
                };
            }

        }

        return EventComponent;
    };

    factory.$inject = ['utils', 'EVENT_STATUSES'];

    angular.module('app').factory('EventComponent', factory);
})();
