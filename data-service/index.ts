import * as apiMethods from './api/API';
import { BalanceManager } from './classes/BalanceManager';
import * as configApi from './config';
import * as sign from './sign';
import * as utilsModule from './utils/utils';
import { request } from './utils/request';
import { IFetchOptions } from './utils/request';
import * as wavesDataEntitiesModule from '@waves/data-entities';

export { Seed } from './classes/Seed';


export const wavesDataEntities = {
    ...wavesDataEntitiesModule
};
export const api = { ...apiMethods };
export const balanceManager = new BalanceManager();
export const config = { ...configApi };
export const utils = { ...utilsModule };
export const signature = {
    ...sign
};

export function fetch<T>(url: string, fetchOptions: IFetchOptions): Promise<T> {
    return request<T>({ url, fetchOptions });
}

class App {

    public address: string;

    public login(address: string, api: sign.ISignatureApi): Promise<void> {
        this.address = address;
        sign.setSignatureApi(api);
        return this._addMatcherSign()
            .then(() => this._initializeBalanceManager(address));
    }

    public logOut() {
        sign.dropSignatureApi();
        balanceManager.dropAddress();
    }

    private _addMatcherSign() {
        const timestamp = utilsModule.addTime(new Date(), 2, 'hour').valueOf();
        return sign.getPublicKey()
            .then((senderPublicKey) => {
                return sign.sign({
                    type: sign.SIGN_TYPE.MATCHER_ORDERS,
                    data: {
                        senderPublicKey,
                        timestamp
                    }
                })
                    .then((signature) => {
                        api.matcher.addSignature(signature, senderPublicKey, timestamp);
                    });
            });
    }

    private _initializeBalanceManager(address: string): void {
        balanceManager.applyAddress(address);
    }

}

export const app = new App();
