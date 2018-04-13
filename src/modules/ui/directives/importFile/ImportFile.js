(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @return {ImportFile}
     */
    const controller = function (Base, $element, utils) {

        const tsUtils = require('ts-utils');

        class ImportFile extends Base {

            constructor() {
                super();
                /**
                 * @type {string|Array<string>}
                 */
                this.extantions = null;
                /**
                 * @type {Function}
                 */
                this.onChange = null;
                /**
                 * @type {File}
                 * @private
                 */
                this._file = null;
                /**
                 * @type {HTMLInputElement}
                 * @private
                 */
                this._input = ImportFile._createInput();

                this._setHandlers();
            }

            $onDestroy() {
                document.body.removeChild(this._input);
                super.$onDestroy();
            }

            /**
             * @private
             */
            _setHandlers() {
                this.listenEventEmitter($element, 'click', () => this._onClick());
                this.listenEventEmitter(this._input, 'change', () => this._onChange(), {
                    on: 'addEventListener',
                    off: 'removeEventListener'
                });
                this.observe('_file', ({ value }) => this.onChange({ file: value }));
            }

            /**
             * @private
             */
            _onChange() {
                const [file] = this._input.files;
                if (file) {
                    if (this._isFileValid(file) && this._isNotEqual(file)) {
                        this._file = file;
                    }
                } else if (this._file) {
                    this._file = null;
                }
            }

            /**
             * @private
             */
            _onClick() {
                this._input.click();
            }

            /**
             * @param {File} file
             * @return {boolean}
             * @private
             */
            _isFileValid(file) {
                if (tsUtils.isNotEmpty(this.extantions)) {
                    const extantions = utils.toArray(this.extantions);
                    const fileExtantion = file.name.split('.')[1];
                    return fileExtantion && extantions.some((ext) => ext === fileExtantion);
                } else {
                    return true;
                }
            }

            /**
             * @param {File} file
             * @return {boolean}
             * @private
             */
            _isNotEqual(file) {
                return !this._file || !(this._file.lastModified === file.lastModified &&
                    this._file.size === file.size &&
                    this._file.type === file.type);
            }

            /**
             * @return {HTMLInputElement}
             * @private
             */
            static _createInput() {
                /**
                 * @type {HTMLInputElement}
                 */
                const input = document.createElement('input');
                input.type = 'file';
                input.style.position = 'absolute';
                input.style.left = '-100px';
                input.style.top = '-100px';
                document.body.appendChild(input);
                return input;
            }

        }

        return new ImportFile();
    };

    controller.$inject = ['Base', '$element', 'utils'];

    angular.module('app.ui').component('wImportFile', {
        bindings: {
            extantions: '<',
            onChange: '&'
        },
        template: '<ng-transclude></ng-transclude>',
        transclude: true,
        controller
    });
})();
