(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param EVENT_STATUSES
     * @return {AppEvent}
     */
    const factory = function (utils, EVENT_STATUSES) {

        /**
         * @class AppEvent
         */
        class AppEvent {

            constructor(id) {
                this.id = id;
                /**
                 * @type {EventComponent[]}
                 */
                this.components = [];
            }

            /**
             * @param {EventComponent[]|EventComponent} components
             */
            addComponents(components) {
                utils.toArray(components).forEach((item) => {
                    item.addId(this.id);
                    this.components.push(item);
                });
            }

            getStatus() {
                return utils.whenAll(this.components.map((item) => item.getStatus()))
                    .then((statusList) => {
                        const result = { id: this.id, status: EVENT_STATUSES.SUCCESS };

                        for (let i = 0; i < statusList.length; i++) {
                            const status = statusList[i];
                            switch (status) {
                                case EVENT_STATUSES.ERROR:
                                    result.status = EVENT_STATUSES.ERROR;
                                    return result;
                                case EVENT_STATUSES.PENDING:
                                    result.status = EVENT_STATUSES.PENDING;
                                    return result;
                                case EVENT_STATUSES.SUCCESS:
                                    break; // All components must be checked
                                default:
                                    throw new Error('Invalid event status');
                            }
                        }

                        return result;
                    });
            }

            toJSON() {
                return {
                    id: this.id,
                    components: this.components.map((item) => item.toJSON())
                };
            }

        }

        return AppEvent;
    };

    factory.$inject = ['utils', 'EVENT_STATUSES'];

    angular.module('app')
        .factory('AppEvent', factory);
})();

/**
 * @typedef {Object} IAppEventData
 * @property {string} id
 * @property {IEventComponent[]} components
 */
