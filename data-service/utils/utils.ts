import {IAssetPair, IHash} from '../interface';
import {WAVES_ID} from '@waves/signature-adapter';
import {Asset, Money, AssetPair, OrderPrice} from '@waves/data-entities';
import {BigNumber} from '@waves/bignumber';
import {get} from '../api/assets/assets';
import {get as configGet, timeDiff} from '../config';

export * from './ConfigService';

export function normalizeTime(time: number): number;
export function normalizeTime(time: Date): Date;
export function normalizeTime(time: number | Date): number | Date {
    if (typeof time === 'number') {
        return time - timeDiff;
    } else {
        return new Date(time.getTime() - timeDiff);
    }
}

export function normalizeRecipient(recipient: string): string {
    return recipient.replace(`alias:${configGet('code')}:`, '');
}

export function coinsMoneyFactory(money: string | number | BigNumber, asset: Asset): Money {
    return new Money(money, asset);
}

export function tokensMoneyFactory(money: string | number | BigNumber, asset: Asset): Money {
    return Money.fromTokens(money, asset);
}

export function priceMoneyFactory(money: string | number | BigNumber, pair: AssetPair): Money {
    return Money.fromTokens(OrderPrice.fromMatcherCoins(money, pair).getTokens(), pair.priceAsset);
}

export function normalizeAssetPair(assetPair: IAssetPair): IAssetPair {
    const priceAsset = normalizeAssetId(assetPair.priceAsset);
    const amountAsset = normalizeAssetId(assetPair.amountAsset);
    return {priceAsset, amountAsset};
}

export function normalizeUrl(url: string): string {
    const urlObject = new URL(url, document.location.origin);
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

export function idToNode(id: string): string {
    return id === WAVES_ID ? '' : id;
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

export function dateTime(time: Date | number): number {
    if (typeof time === 'number') {
        return time;
    }

    return time.getTime();
}

export function addTime(date: Date | number, count: number, timeType: TTimeType) {
    return new Date(dateTime(date) + getTime(count, timeType).getTime());
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

export type TDefer<T> = {
    resolve: (data: T) => any;
    reject: (data: any) => any;
    promise: Promise<T>;
}

export function defer<T>(): TDefer<T> {
    let resolve, reject;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {resolve, reject, promise};
}

export function stringifyJSON(data: any): string {
    return (window as any).WavesApp.stringifyJSON(data);
}


export interface ITramsferFee {
    balance: Money;
    fee: Money;
    isMy: boolean;
}

const transferFeeList: Array<ITramsferFee> = [];

export function clearTransferFee() {
    transferFeeList.splice(0, transferFeeList.length);
}

export function setTransferFeeItem(item: ITramsferFee) {
    transferFeeList.push(item);
}

export function getTransferFeeList() {
    return transferFeeList
        .filter(item => item.balance.getTokens().gt(1.005) || item.isMy)
        .map(item => item.fee);
}

export const delay = (timeout: number) => new Promise(resolve => setTimeout(resolve, timeout));

export const isNativeFunction = (function () {
    const toString = Object.prototype.toString;

    // Используется для разложения на составляющие декомпилированного
    // исходного кода функции
    const fnToString = Function.prototype.toString;

    // Используется для определения конструкторов среды (Safari > 4;
    // по сути, предназначено специально для типизированных массивов)
    const reHostCtor = /^\[object .+?Constructor\]$/;

    // Составление регулярного выражения на основе часто употребляемого
    // нативного метода в качестве шаблона.
    // Выбираем `Object#toString`, так как вполне вероятно, что он ещё не задействован.
    const reNative = RegExp('^' +
        // Применяем `Object#toString` к строке
        String(toString)
        // Избавляемся от любых специальных символов регулярных выражений
            .replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&')
            // Заменяем упоминания `toString` на `.*?`, чтобы сохранить обобщённый вид шаблона.
            // Заменяем `for ...` и тому подобное для поддержки окружений вроде Rhino,
            // которые добавляют дополнительную информацию, такую как арность метода.
            .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    function isNative(value: any) {
        const type = typeof value;
        return type == 'function'
            // Используем `Function#toString`, чтобы обойти собственный метод
            // `toString` самого значения и избежать ложного результата.
            ? reNative.test(fnToString.call(value))
            // На всякий случай выполняем проверку на наличие объектов среды, так
            // как некоторые окружения могут представлять компоненты вроде
            // типизированных массивов как методы DOM, что может не соответствовать
            // нормальному нативному паттерну.
            : (value && type == 'object' && reHostCtor.test(toString.call(value))) || false;
    }

    return isNative;
})();


export const isNativeNotBound = (value: any) => {

    if (!value || typeof value.name !== 'string') {
        return false;
    }

    if (!isNativeFunction(value)) {
        return false;
    }

    return value.name.indexOf('bound') === -1;
};
