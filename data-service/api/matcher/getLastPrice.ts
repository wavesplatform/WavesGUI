import { AssetPair, Money } from '@waves/data-entities';
import { request } from '../../utils/request';
import { get } from '../../config';


export function getLastPrice(pair: AssetPair) {
    return request({
        url: `${get('matcher')}/orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/status`
    }).then(({ lastPrice, lastSide }) => ({ price: new Money(lastPrice, pair.priceAsset), lastSide }));
}