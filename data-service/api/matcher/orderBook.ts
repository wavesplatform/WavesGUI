import { get as getConfig } from '../../config';
import { get as getAssetPair } from '../pairs/pairs';
import { addParam } from '../../utils/utils';
import { AssetPair, Money, OrderPrice, BigNumber } from '@waves/data-entities';
import { request } from '../../utils/request';


export function get(asset1: string, asset2: string): Promise<IOrderBook> {
    const timeout = new Promise<IOrderBook>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout!')), 3000);
    });

    const promise = getAssetPair(asset1, asset2)
        .then((pair) => {
            return request({ url: `${getConfig('matcher')}/orderbook/${pair.toString()}` })
                .then(addParam(remapOrderBook, pair));
        });

    return Promise.race([promise, timeout]);
}

function remapOrderBook(orderBook, pair: AssetPair): IOrderBook {
    const remap = remapOrder(pair);
    return {
        pair,
        bids: orderBook.bids.map(remap),
        asks: orderBook.asks.map(remap)
    };
}

const remapOrder = (pair: AssetPair) => (order: IApiOrder): IOrder => ({
    amount: new Money(order.amount, pair.amountAsset),
    price: Money.fromTokens(OrderPrice.fromMatcherCoins(new BigNumber(order.price), pair).getTokens(), pair.priceAsset)
});

export interface IOrderBook {
    pair: AssetPair;
    bids: Array<IOrder>;
    asks: Array<IOrder>;
}

export interface IOrder {
    amount: Money;
    price: Money;
}

interface IApiOrder {
    amount: string;
    price: string;
}
