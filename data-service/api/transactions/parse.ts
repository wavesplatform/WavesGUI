import { Money, Asset, BigNumber, OrderPrice, AssetPair } from '@waves/data-entities';
import { TRANSACTION_TYPE_NUMBER, utils, libs } from '@waves/waves-signature-generator';
import { get } from '../assets/assets';
import {
    txApi,
    ITransfer,
    IExchange,
    IExchangeOrder,
    T_API_TX,
    T_TX,
    ILease,
    ICancelLeasing, ICreateAlias, IMassTransfer, IIssue, IReissue, IBurn
} from './interface';
import {
    normalizeAssetId,
    normalizeAssetPair,
    normalizeRecipient,
    toHash,
    tokensMoneyFactory
} from '../../utils/utils';
import { WAVES_ID } from '@waves/waves-signature-generator';
import { IHash, TOrderType } from '../../interface';
import { factory, IFactory, remapOrder } from '../matcher/getOrders';
import { getSignatureApi } from '../../sign';

const getFactory = (isTokens: boolean): IFactory => {
    if (isTokens) {
        return {
            money: tokensMoneyFactory,
            price: (price, pair) => Money.fromTokens(price, pair.priceAsset)
        };
    } else {
        return factory;
    }
};


// TODO Remove is tokens flag after support Dima's api
export function parseTx(transactions: Array<T_API_TX>, isUTX: boolean, isTokens?: boolean): Promise<Array<T_TX>> {
    const hash = Object.create(null);
    hash[WAVES_ID] = true;
    transactions.forEach((tx) => getAssetsHashFromTx(tx, hash));
    const api = getSignatureApi();

    return Promise.all([
        get(Object.keys(hash)).then((assets) => toHash(assets, 'id')),
        api && api.getPublicKey() || Promise.resolve(null)
    ])
        .then(([hash, sender]) => {
            return transactions.map((transaction) => {
                switch (transaction.type) {
                    case TRANSACTION_TYPE_NUMBER.SEND_OLD:
                        return parseTransferTx(remapOldTransfer(transaction), hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.ISSUE:
                        return parseIssueTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.TRANSFER:
                        return parseTransferTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.REISSUE:
                        return parseReissueTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.BURN:
                        return parseBurnTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.EXCHANGE:
                        return parseExchangeTx(transaction, hash, isUTX, isTokens, sender);
                    case TRANSACTION_TYPE_NUMBER.LEASE:
                        return parseLeasingTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.CANCEL_LEASING:
                        return parseCancelLeasingTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.CREATE_ALIAS:
                        return parseCreateAliasTx(transaction, hash, isUTX);
                    case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
                        return parseMassTransferTx(transaction, hash, isUTX);
                    default:
                        return transaction;
                }
            });
        });
}

export function getAssetsHashFromTx(transaction: T_API_TX, hash = Object.create(null)): IHash<boolean> {
    hash[WAVES_ID] = true;
    switch (transaction.type) {
        case TRANSACTION_TYPE_NUMBER.ISSUE:
            hash[normalizeAssetId(transaction.id)] = true;
            break;
        case TRANSACTION_TYPE_NUMBER.REISSUE:
        case TRANSACTION_TYPE_NUMBER.BURN:
        case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
            hash[normalizeAssetId(transaction.assetId)] = true;
            break;
        case TRANSACTION_TYPE_NUMBER.TRANSFER:
            hash[normalizeAssetId(transaction.assetId)] = true;
            hash[normalizeAssetId(transaction.feeAsset)] = true;
            break;
        case TRANSACTION_TYPE_NUMBER.EXCHANGE:
            hash[normalizeAssetId(transaction.order1.assetPair.amountAsset)] = true;
            hash[normalizeAssetId(transaction.order1.assetPair.priceAsset)] = true;
            break;

    }
    return hash;
}

export function remapOldTransfer(tx: txApi.IOldTransferTx): txApi.ITransfer {
    const type = TRANSACTION_TYPE_NUMBER.TRANSFER;
    const assetId = WAVES_ID;
    return { ...tx, type, assetId, attachment: '', feeAsset: WAVES_ID };
}

export function parseIssueTx(tx: txApi.IIssue, assetsHash: IHash<Asset>, isUTX: boolean): IIssue {
    const quantity = new Money(new BigNumber(tx.quantity), assetsHash[normalizeAssetId(tx.id)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, quantity, fee, isUTX };
}

export function parseTransferTx(tx: txApi.ITransfer, assetsHash: IHash<Asset>, isUTX: boolean): ITransfer {
    const bytes = libs.base58.decode(tx.attachment);
    let attachment;
    try {
        attachment = libs.converters.byteArrayToString(bytes);
    } catch (e) {
        attachment = null;
    }
    const rawAttachment = tx.attachment;
    const recipient = normalizeRecipient(tx.recipient);
    const amount = new Money(new BigNumber(tx.amount), assetsHash[normalizeAssetId(tx.assetId)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[normalizeAssetId(tx.feeAsset)]);
    const assetId = normalizeAssetId(tx.assetId);
    return { ...tx, amount, fee, assetId, isUTX, attachment, rawAttachment, recipient };
}

export function parseReissueTx(tx: txApi.IReissue, assetsHash: IHash<Asset>, isUTX: boolean): IReissue {
    const quantity = new Money(new BigNumber(tx.quantity), assetsHash[normalizeAssetId(tx.assetId)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, quantity, fee, isUTX };
}

export function parseBurnTx(tx: txApi.IBurn, assetsHash: IHash<Asset>, isUTX: boolean): IBurn {
    const amount = new Money(new BigNumber(tx.amount), assetsHash[normalizeAssetId(tx.assetId)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, amount, fee, isUTX };
}

export function parseExchangeTx(tx: txApi.IExchange, assetsHash: IHash<Asset>, isUTX: boolean, isTokens: boolean, sender: string): IExchange {
    const factory = getFactory(isTokens);
    const order1 = parseExchangeOrder(factory, tx.order1, assetsHash);
    const order2 = parseExchangeOrder(factory, tx.order2, assetsHash);

    const orderHash: IHash<IExchangeOrder> = {
        [order1.orderType]: order1,
        [order2.orderType]: order2
    };
    const buyOrder = orderHash.buy;
    const sellOrder = orderHash.sell;
    const exchangeType = getExchangeType(order1, order2, sender);
    const { price, amount, total } = getExchangeTxMoneys(factory, tx, assetsHash);
    const buyMatcherFee = factory.money(tx.buyMatcherFee, assetsHash[WAVES_ID]);
    const sellMatcherFee = factory.money(tx.sellMatcherFee, assetsHash[WAVES_ID]);
    const fee = factory.money(tx.fee, assetsHash[WAVES_ID]);
    return {
        ...tx,
        order1,
        order2,
        price,
        amount,
        buyMatcherFee,
        sellMatcherFee,
        fee,
        isUTX,
        buyOrder,
        sellOrder,
        exchangeType,
        total
    };
}

export function getExchangeTxMoneys(factory: IFactory, tx: txApi.IExchange, assetsHash: IHash<Asset>) {
    const assetIdPair = normalizeAssetPair(tx.order2.assetPair);
    const pair = new AssetPair(assetsHash[assetIdPair.amountAsset], assetsHash[assetIdPair.priceAsset]);
    const price = factory.price(tx.price, pair);
    const amount = factory.money(tx.amount, pair.amountAsset);
    const total = Money.fromTokens(amount.getTokens().times(price.getTokens()), price.asset);

    return { price, amount, total };
}

export function parseLeasingTx(tx: txApi.ILease, assetsHash: IHash<Asset>, isUTX: boolean): ILease {
    const amount = new Money(new BigNumber(tx.amount), assetsHash[WAVES_ID]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    const recipient = normalizeRecipient(tx.recipient);
    const isActive = tx.status === 'active';
    return { ...tx, amount, fee, isUTX, recipient, isActive };
}

export function parseCancelLeasingTx(tx: txApi.ICancelLeasing, assetsHash: IHash<Asset>, isUTX: boolean): ICancelLeasing {
    const lease = parseLeasingTx(tx.lease, assetsHash, false);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, lease, fee, isUTX };
}

export function parseCreateAliasTx(tx: txApi.ICreateAlias, assetsHash: IHash<Asset>, isUTX: boolean): ICreateAlias {
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, fee, isUTX };
}

export function parseMassTransferTx(tx: txApi.IMassTransfer, assetsHash: IHash<Asset>, isUTX: boolean): IMassTransfer {
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    const totalAmount = new Money(new BigNumber(tx.totalAmount), assetsHash[normalizeAssetId(tx.assetId)]);
    const transfers = tx.transfers.map((transfer) => ({
        recipient: normalizeRecipient(transfer.recipient),
        amount: new Money(new BigNumber(transfer.amount), assetsHash[normalizeAssetId(tx.assetId)])
    }));
    const bytes = libs.base58.decode(tx.attachment);
    let attachment;
    try {
        attachment = libs.converters.byteArrayToString(bytes);
    } catch (e) {
        attachment = null;
    }
    const rawAttachment = tx.attachment;
    return { ...tx, totalAmount, transfers, fee, isUTX, attachment, rawAttachment };
}

function parseExchangeOrder(factory: IFactory, order: txApi.IExchangeOrder, assetsHash: IHash<Asset>): IExchangeOrder {
    const assetPair = normalizeAssetPair(order.assetPair);
    const pair = new AssetPair(assetsHash[assetPair.amountAsset], assetsHash[assetPair.priceAsset]);
    const price = factory.price(order.price, pair);
    const amount = factory.money(order.amount, assetsHash[assetPair.amountAsset]);
    const total = Money.fromTokens(amount.getTokens().times(price.getTokens()), price.asset);
    const matcherFee = factory.money(order.matcherFee, assetsHash[WAVES_ID]);
    return { ...order, price, amount, matcherFee, assetPair, total };
}

function getExchangeType(order1: IExchangeOrder, order2: IExchangeOrder, sender: string): TOrderType {
    if (isBothOwnedBy(order1, order2, sender) || isBothNotOwnedBy(order1, order2, sender)) {
        return order1.timestamp > order2.timestamp ? order1.orderType : order2.orderType;
    } else {
        return getMineOrder(order1, order2, sender).orderType;
    }
}

function getMineOrder(order1: IExchangeOrder, order2: IExchangeOrder, sender: string): IExchangeOrder {
    return order1.senderPublicKey === sender ? order1 : order2;
}

function isBothOwnedBy(order1: IExchangeOrder, order2: IExchangeOrder, sender: string) {
    return order1.senderPublicKey === sender && order2.senderPublicKey === sender;
}

function isBothNotOwnedBy(order1: IExchangeOrder, order2: IExchangeOrder, sender: string) {
    return order1.senderPublicKey !== sender && order2.senderPublicKey !== sender;
}
