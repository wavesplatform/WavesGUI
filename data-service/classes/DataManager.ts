import { Money } from '@waves/data-entities';
import { path } from 'ramda';
import { IPollAPI, Poll } from '../utils/Poll';
import { balanceList } from '../api/assets/assets';
import { getReservedBalance } from '../api/matcher/getOrders';
import { IBalanceItem } from '../api/assets/interface';
import { IHash } from '../interface';
import { UTXManager } from './UTXManager';
import { getAliasesByAddress } from '../api/aliases/aliases';
import { PollControl } from './PollControl';
import { change, get } from '../config';
import { getOracleData, IOracleData } from '../api/data';
import { DATA_PROVIDER_VERSIONS, STATUS_LIST, TProviderAsset } from '@waves/oracle-data';


export class DataManager {

    public transactions: UTXManager = new UTXManager();
    public pollControl: PollControl<TPollHash>;
    private _address: string;
    private _silentMode: boolean = false;

    constructor() {
        this.pollControl = new PollControl<TPollHash>(() => this._createPolls());
    }

    public setSilentMode(silent: boolean): void {
        this._silentMode = silent;
        if (silent) {
            this.pollControl.pause();
        } else {
            this.pollControl.play();
        }
    }

    public applyAddress(address: string): void {
        this._address = address;
        this.pollControl.create();
        this.transactions.applyAddress(this._address);
    }

    public dropAddress() {
        this.pollControl.destroy();
        this.transactions.dropAddress();
    }

    public getBalances(): Promise<Array<IBalanceItem>> {
        return this.pollControl.getPollHash().balance.getDataPromise();
    }

    public getReservedInOrders(): Promise<IHash<Money>> {
        return this.pollControl.getPollHash().orders.getDataPromise();
    }

    public getAliasesPromise(): Promise<Array<string>> {
        return this.pollControl.getPollHash().aliases.getDataPromise();
    }

    public getLastAliases(): Array<string> {
        return this.pollControl.getPollHash().aliases.lastData || [];
    }

    public getOracleAssetData(id: string, oracleName: string = 'oracleWaves'): TProviderAsset & { provider: string } {
        let pollHash = this.pollControl.getPollHash();
        const lastData = <any>path([oracleName, 'lastData'], pollHash);
        const assets = lastData && lastData.assets || Object.create(null);
        const WavesApp = (window as any).WavesApp;

        const gateways = {
            [WavesApp.defaultAssets.USD]: true,
            [WavesApp.defaultAssets.EUR]: true,
            [WavesApp.defaultAssets.TRY]: true,
            [WavesApp.defaultAssets.BTC]: true,
            [WavesApp.defaultAssets.ETH]: true,
            [WavesApp.defaultAssets.LTC]: true,
            [WavesApp.defaultAssets.ZEC]: true,
            [WavesApp.defaultAssets.BCH]: true,
            [WavesApp.defaultAssets.BSV]: true,
            [WavesApp.defaultAssets.DASH]: true,
            [WavesApp.defaultAssets.XMR]: true,
        };

        const descriptionHash = {
            WAVES: { en: 'Waves is a blockchain ecosystem that offers comprehensive and effective blockchain-based tools for businesses, individuals and developers. Waves Platform offers unprecedented throughput and flexibility. Features include the LPoS consensus algorithm, Waves-NG protocol and advanced smart contract functionality.' }
        };

        const gatewayAsset = {
            status: 3,
            version: DATA_PROVIDER_VERSIONS.BETA,
            id,
            provider: 'WavesPlatform',
            ticker: null,
            link: null,
            email: null,
            logo: null,
            description: descriptionHash[id]
        };

        if (id === 'WAVES' && oracleName === 'oracleWaves') {
            return { status: STATUS_LIST.VERIFIED, description: descriptionHash.WAVES } as any;
        }

        if (gateways[id]) {
            return gatewayAsset;
        }

        return assets[id] ? { ...assets[id], provider: lastData.oracle.name } : null;
    }

    public getOracleData(oracleName: string) {
        return this.pollControl.getPollHash()[oracleName].lastData;
    }

    private _getPollBalanceApi(): IPollAPI<Array<IBalanceItem>> {
        const get = () => {
            const hash = this.pollControl.getPollHash();
            const inOrdersHash = hash && hash.orders.lastData || Object.create(null);
            return balanceList(this._address, Object.create(null), inOrdersHash);
        };
        return { get, set: () => null };
    }

    private _getPollOrdersApi(): IPollAPI<IHash<Money>> {
        return {
            get: () => getReservedBalance(),
            set: () => null
        };
    }

    private _getPollAliasesApi(): IPollAPI<Array<string>> {
        return {
            get: () => getAliasesByAddress(this._address),
            set: () => null
        };
    }

    private _getPollOracleApi(address: string): IPollAPI<IOracleData> {
        return {
            get: () => {
                return address ? getOracleData(address) : Promise.resolve({ assets: Object.create(null) }) as any;
            },
            set: () => null
        };
    }

    private _createPolls(): TPollHash {
        const balance = new Poll(this._getPollBalanceApi(), 1000);
        const orders = new Poll(this._getPollOrdersApi(), 1000);
        const aliases = new Poll(this._getPollAliasesApi(), 10000);
        const oracleWaves = new Poll(this._getPollOracleApi(get('oracleWaves')), 30000);
        const oracleTokenomica = new Poll(this._getPollOracleApi(get('oracleTokenomica')), 30000);

        change.on((key) => {
            if (key === 'oracleWaves') {
                oracleWaves.restart();
            }
        });

        return { balance, orders, aliases, oracleWaves, oracleTokenomica };
    }

}

type TPollHash = {
    balance: Poll<Array<IBalanceItem>>;
    orders: Poll<IHash<Money>>;
    aliases: Poll<Array<string>>;
    oracleWaves: Poll<IOracleData>
    oracleTokenomica: Poll<IOracleData>
}

export interface IOracleAsset {
    id: string;
    status: number; // TODO! Add enum
    logo: string;
    site: string;
    ticker: string;
    email: string;
    description?: Record<string, string>;
}
