import { request } from '../../utils/request';
import { get } from '../../config';
import { getProviderAssets, getProviderData, RESPONSE_STATUSES } from '@waves/oracle-data';
import { TDataTxField, IProviderData, TProviderAsset } from '@waves/oracle-data/src/interface';
import { indexBy, prop } from 'ramda';


export function getDataFields(address: string): Promise<Array<TDataTxField>> {
    return request({ url: `${get('node')}/addresses/data/${address}` });
}

export function getOracleData(address: string): Promise<IOracleData | null> {
    return getDataFields(address).then(fields => {
        const oracle = getProviderData(fields);
        if (oracle.status === RESPONSE_STATUSES.ERROR) {
            return null;
        }

        const assets = getProviderAssets(fields)
            .filter(item => item.status === RESPONSE_STATUSES.OK)
            .map(item => item.content) as Array<TProviderAsset>;

        return {
            oracle: oracle.content,
            assets: indexBy<TProviderAsset>(prop('id'), assets)
        };
    });
}

export interface IOracleData {
    oracle: IProviderData;
    assets: Record<string, TProviderAsset>;
}
