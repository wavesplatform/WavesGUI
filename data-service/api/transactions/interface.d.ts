import { Money, BigNumber } from '@waves/data-entities';
import { IAssetPair, TLeasingStatus, TOrderType } from '../../interface';
import { TRANSACTION_TYPE_NUMBER } from '@waves/waves-signature-generator';


export type T_API_TX =
    txApi.IOldTransferTx |
    txApi.IIssue |
    txApi.ITransfer |
    txApi.IReissue |
    txApi.IBurn |
    txApi.IExchange |
    txApi.ILease |
    txApi.ICancelLeasing |
    txApi.ICreateAlias |
    txApi.IMassTransfer |
    txApi.IData;

export type T_TX =
    IIssue |
    ITransfer |
    IReissue |
    IBurn |
    IExchange |
    ILease |
    ICancelLeasing |
    ICreateAlias |
    IMassTransfer |
    IData;

export module txApi {

    export interface IBaseTransaction {
        type: number;
        id: string;
        timestamp: number;
        sender: string;
        senderPublicKey: string;
        fee: string;
        signature?: string;
        proofs?: Array<string>;
        height?: number;
    }

    export interface IOldTransferTx extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.SEND_OLD;
        fee: string;
        amount: string;
        recipient: string;
    }

    export interface IIssue extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.ISSUE;
        precision: number;
        description: string;
        name: string;
        quantity: string;
        reissuable: boolean;
        fee: string;
    }

    export interface ITransfer extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.TRANSFER;
        amount: string;
        assetId: string;
        attachment: string;
        fee: string;
        feeAsset: string;
        recipient: string;
    }

    export interface IReissue extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.REISSUE;
        assetId: string;
        quantity: string;
        reissuable: boolean;
        fee: string;
    }

    export interface IBurn extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.BURN;
        assetId: string;
        amount: string;
        fee: string;
    }

    export interface IExchange extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.EXCHANGE;
        amount: string;
        buyMatcherFee: string;
        sellMatcherFee: string;
        fee: string;
        price: string;
        order1: IExchangeOrder;
        order2: IExchangeOrder;
    }

    export interface ILease extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.LEASE;
        amount: string;
        fee: string;
        status?: 'active' | 'canceled';
        recipient: string;
    }

    export interface ICancelLeasing extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.CANCEL_LEASING;
        fee: string;
        leaseId: string;
        lease: ILease;
    }

    export interface ICreateAlias extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.CREATE_ALIAS;
        alias: string;
        fee: string;
    }

    export interface IMassTransfer extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.MASS_TRANSFER;
        version?: number;
        assetId: string;
        attachment: string;
        fee: string;
        totalAmount: string;
        transferCount: number;
        transfers: Array<{ amount: string; recipient: string; }>
    }

    export interface IData extends IBaseTransaction {
        type: TRANSACTION_TYPE_NUMBER.DATA;
        version?: number;
        data: Array<TDataEntry>;
        fee: string;
    }

    export interface IExchangeOrder {
        amount: string;
        assetPair: IAssetPair;
        expiration: number;
        id: string;
        matcherFee: string;
        matcherPublicKey: string;
        orderType: TOrderType;
        price: string;
        senderPublicKey: string;
        signature: string;
        timestamp: number;
    }
}

export interface IBaseTransaction {
    type: number;
    id: string;
    timestamp: number;
    sender: string;
    senderPublicKey: string;
    fee: Money;
    isUTX: boolean;
    signature?: string;
    proofs?: Array<string>;
    height?: number;
}

export interface IOldTransferTx extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.SEND_OLD;
    fee: Money;
    amount: Money;
    recipient: string;
}

export interface IIssue extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.ISSUE;
    precision: number;
    description: string;
    name: string;
    quantity: Money;
    reissuable: boolean;
    fee: Money;
}

export interface ITransfer extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.TRANSFER;
    amount: Money;
    assetId: string;
    attachment: string;
    rawAttachment: string;
    fee: Money;
    feeAsset: string;
    recipient: string;
}

export interface IReissue extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.REISSUE;
    assetId: string;
    quantity: Money;
    reissuable: boolean;
    fee: Money;
}

export interface IBurn extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.BURN;
    assetId: string;
    amount: Money;
    fee: Money;
}

export interface IExchange extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.EXCHANGE;
    exchangeType: TOrderType;
    buyMatcherFee: Money;
    sellMatcherFee: Money;
    amount: Money;
    price: Money;
    total: Money;
    fee: Money;
    order1: IExchangeOrder;
    order2: IExchangeOrder;
    buyOrder: IExchangeOrder;
    sellOrder: IExchangeOrder;
}

export interface ILease extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.LEASE;
    amount: Money;
    fee: Money;
    isActive: boolean;
    status?: TLeasingStatus;
    recipient: string;
}

export interface ICancelLeasing extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.CANCEL_LEASING;
    fee: Money;
    leaseId: string;
    lease: ILease;
}

export interface ICreateAlias extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.CREATE_ALIAS;
    alias: string;
    fee: Money;
}

export interface IMassTransfer extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.MASS_TRANSFER;
    version?: number;
    assetId: string;
    attachment: string;
    rawAttachment: string;
    fee: Money;
    totalAmount: Money;
    transferCount: number;
    transfers: Array<{ amount: Money; recipient: string; }>
}

export interface IData extends IBaseTransaction {
    type: TRANSACTION_TYPE_NUMBER.DATA;
    version?: number;
    data: Array<TDataEntry>;
    stringifiedData: string;
    fee: Money;
}

export interface IExchangeOrder {
    amount: Money;
    price: Money;
    total: Money;
    assetPair: IAssetPair;
    expiration: number;
    id: string;
    matcherFee: Money;
    matcherPublicKey: string;
    orderType: TOrderType;
    senderPublicKey: string;
    signature: string;
    timestamp: number;
}

export type TDataEntry = TDataEntryInteger | TDataEntryBoolean | TDataEntryBinary | TDataEntryString;

export interface TDataEntryInteger {
    type: 'integer';
    key: string;
    value: number;
}

export interface TDataEntryBoolean {
    type: 'boolean';
    key: string;
    value: boolean;
}

export interface TDataEntryBinary {
    type: 'binary';
    key: string;
    value: string; // base64
}

export interface TDataEntryString {
    type: 'binary';
    key: string;
    value: string;
}
