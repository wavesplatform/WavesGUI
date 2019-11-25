import { path } from 'ramda';
import { IPollAPI, Poll } from '../utils/Poll';
import { UTXManager } from './UTXManager';
import { getAliasesByAddress } from '../api/aliases/aliases';
import { PollControl } from './PollControl';
import { change } from '../config';
import { DATA_PROVIDER_VERSIONS, STATUS_LIST, TProviderAsset } from '@waves/oracle-data';


export class DataManager {

    public transactions: UTXManager = new UTXManager();
    public pollControl: PollControl<TPollHash>;
    private _address: string;
    private _silentMode: boolean = false;

    constructor() {
        this.pollControl = new PollControl<TPollHash>(() => this._createPolls());
        change.on((key) => {
            if (key === 'oracleWaves' && !this._silentMode) {
                this.pollControl.restart('oracleWaves');
            }
        });
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
        this.dropAddress();
        this._address = address;
        this.pollControl.create();
        this.transactions.applyAddress(this._address);
    }

    public dropAddress() {
        this._address = undefined;
        this.pollControl.destroy();
        this.transactions.dropAddress();
    }
    
    public getAliasesPromise(): Promise<Array<string>> {
        return this.pollControl.getPollHash().aliases.getDataPromise();
    }

    public getLastAliases(): Array<string> {
        return this.pollControl.getPollHash().aliases.lastData || [];
    }

    public getOracleAssetDataByOracleName(id: string, oracleName: string = 'oracleWaves'): TProviderAsset & { provider: string } {
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
            [WavesApp.defaultAssets.WEST]: true,
            [WavesApp.defaultAssets.ERGO]: true,
            [WavesApp.defaultAssets.BNT]: true,
        };

        const gatewaysSoon = (window as any).angular
            .element(document.body).injector().get('configService').get('GATEWAYS_SOON') || [];

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

        const gatewaySoonAsset = {
            ...gatewayAsset,
            status: 4
        };

        if (id === 'WAVES') {
            return { status: STATUS_LIST.VERIFIED, description: descriptionHash.WAVES } as any;
        }

        if (gatewaysSoon.indexOf(id) > -1) {
            return gatewaySoonAsset;
        }

        if (gateways[id]) {
            return gatewayAsset;
        }

        return assets[id] ? { ...assets[id], provider: lastData.oracle.name } : null;
    }

    public getOraclesAssetData (id: string) {
        const dataOracleWaves = this.getOracleAssetDataByOracleName(id, 'oracleWaves');
        const dataOracleTokenomica = this.getOracleAssetDataByOracleName(id, 'oracleTokenomica');
        return dataOracleWaves || dataOracleTokenomica;
    }

    public getOracleData(oracleName: string) {
        return this.pollControl.getPollHash()[oracleName].lastData;
    }

    private _getPollAliasesApi(): IPollAPI<Array<string>> {
        return {
            get: () => getAliasesByAddress(this._address),
            set: () => null
        };
    }

    private _createPolls(): TPollHash {
        const aliases = new Poll(this._getPollAliasesApi(), 10000);
        return { aliases };
    }

}

type TPollHash = {
    aliases: Poll<Array<string>>;
}
