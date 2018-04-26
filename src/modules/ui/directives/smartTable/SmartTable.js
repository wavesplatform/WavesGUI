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
     * @return {SmartTable}
     */
    const controller = function (Base, $scope, $element, decorators, $templateRequest, $compile, utils) {

        const tsUtils = require('ts-utils');


        class SmartTable extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.templatesPath = PATH;
                /**
                 * @type {Array<*>}
                 */
                this.data = null;
                /**
                 * @type {Array<SmartTable.IHeaderInfo>}
                 */
                this.headerInfo = null;
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
                 * @type {Array|function}
                 */
                this.filterList = [];
                /**
                 * @type {Array}
                 * @private
                 */
                this._filterList = [];
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
                this.observeOnce('headerInfo', () => {
                    this.observe(['data', 'filterList'], this._render);
                    this._render();
                });
            }

            $postLink() {
                this._header = $element.find('.smart-table__w-thead');
            }

            _applySort() {
                this._sort();
                this._draw();
            }

            /**
             * @private
             */
            @decorators.async()
            _render() {
                this._visibleList = [];
                this._filtredList = [];
                if (this.data && this.data.length) {
                    this._filter();
                    this._sort();
                }
                this._draw();
            }

            @decorators.async()
            _onChangeHeader() {
                const headers = this.headerInfo;

                if (!headers || !headers.length) {
                    return null;
                }

                const $tr = this._header.find('.smart-table__row');
                $tr.empty();

                this._clearHeader();

                this._headerCellPromise.then((template) => {

                    const headerDataList = this.headerInfo.map(this._remapHeaders(template));

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
                                        this._render();
                                    }
                                }
                            };
                        }

                        data.$scope.title = data.title;
                        data.$scope.sort = !!data.sort;
                        data.$scope.search = !!data.search;

                        Object.defineProperties(data.$scope, descriptorHash);

                        $tr.append(data.$element);
                    });

                    this._headerData = headerDataList;
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
             * @param {string} template
             * @return {function(head: SmartTable.IHeaderInfo): SmartTable._IHeaderData}
             * @private
             */
            _remapHeaders(template) {
                return (header) => {
                    const { id, title } = header;
                    const valuePath = header.valuePath || id;
                    const $headeScope = $scope.$new(true);
                    const $element = $compile(template)($headeScope);

                    return {
                        id,
                        title,
                        valuePath,
                        sort: SmartTable._getSortFunction(header.sort, valuePath),
                        search: SmartTable._getSearchFunction($headeScope, header.search, valuePath),
                        sorting: false,
                        isAsc: true,
                        searchQuery: '',
                        $scope: $headeScope,
                        $element
                    };
                };
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
                return utils.toArray(this.filterList || []).concat(this._filterList);
            }

            /**
             * @private
             */
            @decorators.async()
            _draw() {
                $scope.$parent.$data = this._visibleList;
                $scope.$parent.$digest();
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

    controller.$inject = ['Base', '$scope', '$element', 'decorators', '$templateRequest', '$compile', 'utils'];

    angular.module('app.ui').component('wSmartTable', {
        bindings: {
            data: '<',
            headerInfo: '<',
            filterList: '<'
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
 * @property {boolean|SmartTable.ISortCallback} sort
 * @property {boolean|SmartTable.ISearchCallback} search
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
 * @typedef {function} SmartTable#ISortCallback
 * @param {Array} data
 * @return {Array}
 */
