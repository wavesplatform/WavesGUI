import {
    generate,
    StringWithLength,
    ISignatureGenerator,
    AUTH_ORDER_SIGNATURE,
    TX_NUMBER_MAP,
    TRANSACTION_TYPE_NUMBER,
    CREATE_ORDER_SIGNATURE,
    CANCEL_ORDER_SIGNATURE,
    config
} from '@waves/waves-signature-generator';

import { Seed } from './classes/Seed';
import * as signatureAdapter from '@waves/waves-signature-adapter';

import { IKeyPair } from './interface';

let API: ISignatureApi;

export function setSignatureApi(api: ISignatureApi) {
    API = api;
}

export function dropSignatureApi() {
    API = null;
}

export function getSignatureApi(): ISignatureApi {
    return API;
}

export function getDefaultSignatureApi(user): ISignatureApi {

    const encryptionRounds = user.settings.get('encryptionRounds');
    const networkCode = (<any>window).WavesApp.network.code.charCodeAt(0);
    const userData = { ...user, encryptionRounds };
    const Adapter = signatureAdapter.getAdapterByType(user.userType) ||
        signatureAdapter.getAdapterByType(signatureAdapter.adapterList[0].type);
    const adapter = new Adapter(userData, networkCode);

    return {
        isAvailable: () => adapter.isAvailable(),
        getPublicKey: () => adapter.getPublicKey(),
        getPrivateKey: () => adapter.getPrivateKey(),
        sign: (data: TSignData) => {
            return addSignForData(data, adapter);
        },
        getAddress: () => adapter.getAddress(),
        getSeed: () => adapter.getSeed(),
        type: Adapter.type
    };
}

export function addSignForData(forSign: TSignData, adapter): Promise<string> {
    let instance: ISignatureGenerator;
    let signType = '';
    let amountPrecision = 10;

    switch (forSign.type) {
        case SIGN_TYPE.AUTH:
            instance = new AUTH_SIGNATURE(forSign.data);
            signType = 'signRequest';
            break;
        case SIGN_TYPE.MATCHER_ORDERS:
            instance = new AUTH_ORDER_SIGNATURE(forSign.data);
            signType = 'signRequest';
            break;
        case SIGN_TYPE.CREATE_ORDER:
            instance = new CREATE_ORDER_SIGNATURE(forSign.data);
            signType = 'signOrder';
            break;
        case SIGN_TYPE.CANCEL_ORDER:
            instance = new CANCEL_ORDER_SIGNATURE(forSign.data);
            signType = 'signOrder';
            break;
        case SIGN_TYPE.TRANSFER:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.TRANSFER](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.ISSUE:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.ISSUE](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.REISSUE:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.REISSUE](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.BURN:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.BURN](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.LEASE:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.LEASE](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.CANCEL_LEASING:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.CANCEL_LEASING](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.CREATE_ALIAS:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.CREATE_ALIAS](forSign.data);
            signType = 'signTransaction';
            break;
        case SIGN_TYPE.MASS_TRANSFER:
            instance = new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.MASS_TRANSFER](forSign.data);
            signType = 'signTransaction';
            break;
        default:
            return Promise.reject(new Error('Wrong sign type!'));
    }

    return instance.getBytes()
        .then((bytes) => adapter[signType](bytes, amountPrecision));
    //return instance.getSignature('dddddd');
}

export const AUTH_SIGNATURE = generate<IAuthData>([
    new StringWithLength('prefix'),
    new StringWithLength('host'),
    new StringWithLength('data')
]);

export interface ISignatureApi {
    sign(data: TSignData): Promise<string>;

    getPublicKey(): Promise<string>;

    getAddress(): Promise<string>;

    isAvailable(): Promise<void>;

    getSeed?(): Promise<string>;

    getPrivateKey?(): Promise<string>;

    type?: string;
}

export const enum SIGN_TYPE {
    AUTH = 1000,
    MATCHER_ORDERS = 1001,
    CREATE_ORDER = 1002,
    CANCEL_ORDER = 1003,
    ISSUE = 3,
    TRANSFER = 4,
    REISSUE = 5,
    BURN = 6,
    LEASE = 8,
    CANCEL_LEASING = 9,
    CREATE_ALIAS = 10,
    MASS_TRANSFER = 11
}

export type TSignData =
    ISignAuthData |
    ISignGetOrders |
    ISignCreateOrder |
    ISignCancelOrder |
    ISignTransferData |
    ISignIssue |
    ISignReissue |
    ISignBurn |
    ISignLease |
    ISignCancelLeasing |
    ISignCreateAlias |
    ISignMassTransfer;

export interface ISignAuthData {
    data: IAuthData;
    type: SIGN_TYPE.AUTH;
}

export interface ISignGetOrders {
    data: IGetOrders;
    type: SIGN_TYPE.MATCHER_ORDERS;
}

export interface ISignCreateOrder {
    data: ICreateOrder;
    type: SIGN_TYPE.CREATE_ORDER;
}

export interface ISignCancelOrder {
    data: ICancelOrder;
    type: SIGN_TYPE.CANCEL_ORDER;
}

export interface ISignTransferData {
    data: ITransferData;
    type: SIGN_TYPE.TRANSFER;
}

export interface ISignIssue {
    data: IIssue;
    type: SIGN_TYPE.ISSUE;
}

export interface ISignReissue {
    data: IReissue;
    type: SIGN_TYPE.REISSUE;
}

export interface ISignBurn {
    data: IBurn;
    type: SIGN_TYPE.BURN;
}

export interface ISignLease {
    data: ILease;
    type: SIGN_TYPE.LEASE;
}

export interface ISignCancelLeasing {
    data: ICancelLeasing;
    type: SIGN_TYPE.CANCEL_LEASING;
}

export interface ISignCreateAlias {
    data: ICreateAlias;
    type: SIGN_TYPE.CREATE_ALIAS;
}

export interface ISignMassTransfer {
    data: IMassTransfer;
    type: SIGN_TYPE.MASS_TRANSFER;
}

export interface IAuthData {
    prefix: string;
    host: string;
    data: string;
}

export interface IGetOrders {
    timestamp: number;
    senderPublicKey: string;
}

export interface ICreateOrder {
    matcherPublicKey: string;
    amountAsset: string;
    priceAsset: string;
    orderType: string;
    price: string;
    amount: string;
    expiration: number;
    matcherFee: string;
    senderPublicKey: string;
    timestamp: number;
}

export interface ICancelOrder {
    senderPublicKey: string;
    orderId: string;
}

export interface ICreateTxData {
    fee: string;
    sender: string;
    timestamp: number;
    senderPublicKey: string;
}

export interface ITransferData extends ICreateTxData {
    assetId: string;
    feeAssetId: string;
    amount: string;
    attachment: string;
    recipient: string;
}

export interface IIssue extends ICreateTxData {
    name: string;
    description: string;
    precision: number;
    quantity: string;
    decimals: number;
    reissuable: boolean;
}

export interface IReissue extends ICreateTxData {
    assetId: string;
    quantity: string;
    decimals: number;
    reissuable: boolean;
}

export interface IBurn extends ICreateTxData {
    assetId: string;
    quantity: string;
}

export interface ILease extends ICreateTxData {
    amount: string;
    recipient: string;
}

export interface ICancelLeasing extends ICreateTxData {
    transactionId: string;
}

export interface ICreateAlias extends ICreateTxData {
    alias: string;
}

export interface IMassTransfer extends ICreateTxData {
    version: string;
    assetId: string;
    transfers: Array<{ recipient: string; amount: string; }>;
    attachment: string;
}
