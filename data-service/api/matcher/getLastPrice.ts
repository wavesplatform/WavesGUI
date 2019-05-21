import { AssetPair, Money,  OrderPrice } from '@waves/data-entities';
import { BigNumber } from '@waves/bignumber';
import { request } from '../../utils/request';
import { get } from '../../config';



export function getLastPrice(pair: AssetPair) {
    return request({
        url: `${get('matcher')}/orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/status`
    }).then(({ lastPrice, lastSide }) => {
        const orderPrice = (new OrderPrice(new BigNumber(lastPrice), pair)).getTokens();
        const price = (new Money(0, pair.priceAsset)).cloneWithTokens(orderPrice);
        return { price, lastSide };
    });
}
