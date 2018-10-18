import DataServiceClient from '@waves/data-service-client-js';
import { IHash } from './interface';
import { time } from './api/node/node';
import { request } from './utils/request';
import { MAINNET_DATA } from '@waves/assets-pairs-order';


const config: IConfigParams = Object.create(null);
let dataService = null;

export let timeDiff = 0;
export let matcherSettingsPromise: Promise<Array<string>> = Promise.resolve(MAINNET_DATA);

export const parse = str => (window as any).WavesApp.parseJSON(str);

export function get<K extends keyof IConfigParams>(key: K): IConfigParams[K] {
    return config[key];
}

export function set<K extends keyof IConfigParams>(key: K, value: IConfigParams[K]): void {
    config[key] = value;
    if (key === 'node') {
        time().then((serverTime) => {
            const now = Date.now();
            const dif = now - serverTime.getTime();

            if (Math.abs(dif) > 1000 * 30) {
                timeDiff = dif;
            } else {
                timeDiff = 0;
            }
        });
    }
    if (key === 'matcher') {
        matcherSettingsPromise = request<any>({
            url: `${value}/settings`
        }).then(data => data.priceAssets);
    }
    if (key === 'api' || key === 'apiVersion') {
        if (config.api && config.apiVersion) {
            dataService = new DataServiceClient({ rootUrl: `${config.api}/${config.apiVersion}`, parse });
        }
    }
}

export function setConfig(props: Partial<IConfigParams>): void {
    Object.keys(props).forEach((key: keyof IConfigParams) => {
        set(key, props[key]);
    });
}

export function getDataService(): DataServiceClient {
    return dataService;
}

export interface IConfigParams {
    code: string;
    node: string;
    matcher: string;
    api: string;
    apiVersion: string;
    coinomat: string;
    support: string;
    nodeList: string;
    assets: IHash<string>;
    minimalSeedLength: number;
    remappedAssetNames: IHash<string>;
}
