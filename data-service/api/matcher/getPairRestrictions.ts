import { AssetPair } from '@waves/data-entities';
import { request } from '../../utils/request';
import { get } from '../../config';



export function getPairRestrictions(pair: AssetPair) {
    return request({
        url: `${get('matcher')}/orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/info`
    }).catch(e => console.log(e.message));
}
