import {fetch} from '../'
import {Signal, getPaths, get, clone} from 'ts-utils';
import {BigNumber} from '@waves/bignumber';


interface IFeeItem<T> {
    add_smart_asset_fee: boolean;
    add_smart_account_fee: boolean;
    min_price_step: T | BigNumber;
    fee: T | BigNumber;
}

interface IFeeConfig<T> {
    smart_asset_extra_fee: T | BigNumber;
    smart_account_extra_fee: T | BigNumber;
    calculate_fee_rules: Record<number, Partial<IFeeItem<T>> & { default: IFeeItem<T> }>;
}

interface IConfig {
    PERMISSIONS: Record<any, any>;
    SETTINGS: Record<any, any> & { DEX: Record<any, any> & { WATCH_LIST_PAIRS: Array<string> } } & {};
    SERVICE_TEMPORARILY_UNAVAILABLE: boolean;
}

export class ConfigService {

    protected config = Object.create(null) as IConfig;

    protected feeConfig = Object.create(null) as IFeeItem<BigNumber>;

    protected wavesApp: any;

    protected static _instance: ConfigService | void;

    public change = new Signal() as Signal<string>;

    public configReady: Promise<any>;

    constructor(wavesApp: any) {
        if (ConfigService._instance) {
            return ConfigService._instance;
        }
        ConfigService._instance = this;
        this.wavesApp = wavesApp;
        this.configReady = this.fetchConfig();
    }

    public getConfig(path: string) {
        const config = path ? get(this.config, path) : this.config;
        return clone(config);
    }

    public getFeeConfig() {
        return clone(this.feeConfig);
    }

    public fetchConfig(): Promise<any> {
        return Promise.all([
            this._getConfig().then(config => this._setConfig(config)),
            this._getFeeConfig().then(config => this._setFeeConfig(config))
        ]);
    }

    protected _getConfig(): Promise<IConfig> {
        return fetch(this.wavesApp.network.featuresConfigUrl)
            .then(data => {
                if (typeof data === 'string') {
                    return JSON.parse(data);
                }
                return data;
            })
            .catch(() => Promise.resolve(this.wavesApp.network.featuresConfig));
    }

    protected _getFeeConfig(): Promise<IFeeConfig<BigNumber>> {
        return fetch(this.wavesApp.network.feeConfigUrl)
            .then(this.wavesApp.parseJSON)
            .then(ConfigService.parseFeeConfig)
            .catch(() => Promise.resolve(this.wavesApp.network.feeConfig));
    }

    protected _setFeeConfig(config) {
        this.feeConfig = config;
    }

    protected _setConfig(config) {
        const myConfig = this.config;
        this.config = config;

        ConfigService.getDifferencePaths(myConfig, config)
            .forEach(path => this.change.dispatch(String(path)));
    }

    protected static getDifferencePaths(previous, next) {
        const paths = getPaths(next);
        return paths
            .filter(path => get(previous, path) !== get(next, path))
            .map(String);
    }

    protected static parseFeeConfig(data) {
        switch (typeof data) {
            case 'number':
            case 'string':
                return new BigNumber(data);
            case 'object':
                Object.entries(data).forEach(([key, value]) => {
                    data[key] = ConfigService.parseFeeConfig(value);
                });
                return data;
            default:
                return data;
        }
    }
}
