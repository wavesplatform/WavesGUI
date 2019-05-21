import { Asset, AssetPair,  Money } from '@waves/data-entities';
import { BigNumber } from '@waves/bignumber';

export interface IHash<T> {
    [key: string]: T;
}


export interface IAssetPair {
    amountAsset: string;
    priceAsset: string;
}

export interface IKeyPair {
    publicKey: string;
    privateKey: string;
}

export type TOrderType = 'buy' | 'sell';
export type TLeasingStatus = 'active' | 'canceled'

export type TBigNumberData = string | number | BigNumber;
export type TAssetData = Asset | string;

export interface IMoneyFactory {
    (data: string | number | BigNumber, asset: Asset): Money;
}

export interface IPriceMoneyFactory {
    (data: string | number | BigNumber, pair: AssetPair): Money;
}
