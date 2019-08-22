import * as apiMethods from './api/API';
import { DataManager } from './classes/DataManager';
import * as configApi from './config';
import * as sign from './sign';
import * as utilsModule from './utils/utils';
import { request } from './utils/request';
import { IFetchOptions } from './utils/request';
import * as wavesDataEntitiesModule from '@waves/data-entities';
import { Money, AssetPair, OrderPrice } from '@waves/data-entities';
import { normalizeTime, toAsset } from './utils/utils';
import { IAssetInfo } from '@waves/data-entities/dist/entities/Asset';
import { get } from './config';
import { TAssetData, TBigNumberData } from './interface';
import { get as getAssetPair } from './api/pairs/pairs';
import { broadcast as broadcastF, createOrderSend, cancelOrderSend, cancelAllOrdersSend } from './broadcast/broadcast';
import * as signatureAdapters from '@waves/signature-adapter';
import { SIGN_TYPE, isValidAddress as utilsIsValidAddress } from '@waves/signature-adapter';
import { TTimeType } from './utils/utils';
import { IUserData } from './sign';

export { getAdapterByType, getAvailableList } from '@waves/signature-adapter';
export { Seed } from './classes/Seed';
export { assetStorage } from './utils/AssetStorage';
export * from './store';

export const wavesDataEntities = {
    ...wavesDataEntitiesModule
};
export const api = { ...apiMethods };
export const dataManager = new DataManager();
export const config = { ...configApi };
export const utils = { ...utilsModule };
export const signature = {
    ...sign
};

export const signAdapters = signatureAdapters;
export const isValidAddress = utilsIsValidAddress;

// export const prepareForBroadcast = prepareForBroadcastF;
// export const getTransactionId = getTransactionIdF;
export const broadcast = broadcastF;
export const createOrder = createOrderSend;
export const cancelOrder = cancelOrderSend;
export const cancelAllOrders = cancelAllOrdersSend;

wavesDataEntitiesModule.config.set('remapAsset', (data: IAssetInfo) => {
    const name = get('remappedAssetNames')[data.id] || data.name;
    return { ...data, name };
});

export function fetch<T>(url: string, fetchOptions?: IFetchOptions): Promise<T> {
    return request<T>({ url, fetchOptions });
}

export function moneyFromTokens(tokens: TBigNumberData, assetData: TAssetData): Promise<Money> {
    return toAsset(assetData).then((asset) => {
        return wavesDataEntities.Money.fromTokens(tokens, asset);
    });
}

export function moneyFromCoins(coins: TBigNumberData, assetData: TAssetData): Promise<Money> {
    return toAsset(assetData).then((asset) => new Money(coins, asset));
}

export function orderPriceFromCoins(coins: TBigNumberData, pair: AssetPair): Promise<OrderPrice>;
export function orderPriceFromCoins(coins: TBigNumberData, asset1: TAssetData, asset2: TAssetData): Promise<OrderPrice>;
export function orderPriceFromCoins(coins: TBigNumberData, pair: AssetPair | TAssetData, asset2?: TAssetData): Promise<OrderPrice> {
    if (pair instanceof AssetPair) {
        return Promise.resolve(OrderPrice.fromMatcherCoins(coins, pair));
    } else {
        return getAssetPair(pair, asset2).then((pair) => OrderPrice.fromMatcherCoins(coins, pair));
    }
}

export function orderPriceFromTokens(tokens: TBigNumberData, pair: AssetPair): Promise<OrderPrice>;
export function orderPriceFromTokens(tokens: TBigNumberData, asset1: TAssetData, asset2: TAssetData): Promise<OrderPrice>;
export function orderPriceFromTokens(tokens: TBigNumberData, pair: AssetPair | TAssetData, asset2?: TAssetData): Promise<OrderPrice> {
    if (pair instanceof AssetPair) {
        return Promise.resolve(OrderPrice.fromTokens(tokens, pair));
    } else {
        return getAssetPair(pair, asset2).then((pair) => OrderPrice.fromTokens(tokens, pair));
    }
}

class App {

    public get address(): string {
        return sign.getUserAddress();
    };

    public login(userData: IUserData): void {
        sign.dropSignatureApi();
        sign.setUserData(userData);
        this._initializeDataManager(userData.address);
    }

    public logOut() {
        sign.dropSignatureApi();
        dataManager.dropAddress();
    }

    public addMatcherSign(timestamp, signature) {
        const signApi = sign.getSignatureApi();

        if (!signApi) {
            return Promise.reject({ error: 'No exist signature api' });
        }

        return signApi.getPublicKey()
            .then((senderPublicKey) => {
                api.matcher.addSignature(signature, senderPublicKey, timestamp);
            });
    }

    public getTimeStamp(count: number, timeType: TTimeType): number {
        return utilsModule.addTime(normalizeTime(new Date().getTime()), count, timeType).valueOf();
    }

    public getSignIdForMatcher(timestamp): Promise<string> {
        return sign.getSignatureApi()
            .makeSignable({
                type: SIGN_TYPE.MATCHER_ORDERS,
                data: {
                    timestamp
                }
            })
            .getId();
    }

    private _initializeDataManager(address: string): void {
        dataManager.dropAddress();
        dataManager.applyAddress(address);
    }

}

export const app = new App();
