(function () {
    'use strict';

    function State($q) {

        function Model(data, props) {
            props = props || {};
            this.data = data || null;
            this.api = props.api || null;
            this.delay = props.delay || 5000;
            this.lastCall = 0;
        }

        Model.prototype.get = function (path) {
            if (!path) {
                return $q.when(this.toJSON());
            } else if (!this.data) {
                return $q.when(null);
            } else if (this.data[path] instanceof Model) {
                return $q.when(this.data[path].toJSON());
            } else {
                return $q.when(_.cloneDeepWith(this.data[path], Model.safeClone));
            }
        };

        Model.prototype.set = function (path, value) {

            if (typeof path === 'object') {
                this.data = path;
            } else {
                this.data = this.data || {};
                this.data[path] = value;
            }

            // TODO : $broadcast

            // TODO : success/error if there was an API request
            return $q.when();

        };

        Model.prototype.toJSON = function () {
            return _.cloneDeepWith(this.data, Model.safeClone);
        };

        Model.safeClone = function (value) {
            if (value instanceof Model) {
                return value.toJSON();
            } else {
                return value;
            }
        };

        var state = new Model({
            account: new Model(),
            assets: new Model([])
        });

        return {
            getState: function () {
                return state;
            }
        };

    }

    State.$inject = ['$q'];

    angular
        .module('app.state')
        .service('stateService', State);
})();
