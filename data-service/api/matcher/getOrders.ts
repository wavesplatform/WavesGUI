import { WAVES_ID } from '@waves/signature-generator';
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
        timestamp: timestamp,
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

const fetch = <T>(url: string): Promise<T> => {
    return request<T>({
        url: `${configGet('matcher')}/${url}`,
        fetchOptions: {
            headers: {
                Timestamp: signatureData.timestamp,
                Signature: signatureData.signature
            }
        }
    });
};

export const parse = (list) => {
    const assets = getAssetsFromOrderList(list);
    return getAsset(assets).then((assets) => {
        const hash = toHash(assets, 'id');
        return list.map((order) => matcherOrderRemap(hash)(order));
    });
};

export function getOrders(options?: IGetOrdersOptions): Promise<Array<IOrder>> {
    if (!signatureData) {
        throw new Error('Get orders without signature! Call method "addSignature"!');
    }

    options = options ? options : { isActive: true };
    const activeOnly = options.isActive;

    return fetch<Array<api.IOrder>>(`orderbook/${signatureData.publicKey}?activeOnly=${activeOnly}`)
        .then(parse);
}

export function getOrdersByPair(pair: AssetPair): Promise<Array<IOrder>> {
    if (!signatureData) {
        throw new Error('Get orders without signature! Call method "addSignature"!');
    }
    return fetch<Array<api.IOrder>>(`orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/publicKey/${signatureData.publicKey}`)
        .then(parse);
}

export function getReservedBalance(): Promise<IHash<Money>> {
    if (!signatureData) {
        throw new Error('Get orders without signature! Call method "addSignature"!');
    }
    return fetch<IReservedBalanceApi>(`/balance/reserved/${signatureData.publicKey}`)
        .then(prepareReservedBalance);
}

export function prepareReservedBalance(data: IReservedBalanceApi): Promise<IHash<Money>> {
    const assetIdList = Object.keys(data);
    return getAsset(assetIdList)
        .then(assets => {
            return assets.reduce((acc, asset) => {
                const count = data[asset.id];
                acc[asset.id] = new Money(count, asset);
                return acc;
            }, Object.create(null));
        });
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

interface IGetOrdersOptions {
    isActive?: boolean;
}

export interface IReservedBalanceApi {
    [key: string]: string | number;
}
