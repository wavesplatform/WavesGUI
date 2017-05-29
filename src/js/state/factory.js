(function () {
    'use strict';

    angular
        .module('app.state')
        .factory('stateFactory', ['$rootScope', '$q', function ($rootScope, $q) {
            function Model(data, props) {
                props = props || {};
                this.data = data ? _.cloneDeep(data) : null;
                this.apiMethod = props.apiMethod;
                this.delay = props.delay || 5000;
                this.lastCall = 0;
            }

            Model.prototype.getData = function (params) {
                if (this.data instanceof Model) {
                    if (this.apiMethod) {
                        (function () {}()); // TODO
                    } else {
                        return this.data.get();
                    }
                } else {
                    return $q.when(_.cloneDeepWith(this.data, safeClone));
                }
            };

            Model.prototype.get = function (path, params) {
                var steps,
                    step;

                if (!path) {
                    return this.getData(params);
                } else {
                    steps = path.split('.');
                    step = steps[0];
                    if (!this.data || !this.data[step]) {
                        return $q.when(null);
                    } else if (this.data[step] instanceof Model) {
                        path = steps.slice(1).join('.');
                        return this.data[step].get(path);
                    } else {
                        return $q.when(_.cloneDeepWith(this.data[step], safeClone));
                    }
                }
            };

            Model.prototype.set = function (path, newValue) {};

            function safeClone(value) {
                if (value instanceof Model) {
                    return value.get();
                } else {
                    return value;
                }
            }

            var state = new Model({
                account: new Model(),
                assets: new Model([])
            });

            return {
                create: function () {
                    return state;
                }
            };
        }]);
})();
