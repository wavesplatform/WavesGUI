(function () {
    'use strict';

    const Handlebars = require('handlebars');
    const { STATUS_LIST } = require('@waves/oracle-data');
    const { path } = require('ramda');
    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const analytics = require('@waves/event-sender');

    // TODO @xenohunter : remove that when icons are in @dvshur's service
    const ASSET_IMAGES_MAP = {
        [WavesApp.defaultAssets.WAVES]: '/img/assets/waves.svg',
        [WavesApp.defaultAssets.BTC]: '/img/assets/bitcoin.svg',
        [WavesApp.defaultAssets.ETH]: '/img/assets/ethereum.svg',
        [WavesApp.defaultAssets.LTC]: '/img/assets/ltc.svg',
        [WavesApp.defaultAssets.ZEC]: '/img/assets/zec.svg',
        [WavesApp.defaultAssets.EUR]: '/img/assets/euro.svg',
        [WavesApp.defaultAssets.USD]: '/img/assets/usd.svg',
        [WavesApp.defaultAssets.DASH]: '/img/assets/dash.svg',
        [WavesApp.defaultAssets.BCH]: '/img/assets/bitcoin-cash.svg',
        [WavesApp.defaultAssets.BSV]: '/img/assets/bitcoin-cash-sv.svg',
        [WavesApp.defaultAssets.TRY]: '/img/assets/try.svg',
        [WavesApp.defaultAssets.XMR]: '/img/assets/xmr.svg',
        [WavesApp.otherAssetsWithIcons.EFYT]: '/img/assets/efyt.svg',
        [WavesApp.otherAssetsWithIcons.WNET]: '/img/assets/wnet.svg'
    };

    const COLORS_LIST = [
        '#39a12c',
        '#6a737b',
        '#e49616',
        '#008ca7',
        '#ff5b38',
        '#ff6a00',
        '#c74124',
        '#00a78e',
        '#b01e53',
        '#e0c61b',
        '#5a81ea',
        '#72b7d2',
        '#a5b5c3',
        '#81c926',
        '#86a3bd',
        '#c1d82f',
        '#5c84a8',
        '#267e1b',
        '#fbb034',
        '#ff846a',
        '#47c1ff',
        '#00a0af',
        '#85d7c6',
        '#8a7967',
        '#26c1c9',
        '#72d28b'
    ];

    const TEMPLATE_PATH = 'modules/wallet/modules/portfolio/directives/portfolioRow/row.hbs';
    const SELECTORS = {
        AVAILABLE: 'js-balance-available',
        SPONSORED: 'js-sponsored-asset',
        IN_ORDERS: 'js-balance-in-orders',
        BASE_ASSET_BALANCE: 'js-balance-in-base-asset',
        EXCHANGE_RATE: 'js-exchange-rate',
        CHANGE_24: 'js-change-24',
        CHART_CONTAINER: 'js-chart-container',
        BUTTONS: {
            SEND: 'js-button-send',
            RECEIVE: 'js-button-receive',
            DEX: 'js-button-open-in-dex',
            TOGGLE_SPAM: 'js-button-toggle-spam'
        },
        ACTION_BUTTONS: {
            ASSET_INFO: 'js-action-button-asset-info',
            SEND: 'js-action-button-send',
            RECEIVE: 'js-action-button-receive',
            BURN: 'js-action-button-burn',
            REISSUE: 'js-action-button-reissue',
            DEX: 'js-action-button-dex',
            TOGGLE_SPAM: 'js-action-button-toggle-spam',
            SPONSORSHIP_CREATE: 'js-action-button-sponsorship_create',
            SPONSORSHIP_EDIT: 'js-action-button-sponsorship_edit',
            SPONSORSHIP_STOP: 'js-action-button-cancel-sponsorship',
            SET_ASSET_SCRIPT: 'js-action-button-set-asset-script'
        }
    };

    const ds = require('data-service');
    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @return {PortfolioRow}
     */
    const controller = function (Base,
                                 $templateRequest,
                                 $element,
                                 utils,
                                 waves,
                                 user,
                                 modalManager,
                                 $state,
                                 ChartFactory,
                                 i18n,
                                 $scope,
                                 gatewayService,
                                 createPoll) {

        class PortfolioRow extends Base {

            /**
             * @type {typeof ChartFactory}
             */
            ChartFactory = null;
            /**
             * @type {$state}
             */
            $state = null;
            /**
             * @type {$rootScope.Scope}
             */
            $scope = null;
            /**
             * @type {app.i18n}
             */
            i18n = null;
            /**
             * @type {ModalManager}
             */
            modalManager = null;
            /**
             * @type {JQuery}
             */
            $node = null;
            /**
             * @type {HTMLElement}
             */
            node = null;
            /**
             * @type {PortfolioCtrl.IPortfolioBalanceDetails}
             */
            balance = null;
            /**
             * @type {app.utils}
             */
            utils = null;
            /**
             * @type {Waves}
             */
            waves = null;
            /**
             * @type {User}
             */
            user = null;
            /**
             * @type {boolean}
             */
            canShowDex = null;
            /**
             * @type {gatewayService}
             */
            gatewayService = null;
            /**
             * @param {IPollCreate} createPoll
             */
            createPoll = null;
            /**
             * @type {boolean}
             */
            isSmart = false;
            /**
             * @type {boolean}
             * @private
             */
            _isMyAsset = false;
            /**
             * @type {Function}
             */
            changeLanguageHandler = () => this._onChangeLanguage();


            constructor() {
                super();
                this.ChartFactory = ChartFactory;
                this.$state = $state;
                this.$scope = $scope;
                this.i18n = i18n;
                this.modalManager = modalManager;
                this.$node = $element;
                this.node = $element.get(0);
                this.utils = utils;
                this.waves = waves;
                this.user = user;
                this.gatewayService = gatewayService;
                this.createPoll = createPoll;

                if (!PortfolioRow.templatePromise) {
                    PortfolioRow.templatePromise = $templateRequest(TEMPLATE_PATH)
                        .then((html) => Handlebars.compile(html));
                }

                this.chartOptions = {
                    charts: [
                        {
                            axisX: 'timestamp',
                            axisY: 'rate',
                            lineColor: 'rgba(90, 129, 234)',
                            fillColor: 'rgba(90, 129, 234, .3)'
                        }
                    ]
                };
            }

            $postLink() {
                this._isWaves = this.balance.asset.id === WavesApp.defaultAssets.WAVES;
                this._isMyAsset = this.balance.asset.sender === this.user.address;
                this.canShowDex = this._getCanShowDex();
                const canStopSponsored = this._getCanStopSponsored();

                Promise.all([
                    this.waves.node.getFeeList({ type: SIGN_TYPE.TRANSFER }),
                    PortfolioRow.templatePromise
                ]).then(([list, template]) => {

                    let balance = this.balance;

                    this.isSmart = balance.asset.hasScript;
                    const firstAssetChar = this.balance.asset.name.slice(0, 1);
                    const canPayFee = list.find(item => item.asset.id === this.balance.asset.id) && !this._isWaves;
                    const data = ds.dataManager.getOracleAssetData(this.balance.asset.id);
                    const logo = data && data.logo;
                    this.isVerifiedOrGateway = data && data.status >= STATUS_LIST.VERIFIED;

                    const html = template({
                        canSetAssetScript: this._isMyAsset && this.isSmart,
                        isSmart: this.isSmart,
                        isVerified: data && data.status === STATUS_LIST.VERIFIED,
                        isGateway: data && data.status === 3,
                        assetIconPath: logo || ASSET_IMAGES_MAP[this.balance.asset.id],
                        firstAssetChar,
                        canBurn: !this._isWaves,
                        canReissue: this._isMyAsset && this.balance.asset.reissuable,
                        charColor: this._getColor(),
                        assetName: this.balance.asset.name,
                        SELECTORS: { ...SELECTORS },
                        canShowDex: this.canShowDex,
                        canShowToggleSpam: this._canShowToggleSpam(),
                        canSponsored: this._isMyAsset,
                        canPayFee,
                        canStopSponsored,
                        isSpam: this.balance.isOnScamList
                    });

                    this.node.innerHTML = html;

                    Object.defineProperty(this, 'balance', {
                        get: () => balance,
                        set: (value) => {
                            if (this.balance.asset.id !== value.asset.id ||
                                !this.balance.available.getTokens().eq(value.available.getTokens()) ||
                                !this.balance.inOrders.getTokens().eq(value.inOrders.getTokens())
                            ) {
                                balance = value;
                                this._onUpdateBalance();
                            }
                            // TODO Optimize this
                            this._initSponsorShips();
                        }
                    });
                    /**
                     * @type {Poll}
                     * @private
                     */
                    this._poll = createPoll(this, this._initSponsorShips, angular.noop, 5000);
                    this._onUpdateBalance();
                    // this._initSponsorShips();
                    this._setHandlers();
                    this.changeLanguageHandler();
                });
            }

            $onDestroy() {
                i18next.off('languageChanged', this.changeLanguageHandler);
                this.$node.off();
            }

            /**
             * @private
             */
            _onChangeLanguage() {
                const nodeList = this.node.querySelectorAll('[w-i18n-literal]');

                Array.prototype.forEach.call(nodeList, element => {
                    element.innerHTML = this.i18n.translate(
                        element.getAttribute('w-i18n-literal'),
                        'app.wallet.portfolio');
                });
            }

            /**
             * @return {string}
             * @private
             */
            _getColor() {
                const sum = this.balance.asset.id.split('')
                    .slice(3)
                    .map(char => char.charCodeAt(0))
                    .reduce((acc, code) => acc + code, 0);
                return COLORS_LIST[sum % COLORS_LIST.length];
            }

            /**
             * @return {boolean}
             * @private
             */
            _getCanStopSponsored() {
                return this._isMyAsset && ds.utils.getTransferFeeList()
                    .find(item => item.asset.id === this.balance.asset.id);
            }

            /**
             * @return {boolean}
             * @private
             */
            _getCanShowDex() {
                const statusPath = ['assets', this.balance.asset.id, 'status'];

                return this.balance.isPinned ||
                    this._isMyAsset ||
                    this.balance.asset.isMyAsset ||
                    this.balance.asset.id === WavesApp.defaultAssets.WAVES ||
                    this.gatewayService.getPurchasableWithCards()[this.balance.asset.id] ||
                    this.gatewayService.getCryptocurrencies()[this.balance.asset.id] ||
                    this.gatewayService.getFiats()[this.balance.asset.id] ||
                    path(statusPath, ds.dataManager.getOracleData()) === STATUS_LIST.VERIFIED;

            }

            /**
             * @private
             */
            _onUpdateBalance() {
                this._updateBalances();
                this._initSpamState();

                const balance = this.balance;
                const baseAssetId = this.user.getSetting('baseAssetId');

                if (baseAssetId === balance.asset.id) {
                    const change24Node = this.node.querySelector(`.${SELECTORS.CHANGE_24}`);
                    change24Node.innerHTML = '—';
                    change24Node.classList.remove('minus');
                    change24Node.classList.remove('plus');
                    this.node.querySelector(`.${SELECTORS.EXCHANGE_RATE}`).innerHTML = '—';
                    this.node.querySelector(`.${SELECTORS.BASE_ASSET_BALANCE}`).innerHTML = '—';

                    return null;
                }

                this.waves.utils.getChange(balance.asset.id, baseAssetId)
                    .then(change24 => {
                        const change24Node = this.node.querySelector(`.${SELECTORS.CHANGE_24}`);
                        const isMoreZero = typeof change24 === 'number' ? change24 > 0 : change24.gt(0);
                        const isLessZero = typeof change24 === 'number' ? change24 < 0 : change24.lt(0);
                        change24Node.classList.toggle('minus', isLessZero);
                        change24Node.classList.toggle('plus', isMoreZero);
                        change24Node.innerHTML = `${change24.toFixed(2)}%`;
                    }, () => {
                        const change24Node = this.node.querySelector(`.${SELECTORS.CHANGE_24}`);
                        change24Node.innerHTML = '0.00%';
                    });

                this.waves.utils.getRate(balance.asset.id, baseAssetId)
                    .then(rate => {
                        const baseAssetBalance = balance.available.getTokens().times(rate).toFormat(2);

                        this.node.querySelector(`.${SELECTORS.EXCHANGE_RATE}`).innerHTML = rate.toFixed(2);
                        this.node.querySelector(`.${SELECTORS.BASE_ASSET_BALANCE}`).innerHTML = baseAssetBalance;
                    });

                const startDate = this.utils.moment().add().day(-7);
                this.waves.utils.getRateHistory(balance.asset.id, baseAssetId, startDate).then((values) => {
                    this.chart = new this.ChartFactory(
                        this.$node.find(`.${SELECTORS.CHART_CONTAINER}`),
                        this.chartOptions,
                        values
                    );
                }).catch(() => null);
            }

            /**
             * @private
             */
            _initActions() {
                let expanded = false;

                const $wrapper = this.$node.find('.actions-wrapper');

                const toggleExpanded = () => {
                    expanded = !expanded;
                    const conteiner = this.$node.find('.actions-container');
                    const conteinerNode = conteiner.get(0);
                    conteiner.toggleClass('expanded', expanded);

                    if (expanded) {
                        $(document).on('mousedown', _handler);
                        const dropDownPosition = conteinerNode.getBoundingClientRect();
                        const bodyPosition = document.body.getBoundingClientRect();
                        conteinerNode.classList.toggle('to-up', dropDownPosition.bottom > bodyPosition.bottom);
                        return;
                    }

                    $(document).off('mousedown', _handler);
                    conteinerNode.classList.remove('to-up');
                };

                const _handler = e => {
                    if ($(e.target).closest($wrapper).length === 0) {
                        toggleExpanded();
                    }
                };

                this.$node.find('.click-area').on('click', () => {
                    toggleExpanded();
                });

                this.$scope.$on('$destroy', () => {
                    $(document).off('mousedown', _handler);
                });
            }

            /**
             * @private
             */
            _setHandlers() {
                this._initActions();

                i18next.on('languageChanged', this.changeLanguageHandler);

                this.$node.on('click', `.${SELECTORS.BUTTONS.SEND}`, () => {
                    analytics.send({
                        name: 'Transfer Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showSendAsset({ assetId: this.balance.asset.id });
                });

                this.$node.on('click', `.${SELECTORS.BUTTONS.DEX}`, () => {
                    analytics.send({
                        name: 'Wallet Portfolio Open in DEX Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.$state.go('main.dex', this._getSrefParams(this.balance.asset));
                });

                this.$node.on('click', `.${SELECTORS.BUTTONS.RECEIVE}`, () => {
                    analytics.send({
                        name: 'Transfer Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showReceiveModal(this.user, this.balance.asset);
                });

                this.$node.on('click', `.${SELECTORS.BUTTONS.TOGGLE_SPAM}`, () => {
                    this.user.toggleSpamAsset(this.balance.asset.id);
                    this._initSpamState();
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.ASSET_INFO}`, () => {
                    this.modalManager.showAssetInfo(this.balance.asset);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.SEND}`, () => {
                    analytics.send({
                        name: 'Transfer Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showSendAsset({ assetId: this.balance.asset.id });
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.RECEIVE}`, () => {
                    analytics.send({
                        name: 'Transfer Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showReceiveModal(this.user, this.balance.asset);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.BURN}`, () => {
                    analytics.send({
                        name: 'Burn Token Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showBurnModal(this.balance.asset.id);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.REISSUE}`, () => {
                    analytics.send({
                        name: 'Reissue Token Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showReissueModal(this.balance.asset.id);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.DEX}`, () => {
                    analytics.send({
                        name: 'Wallet Portfolio Open in DEX Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.$state.go('main.dex', this._getSrefParams(this.balance.asset));
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.SPONSORSHIP_CREATE}`, () => {
                    analytics.send({
                        name: 'Enable Sponsorship Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showSponsorshipModal(this.balance.asset.id);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.SET_ASSET_SCRIPT}`, () => {
                    analytics.send({
                        name: 'Update Script Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showSetAssetScriptModal(this.balance.asset.id);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.SPONSORSHIP_EDIT}`, () => {
                    analytics.send({
                        name: 'Change Sponsorship Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showSponsorshipModal(this.balance.asset.id, true);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.SPONSORSHIP_STOP}`, () => {
                    analytics.send({
                        name: 'Disable Sponsorship Click',
                        params: { Currency: this.balance.asset.id },
                        target: 'ui'
                    });
                    this.modalManager.showSponsorshipStopModal(this.balance.asset.id);
                });

                this.$node.on('click', `.${SELECTORS.ACTION_BUTTONS.TOGGLE_SPAM}`, () => {
                    this.user.toggleSpamAsset(this.balance.asset.id);
                    this._initSpamState();
                });
            }

            /**
             * @private
             */
            _initSpamState() {
                if (!this._canShowToggleSpam()) {
                    return null;
                }

                const spam = this.user.getSetting('wallet.portfolio.spam') || [];
                const isSpam = spam.includes(this.balance.asset.id);

                const elements = [
                    this.node.querySelector(`.${SELECTORS.BUTTONS.TOGGLE_SPAM}`),
                    this.node.querySelector(`.${SELECTORS.ACTION_BUTTONS.TOGGLE_SPAM}`)
                ];

                elements.forEach(toggleSpam => {
                    toggleSpam.classList.toggle('icon-hide', !isSpam);
                    toggleSpam.classList.toggle('icon-show', isSpam);
                });
            }

            /**
             * @param list
             * @private
             */
            _initSponsorShips(list) {
                const canStopSponsored = !!this._getCanStopSponsored();
                const canSponsored = !!this._isMyAsset;
                const isSmart = this.isSmart;

                const btnCreate = this.node.querySelector(`.${SELECTORS.ACTION_BUTTONS.SPONSORSHIP_CREATE}`);
                const btnEdit = this.node.querySelector(`.${SELECTORS.ACTION_BUTTONS.SPONSORSHIP_EDIT}`);
                const btnStop = this.node.querySelector(`.${SELECTORS.ACTION_BUTTONS.SPONSORSHIP_STOP}`);
                const icon = this.node.querySelector(`.${SELECTORS.SPONSORED} .marker`);

                btnCreate.classList.toggle('hidden', isSmart || !(canSponsored && !canStopSponsored));
                btnEdit.classList.toggle('hidden', !(canSponsored && canStopSponsored));
                btnStop.classList.toggle('hidden', isSmart || !canStopSponsored);

                Promise.resolve(list || this.waves.node.getFeeList({ type: SIGN_TYPE.TRANSFER }))
                    .then((list) => {
                        const canPayFee = list.find(item => item.asset.id === this.balance.asset.id) && !this._isWaves;
                        icon.classList.toggle('sponsored-asset', !!canPayFee);
                    });
            }

            /**
             * @param {Asset} asset
             * @private
             */
            _getSrefParams(asset) {
                this.utils.openDex(asset.id);
            }

            /**
             * @private
             */
            _updateBalances() {
                const asset = this.balance.asset;
                const available = this.balance.available.getTokens();
                const inOrders = this.balance.inOrders.getTokens();
                const availableHtml = this.utils.getNiceNumberTemplate(available, asset.precision, true);
                const inOrdersHtml = this.utils.getNiceNumberTemplate(inOrders, asset.precision);
                this.node.querySelector(`.${SELECTORS.AVAILABLE}`).innerHTML = availableHtml;
                this.node.querySelector(`.${SELECTORS.IN_ORDERS}`).innerHTML = inOrdersHtml;
            }

            /**
             * @returns {boolean}
             * @private
             */
            _canShowToggleSpam() {
                if (this._isMyAsset) {
                    return false;
                }

                return !this.isVerifiedOrGateway && !this.user.scam[this.balance.asset.id];
            }

        }

        return new PortfolioRow($templateRequest,
            $element,
            utils,
            waves,
            user,
            modalManager,
            $state,
            ChartFactory,
            i18n,
            $scope,
            gatewayService,
            createPoll);
    };

    controller.$inject = [
        'Base',
        '$templateRequest',
        '$element',
        'utils',
        'waves',
        'user',
        'modalManager',
        '$state',
        'ChartFactory',
        'i18n',
        '$scope',
        'gatewayService',
        'createPoll'];

    angular.module('app.wallet.portfolio').component('wPortfolioRow', {
        controller,
        bindings: {
            balance: '<',
            canShowDex: '<'
        },
        scope: false
    });

})();
