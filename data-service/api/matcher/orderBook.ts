import { get as getAsset } from '../assets/assets';
import { get as getConfig } from '../../config';
import { addParam } from '../../utils/utils';
import { createOrderPair, MAINNET_DATA } from '@waves/assets-pairs-order';
import { AssetPair, BigNumber } from '@waves/data-entities';
import { request } from '../../utils/request';


export function get(asset1: string, asset2: string): Promise<IOrderBook> {
    const pair = createOrderPair(MAINNET_DATA, asset1, asset2);
    return getAsset(pair)
        .then(([amount, price]) => new AssetPair(amount, price))
        .then((pair) => {
            return request({ url: `${getConfig('matcher')}/orderbook/${pair.toString()}` })
                .then(addParam(remapOrderBook, pair));
        });

}

function remapOrderBook(orderBook, pair: AssetPair): IOrderBook {
    return {
        pair,
        bids: orderBook.bids.map(remapOrder),
        asks: orderBook.asks.map(remapOrder)
    };
}

function remapOrder(order) {
    return {
        amount: new BigNumber(order.amount),
        price: new BigNumber(order.price)
    };
}

export interface IOrderBook {
    pair: AssetPair;
    bids: Array<IOrder>;
    asks: Array<IOrder>;
}

export interface IOrder {
    amount: BigNumber;
    price: BigNumber;
}
