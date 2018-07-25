(function () {
    'use strict';

    const tsUtils = require('ts-utils');

    /**
     * @param {app.utils} utils
     * @returns {VisibleService}
     */
    const factory = function (Base, utils) {

        class VisibleService extends Base {

            constructor() {
                super();
                this.children = Object.create(null);
                this._handler = utils.debounceRequestAnimationFrame((e) => this._onScroll(e));
                this._initHandler = utils.debounce(() => this._onScroll(), 50);
            }

            checkVisibleContent() {
                this._handler();
            }

            /**
             * @param {Visible} visible
             * @param {JQuery} $element
             */
            registerVisibleComponent(visible, $element) {
                const $parent = $element.parent();

                if (!$parent.length) {
                    throw new Error('Element visible has no parent!');
                }

                const id = VisibleService._getParentId($parent);

                if (!this.children[id]) {
                    this.children[id] = {
                        scrollTop: $parent.scrollTop(),
                        visible: Object.create(null),
                        list: []
                    };
                }

                this.children[id].list.push(visible);

                this.receiveOnce(visible.signals.destroy, () => {
                    this.children[id].list = this.children[id].list.filter(i => i !== visible);

                    if (!this.children[id].list.length) {
                        delete this.children[id];
                    }

                    if (Object.keys(this.children).length === 0) {
                        this._removeHandlers();
                    }
                });

                if (Object.keys(this.children).length === 1 && this.children[id].list.length === 1) {
                    this._addHandlers();
                }

                this._initHandler();
            }

            unregisterVisibleComponent(visible) {
                Object.values(this.children).forEach(info => {
                    info.list = info.list.filter(i => i !== visible);
                    delete info.visible[visible.cid];
                });
                this.stopReceive(visible.signals.destroy);
            }

            /**
             * @param {Event} e
             * @private
             */
            _onScroll(e) {
                const target = e && e.target;
                const id = target && target.getAttribute('id');

                if (id && this.children[id]) {
                    this._scrollById(target.scrollTop, id);
                } else {
                    Object.keys(this.children).forEach(id => {
                        const element = document.querySelector(`#${id}`);
                        this._scrollById(element.scrollTop, id);
                    });
                }
            }

            /**
             * @param {number} activeScrollTop
             * @param {string} id
             * @private
             */
            _scrollById(activeScrollTop, id) {
                const lastScrollTop = this.children[id].scrollTop;
                const direction = activeScrollTop > lastScrollTop;

                const visibleHash = this.children[id].visible;
                this.children[id].visible = Object.create(null);

                if (!Object.keys(visibleHash).length) {
                    this.children[id].list.forEach(item => {
                        const isVisible = item.currentVisibleState();

                        if (isVisible) {
                            this.children[id].visible[item.cid] = item;
                        }
                    });
                    return null;
                }

                let wasVisible = false;
                let wasChangeVisible = false;

                const loop = (i) => {
                    const item = this.children[id].list[i];
                    wasVisible = wasVisible || visibleHash[item.cid];

                    if (!wasVisible) {
                        return null;
                    }

                    const isVisible = item.currentVisibleState();

                    if (isVisible) {
                        this.children[id].visible[item.cid] = item;
                        wasChangeVisible = true;
                    } else if (wasChangeVisible) {
                        return false;
                    }
                };

                if (direction) {
                    for (let i = 0; i < this.children[id].list.length; i++) {
                        if (loop(i) === false) {
                            break;
                        }
                    }
                } else {
                    for (let i = this.children[id].list.length - 1; i >= 0; i--) {
                        if (loop(i) === false) {
                            break;
                        }
                    }
                }

                this.children[id].scrollTop = activeScrollTop;
            }

            /**
             * @private
             */
            _addHandlers() {
                document.addEventListener('scroll', this._handler, true);
                window.addEventListener('resize', this._handler, false);
            }

            /**
             * @private
             */
            _removeHandlers() {
                document.removeEventListener('scroll', this._handler, true);
                window.removeEventListener('resize', this._handler, false);
            }

            /**
             * @param {JQuery} $parent
             * @return {string}
             * @private
             */
            static _getParentId($parent) {
                const nodeId = $parent.attr('id');
                if (nodeId) {
                    return nodeId;
                }

                const id = tsUtils.uniqueId('visible-parent-id');
                $parent.attr('id', id);

                return id;
            }

        }

        return new VisibleService();
    };

    factory.$inject = ['Base', 'utils'];

    angular.module('app.ui').factory('visibleService', factory);
})();
