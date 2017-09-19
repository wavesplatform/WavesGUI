(function () {
    'use strict';

    const factory = function () {

        class StyleManager {

            constructor(root) {
                this.root = root;
                this.stylesHash = Object.create(null);
            }

            addStyle(path, style) {
                this.removeStyle(path);
                const content = `.${this.root} ${path} { ${this._parseStyle(style)} }`;
                const styleTag = document.createElement('style');
                styleTag.innerText = content;
                styleTag.id = path;
                document.head.appendChild(styleTag);
                this.stylesHash[path] = styleTag;
            }

            removeStyle(path) {
                if (this.hasStyle(path)) {
                    document.head.removeChild(this.stylesHash[path]);
                }
            }

            realStyleTransaction(path, cb) {
                const element = this.stylesHash[path];
                if (element) {
                    document.head.removeChild(element);
                    cb();
                    document.head.appendChild(element);
                } else {
                    cb();
                }
            }

            destroy() {
                Object.keys(this.stylesHash)
                    .forEach(this.removeStyle, this);
            }

            hasStyle(path) {
                return !!this.stylesHash[path];
            }

            _parseStyle(style) {
                let template = '';
                tsUtils.each(style, (value, key) => {
                    template += `${key}: ${value};`.replace(';;', ';');
                });
                return template;
            }

        }

        window.StyleManager = StyleManager;

        return StyleManager;
    };

    factory.$inject = [];

    angular.module('app.utils')
        .factory('StyleManager', factory);
})();
