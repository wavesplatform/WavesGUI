import { IAssetPair, IHash } from '../interface';
import { WAVES_ID } from '@waves/waves-signature-generator';
import { BigNumber, Asset } from '@waves/data-entities';
import { get } from '../api/assets/assets';


export function normalizeAssetPair(assetPair: IAssetPair): IAssetPair {
    const priceAsset = assetPair.priceAsset || WAVES_ID;
    const amountAsset = assetPair.amountAsset || WAVES_ID;
    return { priceAsset, amountAsset };
}

export function normalizeUrl(url: string): string {
    const urlObject = new URL(url);
    const parts = [
        urlObject.host,
        urlObject.pathname,
        urlObject.search,
        urlObject.hash
    ].map((item) => item.replace(/\/\//, '/'));
    return `${urlObject.protocol}//${parts.join('')}`;
}

export function normalizeAssetId(assetId: string | void) {
    return assetId || WAVES_ID;
}

export function toHash<T, K extends keyof T>(list: Array<T>, property: K): IHash<T> {
    return list.reduce((result, item) => {
        result[item[property]] = item;
        return result;
    }, Object.create(null));
}

export function proxyArrayArgs(cb) {
    return function (args) {
        return cb.apply(this, args);
    };
}

export function addParam<T, K, R>(cb: (data: T, param: K) => R, param: K): (data: T) => R {
    return (data: T) => cb(data, param);
}

export function isPromise(some: any): some is Promise<any> {
    return typeof some.then === 'function' && typeof some.catch === 'function';
}

export function toArray<T>(some: T | Array<T>): Array<T> {
    if (Array.isArray(some)) {
        return some;
    } else {
        return [some];
    }
}

export type TTimeType = 'day' | 'hour' | 'minute' | 'second'

export function addTime(date: Date, count: number, timeType: TTimeType) {
    return new Date(date.valueOf() + getTime(count, timeType).valueOf());
}

export function getTime(count, timeType: TTimeType): Date {
    switch (timeType) {
        case 'second':
            return new Date(count * 1000);
        case 'minute':
            return getTime(60 * count, 'second');
        case 'hour':
            return getTime(60 * count, 'minute');
        case 'day':
            return getTime(24 * count, 'hour');
    }
}

export type TFunctionWithArgsList<T, R> = (...args: Array<T>) => R;
export type TCurryFunc<T, R> = (...args: Array<T>) => (R | TCurryFunc<T, R>);

export function curryN<T, R>(deep: number, cb: TFunctionWithArgsList<T, R>): TCurryFunc<T, R> {
    return (...args: Array<T>) => getCurryCallback(deep, [], cb)(...args);
}

export function curry<T, R>(cb: TFunctionWithArgsList<T, R>): TCurryFunc<T, R> {
    return curryN(cb.length, cb);
}

function getCurryCallback<T, R>(deep: number, args1: Array<T>, cb: TFunctionWithArgsList<T, R>): TCurryFunc<T, R> {
    return (...args2: Array<T>) => {
        const args3 = args1.concat(args2);
        if (args3.length >= deep) {
            return cb.call(null, ...args3);
        } else {
            return getCurryCallback(deep, args3, cb);
        }
    };
}

export function toBigNumber(some: string | number | BigNumber): BigNumber {
    return some instanceof BigNumber ? some : new BigNumber(some);
}

export function toAsset(asset: Asset | string): Promise<Asset> {
    return typeof asset === 'string' ? get(asset) : Promise.resolve(asset);
}
