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
                this.extensionList = null;
                /**
                 * @type {Function}
                 */
                this.onChange = null;
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
            }

            /**
             * @private
             */
            _onChange() {
                const [file] = this._input.files;

                if (file) {
                    if (!this._isFileValid(file)) {
                        this.onChange({
                            data: {
                                status: 'error',
                                type: 'extension',
                                message: 'Wrong extension',
                                file
                            }
                        });
                        return null;
                    }

                    this.onChange({ data: { status: 'ok', file } });
                }

                this._input.value = '';
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
                if (tsUtils.isNotEmpty(this.extensionList)) {
                    const extensionList = utils.toArray(this.extensionList);
                    const fileExtension = file.name.split('.')[1];
                    return fileExtension && extensionList.some((ext) => ext === fileExtension);
                } else {
                    return true;
                }
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
            extensionList: '<',
            onChange: '&'
        },
        template: '<ng-transclude></ng-transclude>',
        transclude: true,
        controller
    });
})();

/**
 * @name ImportFile
 *
 * @typedef {object} ImportFile#IOnChangeOptions
 * @property {'ok'|'error'} status
 * @property {'extension'} [type]
 * @property {File} file
 */

