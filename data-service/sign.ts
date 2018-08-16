import {
    generate,
    StringWithLength,
    ISignatureGenerator,
    AUTH_ORDER_SIGNATURE,
    TX_NUMBER_MAP,
    TRANSACTION_TYPE_NUMBER,
    CREATE_ORDER_SIGNATURE,
    CANCEL_ORDER_SIGNATURE,
    utils,
    config
} from '@waves/waves-signature-generator';

import { Seed } from './classes/Seed';
import * as signatureAdapter from '@waves/signature-adapter';

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
    const userData = { ...user, encryptionRounds };
    const Adapter = signatureAdapter.getAdapterByType(user.userType) ||
        signatureAdapter.getAdapterByType(signatureAdapter.adapterList[0].type);
    const adapter = new Adapter(userData);

    return {
        getTxId: (data: TSignData) => getTransactionId(data),
        isAvailable: () => adapter.isAvailable(),
        getPublicKey: () => adapter.getPublicKey(),
        getPrivateKey: () => adapter.getPrivateKey(),
        sign: (data: TSignData, asset?) => getSignatureForData(data, adapter, asset),
        getAddress: () => adapter.getAddress(),
        getSeed: () => adapter.getSeed(),
        type: Adapter.type
    };
}

function getSignatureGenerator({ type, data }) {
    switch (type) {
        case SIGN_TYPE.AUTH:
            return new AUTH_SIGNATURE(data);
        case SIGN_TYPE.MATCHER_ORDERS:
            return new AUTH_ORDER_SIGNATURE(data);
        case SIGN_TYPE.CREATE_ORDER:
            return new CREATE_ORDER_SIGNATURE(data);
        case SIGN_TYPE.CANCEL_ORDER:
            return new CANCEL_ORDER_SIGNATURE(data);
        case SIGN_TYPE.TRANSFER:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.TRANSFER](data);
        case SIGN_TYPE.ISSUE:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.ISSUE](data);
        case SIGN_TYPE.REISSUE:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.REISSUE](data);
        case SIGN_TYPE.BURN:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.BURN](data);
        case SIGN_TYPE.LEASE:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.LEASE](data);
        case SIGN_TYPE.CANCEL_LEASING:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.CANCEL_LEASING](data);
        case SIGN_TYPE.CREATE_ALIAS:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.CREATE_ALIAS](data);
        case SIGN_TYPE.MASS_TRANSFER:
            return new TX_NUMBER_MAP[TRANSACTION_TYPE_NUMBER.MASS_TRANSFER](data);
        default:
            return Promise.reject(new Error('Wrong sign type!'));
    }
}

function getAdapterMethod({ type }) {
    switch (type) {
        case SIGN_TYPE.AUTH:
            return 'signRequest';
        case SIGN_TYPE.MATCHER_ORDERS:
            return 'signRequest';
        case SIGN_TYPE.CREATE_ORDER:
            return 'signOrder';
        case SIGN_TYPE.CANCEL_ORDER:
            return 'signOrder';
        default:
            return 'signTransaction';
    }
}

export function getSignatureForData(forSign: TSignData, adapter, asset?): Promise<string> {
    const signType = getAdapterMethod(forSign);
    const amountPrecision = asset ? asset.precision : 10;
    const instance = <ISignatureGenerator>getSignatureGenerator(forSign);
    return instance.getBytes()
        .then((bytes) => adapter[signType](bytes, amountPrecision));
}

export function getTransactionId(forSign: TSignData): Promise<string> {
    const instance = <ISignatureGenerator>getSignatureGenerator(forSign);
    return instance.getBytes().then((bytes) => {
        return utils.crypto.buildTransactionId(bytes);
    });
}

export const AUTH_SIGNATURE = generate<IAuthData>([
    new StringWithLength('prefix'),
    new StringWithLength('host'),
    new StringWithLength('data')
]);

export interface ISignatureApi {
    sign(data: TSignData): Promise<string>;

    getTxId(data: TSignData): Promise<string>;

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
