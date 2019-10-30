(function () {
    'use strict';

    const PATH = 'modules/ui/directives/smartTable/templates';
    const SEARCH_KEY = 'searchQuery';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @param {app.utils.decorators} decorators
     * @param {function(url: string): Promise<string>} $templateRequest
     * @param {$compile} $compile
     * @param {app.utils} utils
     * @param {STService} stService
     * @param {app.i18n} i18n
     * @return {SmartTable}
     */
    const controller = function (Base, $scope, $element, decorators, $templateRequest, $compile, utils, stService,
                                 i18n) {

        const tsUtils = require('ts-utils');


        class SmartTable extends Base {

            constructor() {
                super();
                /**
                 * @type {Array<*>}
                 */
                this.data = null;
                /**
                 * @type {Array<SmartTable.IHeaderInfo>}
                 */
                this.headerInfo = null;
                /**
                 * @type {Array|function}
                 */
                this._filterList = [];
                /**
                 * @type {SmartTable.ISmartTableOptions}
                 */
                this.options = null;
                /**
                 * @type {Array<SmartTable._IHeaderData>}
                 * @private
                 */
                this._headerData = null;
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._header = null;
                /**
                 * @type {Array}
                 * @private
                 */
                this._visibleList = [];
                /**
                 * @type {Array}
                 * @private
                 */
                this._filtredList = [];
                /**
                 * @type {Promise<string>}
                 */
                this._headerCellPromise = $templateRequest(`${PATH}/headerCell.html`);

                this.observe('headerInfo', this._onChangeHeader);
                this.observe('options', this._onChangeOptions);
                this.observeOnce('_headerData', () => {
                    this.observe(['_headerData', 'data', 'filterList', 'options'], this.render);
                    this.render();
                });

                stService.register(this);
            }

            $postLink() {
                this._header = $element.find('.smart-table__thead');
            }

            $onDestroy() {
                stService.unregister(this);
                super.$onDestroy();
            }

            getIdByIndex(index) {
                return this.headerInfo[index].id;
            }

            /**
             * @param {SmartTable.ISmartTableOptions} value
             * @param {SmartTable.ISmartTableOptions} prev
             * @private
             */
            _onChangeOptions({ value, prev }) {
                this._dropOldOptions(prev);
                utils.toArray(value && value.filter || []).forEach((item) => {
                    this._filterList.push(item);
                });
            }

            /**
             * @param {SmartTable.ISmartTableOptions} oldOptions
             * @private
             */
            _dropOldOptions(oldOptions) {
                if (!oldOptions) {
                    return null;
                }
                utils.toArray(oldOptions.filter).forEach((filter) => {
                    this._filterList = this._filterList.filter(f => f !== filter);
                });
            }

            /**
             * @private
             */
            _applySort() {
                this._sort();
                this._draw();
            }

            @decorators.async()
            render() {
                this._visibleList = [];
                this._filtredList = [];
                if (this.data && this.data.length) {
                    this._filter();
                    this._sort();
                }
                this._draw();
            }

            /**
             * @return {null}
             * @private
             */
            @decorators.async()
            _onChangeHeader() {
                const headers = this.headerInfo;
                const defaultNs = i18n.getNs($element);

                if (!headers || !headers.length) {
                    return null;
                }

                const $tr = this._header.find('.smart-table__row');
                $tr.empty();

                this._clearHeader();

                Promise.all(this.headerInfo.map(this._remapHeaders, this)).then((headerDataList) => {

                    headerDataList.forEach((data) => {
                        const descriptorHash = Object.create(null);
                        if (data.sort) {
                            data.$element.on('click', '.sort-by', this._getClickHeaderHandler(data));
                            Object.assign(descriptorHash, {
                                sorting: { get: () => data.sorting, enumerable: false, configurable: false },
                                isAsc: { get: () => data.isAsc, enumerable: false, configurable: false }
                            });
                        }

                        if (data.search) {
                            this._filterList.push(data.search);
                            descriptorHash[SEARCH_KEY] = {
                                get: () => data.searchQuery,
                                set: (value) => {
                                    if (value !== data.searchQuery) {
                                        data.searchQuery = value;
                                        this.render();
                                    }
                                }
                            };
                        }

                        data.$scope.title = data.title || Object.create(null);
                        data.$scope.title.ns = data.$scope.title && data.$scope.title.ns || defaultNs;
                        data.$scope.sort = !!data.sort;
                        data.$scope.search = !!data.search;
                        data.$scope.placeholder = data.placeholder;

                        Object.defineProperties(data.$scope, descriptorHash);

                        $tr.append(data.$element);
                    });

                    this._headerData = headerDataList;
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _clearHeader() {
                const headerData = this._headerData;

                if (headerData && headerData.length) {
                    headerData.forEach((item) => {
                        item.$scope.$destroy();
                    });
                }

                this._headerData = [];
            }

            /**
             * @param {SmartTable.IHeaderInfo} header
             * @return {Promise<SmartTable._IHeaderData>}
             * @private
             */
            _remapHeaders(header) {
                const { id, title } = header;
                const valuePath = header.valuePath || id;
                const $headerScope = $scope.$new(true);
                const xhr = header.templatePath ? $templateRequest(header.templatePath) : this._headerCellPromise;
                const sorting = header.sortActive || false;

                Object.assign($headerScope, { ...header.scopeData || Object.create(null) }, { id });

                return xhr.then((template) => {
                    const $element = $compile(template)($headerScope);

                    return {
                        id,
                        title,
                        valuePath,
                        sort: SmartTable._getSortFunction(header.sort, valuePath),
                        search: SmartTable._getSearchFunction($headerScope, header.search, valuePath),
                        sorting,
                        isAsc: tsUtils.isEmpty(header.isAsc) ? true : header.isAsc,
                        searchQuery: '',
                        $scope: $headerScope,
                        $element,
                        placeholder: header.placeholder || 'filter'
                    };
                });
            }

            /**
             * @param {SmartTable._IHeaderData} headerData
             * @private
             */
            _getClickHeaderHandler(headerData) {
                return () => {
                    if (headerData.sorting) {
                        headerData.isAsc = !headerData.isAsc;
                    } else {
                        this._headerData.forEach(function (item) {
                            item.sorting = false;
                        });
                        headerData.sorting = true;
                        headerData.isAsc = false;
                    }

                    if (this.name) {
                        stService.draw.once(() => {
                            stService.sort.dispatch({
                                name: this.name,
                                isAsc: headerData.isAsc
                            });
                        });
                    }

                    this._applySort();
                };
            }

            /**
             * @private
             */
            _sort() {
                const header = tsUtils.find(this._headerData || [], { sorting: true });
                if (header) {
                    this._visibleList = header.sort(this._filtredList.slice(), header.isAsc);
                } else {
                    this._visibleList = this._filtredList.slice();
                }
            }

            /**
             * @private
             */
            _filter() {
                const filters = this._getFilterList();

                if (!filters || !filters.length) {
                    this._filtredList = this.data.slice();
                    return null;
                }


                this._filtredList = filters.reduce((result, filter) => {
                    return filter(result);
                }, this.data.slice());
            }

            /**
             * @return {Array<function>}
             * @private
             */
            _getFilterList() {
                return utils.toArray(this._filterList || []);
            }

            /**
             * @private
             */
            @decorators.async()
            _draw() {
                $scope.$parent.$data = this._visibleList;
                SmartTable._postDraw().then(() => {
                    if (this.name) {
                        stService.draw.dispatch(this.name);
                    }
                });
                $scope.$parent.$digest();
            }

            /**
             * @return {Promise<void>}
             * @private
             */
            static _postDraw() {
                return new Promise(resolve => {
                    $scope.$parent.$$postDigest(resolve);
                });
            }

            /**
             * @param {boolean|SmartTable.ISortCallback} sort
             * @param {string} valuePath
             * @return {null|SmartTable.ISortCallback}
             * @private
             */
            static _getSortFunction(sort, valuePath) {
                if (typeof sort === 'function') {
                    return sort;
                }

                return sort && function (list, isAsc) {
                    const method = isAsc ? 'asc' : 'desc';
                    const getValue = (item) => tsUtils.get({ item }, valuePath);
                    return list.sort(utils.comparators.process(getValue).smart[method]);
                } || null;
            }

            /**
             * @param {$rootScope.Scope} $scope
             * @param {boolean|SmartTable.ISearchCallback} search
             * @param {string} valuePath
             * @return {null|SmartTable.ISearchCallback}
             * @private
             */
            static _getSearchFunction($scope, search, valuePath) {
                const defaultSearchFunction = function ($scope, key, list) {
                    const query = $scope[key];
                    if (!query) {
                        return list;
                    }

                    return list.filter((item) => {
                        const value = tsUtils.get({ item }, valuePath);
                        return String(value).toLowerCase().indexOf(query.toLowerCase()) !== -1;
                    });
                };


                if (typeof search === 'function') {
                    return (list) => search($scope, SEARCH_KEY, list);
                } else {
                    return search && ((list) => defaultSearchFunction($scope, SEARCH_KEY, list)) || null;
                }
            }

        }

        return new SmartTable();
    };

    controller.$inject = [
        'Base',
        '$scope',
        '$element',
        'decorators',
        '$templateRequest',
        '$compile',
        'utils',
        'stService',
        'i18n'
    ];

    angular.module('app.ui').component('wSmartTable', {
        bindings: {
            name: '@',
            data: '<',
            options: '<',
            headerInfo: '<'
        },
        templateUrl: `${PATH}/table.html`,
        transclude: true,
        controller
    });
})();

/**
 * @name SmartTable
 */

/**
 * @typedef {object} SmartTable#ILocaleItem
 * @property {string} literal
 * @property {string} [ns] TODO add support custom ns
 * @property {object} [params]
 */

/**
 * @typedef {object} SmartTable#IHeaderInfo
 * @property {SmartTable.ILocaleItem} title
 * @property {string} id
 * @property {string} [valuePath]
 * @property {string} [templatePath]
 * @property {*} [scopeData]
 * @property {boolean|SmartTable.ISortCallback} sort
 * @property {boolean} [sortActive]
 * @property {boolean} [isAsc]
 * @property {boolean|SmartTable.ISearchCallback} search
 * @property {string} [placeholder]
 */

/**
 * @typedef {object} SmartTable#ISmartTableOptions
 * @property {SmartTable.IFilterCallback|SmartTable.IFilterCallback[]} [filter]
 */

/**
 * @typedef {object} SmartTable#_IHeaderData
 * @property {SmartTable.ILocaleItem} title
 * @property {string} id
 * @property {string} [valuePath]
 * @property {SmartTable.ISortCallback} [sort]
 * @property {boolean|SmartTable.ISortCallback} search
 * @property {string} searchQuery
 * @property {boolean} sorting
 * @property {boolean} isAsc
 * @property {JQuery} $element
 * @property {$rootScope.Scope} $scope
 */

/**
 * @typedef {function} SmartTable#ISearchCallback
 * @param {$rootScope.Scope} $scope
 * @param {string} queryModelKey
 * @param {Array} list
 * @return {Array}
 */

/**
 * @typedef {function} SmartTable#IFilterCallback
 * @param {Array} list
 * @return {Array}
 */

/**
 * @typedef {function} SmartTable#ISortCallback
 * @param {Array} data
 * @return {Array}
 */
