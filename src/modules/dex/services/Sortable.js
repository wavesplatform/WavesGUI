{
    class Column {

        /**
         * @param name
         * @param compareAscending
         * @param compareDescending
         * @param compareStabilizing
         */
        constructor({ name, compareAscending, compareDescending, compareStabilizing }) {
            /**
             * @type {string}
             */
            this.name = name;

            /**
             * @returns {number}
             */
            this.compareStub = () => 0;

            /**
             * @type {(function(): number)|*}
             */
            this._compare = this.compareStub;

            /**
             * @type {*|(function(): number)}
             * @private
             */
            this._compareAscending = compareAscending || this.compareStub;

            /**
             * @type {*|(function(): number)}
             * @private
             */
            this._compareDescending = compareDescending || this.compareStub;

            /**
             * @type {*|(function(): number)}
             * @private
             */
            this._compareStabilizing = compareStabilizing || this.compareStub;
        }

        /**
         * @param items
         */
        switchAndSort(items) {
            if (this._compare !== this._compareAscending) {
                this._compare = this._compareAscending;
            } else {
                this._compare = this._compareDescending;
            }

            this.sortAndStabilize(items);
        }

        /**
         * @param items
         */
        sortAndStabilize(items) {
            if (this._compare === this.compareStub) {
                return;
            }

            items.sort(this._compare);
            this._stabilize(items);
        }

        removeSort() {
            this._compare = this.compareStub;
        }

        /**
         * @param items
         * @private
         */
        _stabilize(items) {
            if (this._compareStabilizing === this.compareStub) {
                return;
            }

            // Additional items sorting by unique value is required to prevent them from switching place
            // during data set update.
            const itemGroups = new Map();
            for (const item of items) {
                const groupName = item[this.name];
                let itemGroup = itemGroups.get(groupName);

                if (!itemGroup) {
                    itemGroup = [];
                    itemGroups.set(groupName, itemGroup);
                }

                itemGroup.push(item);
            }

            while (items.length) {
                items.pop();
            }

            itemGroups.forEach((itemGroup) => {
                itemGroup.sort(this._compareStabilizing);
                items.push(...itemGroup);
            });
        }

    }

    class Columns {

        /**
         * @param columns
         */
        constructor(columns) {
            this._columns = columns.map((column) => new Column(column));
        }

        /**
         * @param items
         * @returns {*}
         */
        applyCurrentSort(items) {
            for (const column of this._columns) {
                column.sortAndStabilize(items);
            }

            return items;
        }

        /**
         * @param columnName
         * @param items
         */
        sortBy(columnName, items) {
            this._removeCurrentSort(columnName);
            this._getColumnByName(columnName).switchAndSort(items);
        }

        /**
         * @param excludedColumnName
         * @private
         */
        _removeCurrentSort(excludedColumnName) {
            for (const column of this._columns) {
                if (column.name === excludedColumnName) {
                    continue;
                }

                column.removeSort();
            }
        }

        /**
         * @param columnName
         * @returns {*}
         * @private
         */
        _getColumnByName(columnName) {
            return this._columns.find((column) => column.name === columnName);
        }

    }

    class Sortable {

        constructor() {
            this.Columns = Columns;
        }

    }

    angular.module('app.dex').service('Sortable', Sortable);
}
