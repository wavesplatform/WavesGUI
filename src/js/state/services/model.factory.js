(function () {
    'use strict';

    function ModelFactory($q) {

        class Model {

            constructor(data = null, options = {}) {
                this.data = data;
                this.api = options.api;
                this.delay = options.delay || 0;
                this.lastCall = 0;
            }

            get(path) {
                if (!path) {
                    return $q.when(this.toJSON());
                } else if (!this.data) {
                    return $q.when(null);
                } else if (this.data[path] instanceof Model) {
                    return $q.when(this.data[path].toJSON());
                } else {
                    return $q.when(_.cloneDeepWith(this.data[path], Model.safeClone));
                }
            }

            set(path, value) {
                if (typeof path === `object`) {
                    this.data = path;
                } else {
                    this.data = this.data || {};
                    this.data[path] = value;
                }

                // TODO : $broadcast

                // TODO : success/error if there was an API request
                return $q.when();
            }

            toJSON() {
                return _.cloneDeepWith(this.data, Model.safeClone);
            }

            // fromJSON(json) {}

            static safeClone(value) {
                if (value instanceof Model) {
                    return value.toJSON();
                } else {
                    return value;
                }
            }

        }

        return {
            create(data, options) {
                return new Model(data, options);
            }
        };

    }

    ModelFactory.$inject = [`$q`];

    angular
        .module(`app.state`)
        .factory(`modelFactory`, ModelFactory);
})();
