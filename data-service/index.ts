import * as apiMethods from './api/API';
import { BalanceManager } from './classes/BalanceManager';
import * as configApi from './config';
import { dropSignatureApi, ISignatureApi, setSignatureApi, getPublicKey, sign, SIGN_TYPE } from './sign';
import * as utilsModule from './utils/utils';
import { request } from './utils/request';
import { IFetchOptions } from './utils/request';


export const api = { ...apiMethods };
export const balanceManager = new BalanceManager();
export const config = { ...configApi };
export const utils = { ...utilsModule };
export function fetch<T>(url: string, fetchOptions: IFetchOptions): Promise<T> {
    return request<T>({ url, fetchOptions });
}

class App {

    public address: string;

    public login(address: string, api: ISignatureApi): void {
        this.address = address;
        setSignatureApi(api);
        this._addMatcherSign()
            .then(() => this._initializeBalanceManager(address));
    }

    public logOut() {
        dropSignatureApi();
        balanceManager.dropAddress();
    }

    private _addMatcherSign() {
        const timestamp = utilsModule.addTime(new Date(), 2, 'hour').valueOf();
        return getPublicKey()
            .then((senderPublicKey) => {
                return sign({
                    type: SIGN_TYPE.MATCHER_ORDERS,
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
