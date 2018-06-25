import DataServiceClient from '@waves/data-service-client-js';
import * as create from 'parse-json-bignumber';
import { IHash } from './interface';
import { time } from './api/node/node';


const config: IConfigParams = Object.create(null);
let dataService = null;

export let timeDiff = 0;

export const parse = create();

export function get<K extends keyof IConfigParams>(key: K): IConfigParams[K] {
    return config[key];
}

export function set<K extends keyof IConfigParams>(key: K, value: IConfigParams[K]): void {
    config[key] = value;
    if (key === 'node') {
        time().then((serverTime) => {
            const now = Date.now();
            const dif = now - serverTime.getTime();

            if (Math.abs(dif) > 1000 * 60 * 10) {
                timeDiff = dif;
            } else {
                timeDiff = 0;
            }
        });
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
