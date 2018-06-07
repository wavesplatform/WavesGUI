import DataServiceClient from '@waves/data-service-client-js';
import * as create from 'parse-json-bignumber';
import { IHash } from './interface';


const config: IConfigParams = Object.create(null);
let dataService = null;

export const parse = create();

export function get<K extends keyof IConfigParams>(key: K): IConfigParams[K] {
    return config[key];
}

export function set<K extends keyof IConfigParams>(key: K, value: IConfigParams[K]): void {
    config[key] = value;
    if (key === 'dsApi') {
        dataService = new DataServiceClient({ rootUrl: config.dsApi, parse });
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
    dsApi: string;
    coinomat: string;
    datafeed: string;
    support: string;
    nodeList: string;
    assets: IHash<string>;
    minimalSeedLength: number;
    remappedAssetNames: IHash<string>;
}
