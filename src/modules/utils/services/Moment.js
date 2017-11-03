(function () {
    'use strict';

    const factory = function () {

        class Moment {

            /**
             * @param {Date|number} date
             * @param {string} [pattern]
             */
            constructor(date, pattern) {
                /**
                 * @type {Date}
                 * @private
                 */
                this._date = Moment._parse(date, pattern);
                /**
                 * @type {function}
                 * @private
                 */
                this._formatter = pattern ? tsUtils.date(pattern) : null;
            }

            /**
             * @param {string} pattern
             */
            applyPattern(pattern) {
                if (pattern) {
                    this._formatter = tsUtils.date(pattern);
                }
            }

            /**
             * @return {IAdd}
             */
            add() {
                return this._getBinded('_add');
            }

            /**
             * @return {IStartOf}
             */
            startOf() {
                return this._getBinded('_startOf');
            }

            /**
             * @param {string} pattern
             * @return {string}
             */
            format(pattern) {
                return tsUtils.date(pattern)(this.date);
            }

            /**
             * @return {Moment}
             */
            clone() {
                return new Moment(this._date);
            }

            /**
             * @return {number}
             */
            valueOf() {
                return this._date.valueOf();
            }

            /**
             * @return {string}
             */
            toString() {
                if (this._formatter) {
                    return this._formatter(this._date);
                }
                return this._date.toString();
            }

            /**
             * @return {string}
             */
            toJSON() {
                return this.toString();
            }

            /**
             * @return {Date}
             */
            getDate() {
                return this._date;
            }

            /**
             * @param {string} key
             * @return {Object}
             * @private
             */
            _getBinded(key) {
                const result = Object.create(null);
                Object.keys(this[key]).forEach((name) => {
                    result[name] = this[key][name].bind(this);
                });
                return result;
            }

            /**
             * @return {number[]}
             * @private
             */
            _getParts() {
                return [
                    this._date.getFullYear(),
                    this._date.getMonth(),
                    this._date.getDate(),
                    this._date.getHours(),
                    this._date.getMinutes(),
                    this._date.getSeconds(),
                    this._date.getMilliseconds()
                ];
            }

            /**
             * @param {string|number|Date} date
             * @param {string} [pattern]
             * @return {Date}
             * @private
             */
            static _parse(date, pattern) {
                if (tsUtils.isEmpty(date)) {
                    return new Date();
                }
                if (date instanceof Date) {
                    return date;
                }
                switch (typeof date) {
                    case 'string':
                        return Moment._parseString(date, pattern);
                    case 'number':
                        return new Date(date);
                    default:
                        throw new Error('Can\' parse date!');
                }
            }

            /**
             * @param {string} date
             * @param {string} pattern
             * @return {Date}
             * @private
             */
            static _parseString(date, pattern) {
                if (!pattern) {
                    throw new Error('Can\'t parse date from string without pattern!');
                }

                const parsedParts = [];
                const parts = date.match(/\d+/g);
                pattern.match(Moment._parseReg).forEach((patternPart, index) => {
                    Moment._patterns[patternPart](parsedParts, parts[index]);
                });

                return new Date(...parsedParts);
            }

        }

        /**
         * @type {Object}
         * @private
         */
        Moment._patterns = Object.create(null);

        const PATTERNS = [
            'YYYY', 'YY', 'MM', 'M', 'DD', 'D', 'hh', 'h', 'mm', 'm', 'ss', 's'
        ];

        /**
         * @type {RegExp}
         * @private
         */
        Moment._parseReg = new RegExp(PATTERNS.join('|'), 'g');

        const loop = function (pattern, index) {
            switch (pattern) {
                case 'YYYY':
                    Moment._patterns[pattern] = function (result, part) {
                        result[index] = Number(part);
                    };
                    break;
                case 'YY':
                    Moment._patterns[pattern] = function (result, part) {
                        const year = Number(part);
                        result[index] = year > 40 ? year + 1900 : year + 2000;
                    };
                    break;
                case 'MM':
                case 'M':
                    Moment._patterns[pattern] = function (result, part) {
                        result[index] = Number(part) - 1;
                    };
                    break;
                default:
                    Moment._patterns[pattern] = function (result, part) {
                        result[index] = Number(part);
                    };
                    break;
            }
        };

        for (let i = 0, k = 0; i < PATTERNS.length; i += 2) {
            for (let j = 0; j < 2; j++) {
                const pattern = PATTERNS[i + j];
                loop(pattern, k);
            }
            k++;
        }

        /**
         * @type {Object}
         * @private
         */
        Moment.prototype._add = Object.create(null);
        /**
         * @type {Object}
         * @private
         */
        Moment.prototype._startOf = Object.create(null);
        ['year', 'month', 'day', 'hour', 'minute', 'second'].forEach((name, index) => {
            Moment.prototype._add[name] = function (count) {
                const params = this._getParts();
                params[index] += count;
                this._date = new Date(...params);
                return this;
            };
            Moment.prototype._startOf[name] = function () {
                const params = this._getParts().slice(index);
                this._date = new Date(...params);
                return this;
            };
        });
        Moment.prototype._add.week = function (count) {
            const params = this._getParts();
            params[2] += Math.round(count * 7);
            this._date = new Date(...params);
            return this;
        };

        return Moment;
    };

    factory.$inject = [];

    angular.module('app.utils').factory('Moment', factory);
})();

/**
 * @callback IAddDateCallback
 * @param {number} count
 * @return {Moment}
 */

/**
 * @callback IStartOfCallback
 * @return {Moment}
 */

/**
 * @typedef {Object} IAdd
 * @property {IAddDateCallback} year
 * @property {IAddDateCallback} month
 * @property {IAddDateCallback} week
 * @property {IAddDateCallback} day
 * @property {IAddDateCallback} hour
 * @property {IAddDateCallback} minute
 * @property {IAddDateCallback} second
 */

/**
 * @typedef {Object} IStartOf
 * @property {IStartOfCallback} year
 * @property {IStartOfCallback} month
 * @property {IStartOfCallback} day
 * @property {IStartOfCallback} hour
 * @property {IStartOfCallback} minute
 * @property {IStartOfCallback} second
 */
