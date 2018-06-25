import { WAVES_ID } from '@waves/waves-signature-generator';
import { Asset, AssetPair, BigNumber, Money, OrderPrice } from '@waves/data-entities';
import { IHash, IMoneyFactory, IPriceMoneyFactory } from '../../interface';
import { coinsMoneyFactory, normalizeAssetId, normalizeTime, priceMoneyFactory, toHash } from '../../utils/utils';
import { Signal } from 'ts-utils';
import { request } from '../../utils/request';
import { get as configGet } from '../../config';
import { get as getAsset } from '../assets/assets';
import { api, IOrder } from './interface';


let signatureData: ISignatureData;
let timer = null;

export const factory = {
    price: priceMoneyFactory,
    money: coinsMoneyFactory
};

export const remapOrder = (factory: IFactory) => (assets: IHash<Asset>) => (order: api.IOrder): IOrder => {
    const amountAsset = assets[normalizeAssetId(order.assetPair.amountAsset)];
    const priceAsset = assets[normalizeAssetId(order.assetPair.priceAsset)];
    const assetPair = new AssetPair(amountAsset, priceAsset);
    const amount = factory.money(order.amount, amountAsset);
    const price = factory.price(order.price, assetPair);
    const filled = factory.money(order.filled, amountAsset);
    const total = Money.fromTokens(amount.getTokens().times(price.getTokens()), priceAsset);
    const progress = filled.getTokens().div(amount.getTokens()).toNumber();
    const timestamp = new Date(order.timestamp);
    const isActive = order.status === 'Accepted' || order.status === 'PartiallyFilled';
    return { ...order, amount, price, filled, assetPair, progress, timestamp, isActive, total };
};

export const matcherOrderRemap = remapOrder(factory);

export function addSignature(signature: string, publicKey: string, timestamp: number): void {
    addTimer({
        timestamp: normalizeTime(timestamp),
        signature,
        publicKey
    });
}

export function hasSignature(): boolean {
    return !!signatureData;
}

export function clearSignature() {
    signatureData = null;
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}

export const signatureTimeout: Signal<{}> = new Signal();

const fetch = (url: string): Promise<Array<api.IOrder>> => {
    return request<Array<api.IOrder>>({
        url: `${configGet('matcher')}/${url}`,
        fetchOptions: {
            headers: {
                Timestamp: signatureData.timestamp,
                Signature: signatureData.signature
            }
        }
    });
};

const parse = (list) => {
    const assets = getAssetsFromOrderList(list);
    return getAsset(assets).then((assets) => {
        const hash = toHash(assets, 'id');
        return list.map((order) => matcherOrderRemap(hash)(order));
    });
};


export function getOrders(): Promise<Array<IOrder>> {
    if (!signatureData) {
        throw new Error('Get orders without signature! Call method "addSignature"!');
    }
    return fetch(`orderbook/${signatureData.publicKey}`)
        .then(parse);
}

export function getOrdersByPair(pair: AssetPair): Promise<Array<IOrder>> {
    if (!signatureData) {
        throw new Error('Get orders without signature! Call method "addSignature"!');
    }
    return fetch(`orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/publicKey/${signatureData.publicKey}`)
        .then(parse);
}

function getAssetsFromOrderList(orders: Array<api.IOrder>): Array<string> {
    const hash = Object.create(null);
    hash[WAVES_ID] = true;
    return Object.keys(orders.reduce(getAssetsFromOrder, hash));
}

function getAssetsFromOrder(assets: IHash<boolean>, order: api.IOrder) {
    assets[normalizeAssetId(order.assetPair.amountAsset)] = true;
    assets[normalizeAssetId(order.assetPair.priceAsset)] = true;
    return assets;
}

function addTimer(sign: ISignatureData): void {
    clearSignature();
    timer = setTimeout(() => {
        signatureData = null;
        signatureTimeout.dispatch({});
    }, sign.timestamp - Date.now());
    signatureData = sign;
}

export interface IFactory {
    price: IPriceMoneyFactory;
    money: IMoneyFactory;
}

interface ISignatureData {
    publicKey: string;
    timestamp: number;
    signature: string;
}
