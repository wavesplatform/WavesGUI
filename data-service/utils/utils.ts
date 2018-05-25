import { IAssetPair, IHash } from '../interface';
import { WAVES_ID } from '@waves/waves-signature-generator';


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
