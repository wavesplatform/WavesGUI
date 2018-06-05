{
    class PairsTabsService {

        constructor(PairsTab) {

            return class PairsTabs {

                constructor() {
                    /**
                     * @type {Map<string, PairsTab>}
                     * @private
                     */
                    this._tabs = new Map();

                    /**
                     * @type {PairsTab}
                     * @private
                     */
                    this._chosenTab = null;
                }

                /**
                 * @param tabsData
                 */
                addPairs(tabsData) {
                    tabsData.forEach((tabData) => {
                        this._tabs.set(tabData.id, new PairsTab(tabData));
                    });

                    return this.switchTabTo(tabsData[0].id);
                }

                /**
                 * @returns {PairsTab}
                 */
                getChosenTab() {
                    return this._chosenTab;
                }

                /**
                 * @param id
                 * @returns {Promise<void>}
                 */
                switchTabTo(id) {
                    let chosenPair = null;
                    if (this._chosenTab) {
                        this._chosenTab.clearSearchResults();
                        chosenPair = this._chosenTab.getChosenPair();
                    }
                    this._chosenTab = this._tabs.get(id);

                    const tabActivation = this._chosenTab.activate();
                    if (chosenPair) {
                        this._chosenTab.choosePair(chosenPair);
                    }

                    return tabActivation;
                }

            };
        }

    }

    PairsTabsService.$inject = ['PairsTab'];

    angular.module('app.dex').service('PairsTabs', PairsTabsService);
}
