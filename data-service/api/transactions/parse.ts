import { Money, Asset, BigNumber } from '@waves/data-entities';
import { TRANSACTION_TYPE_NUMBER } from '@waves/waves-signature-generator';
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
import { normalizeAssetId, normalizeAssetPair, toHash } from '../../utils/utils';
import { WAVES_ID } from '@waves/waves-signature-generator';
import { IHash } from '../../interface';


export function parseTx(transactions: Array<T_API_TX>, isUtx: boolean): Promise<Array<T_TX>> {
    const hash = Object.create(null);
    transactions.forEach((tx) => getAssetsHashFromTx(tx, hash));

    return get(Object.keys(hash))
        .then((assets) => toHash(assets, 'id'))
        .then((hash) => {
            return transactions.map((transaction) => {
                switch (transaction.type) {
                    case TRANSACTION_TYPE_NUMBER.SEND_OLD:
                        return parseTransferTx(remapOldTransfer(transaction), hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.ISSUE:
                        return parseIssueTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.TRANSFER:
                        return parseTransferTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.REISSUE:
                        return parseReissueTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.BURN:
                        return parseBurnTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.EXCHANGE:
                        return parseExchangeTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.LEASE:
                        return parseLeasingTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.CANCEL_LEASING:
                        return parseCancelLeasingTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.CREATE_ALIAS:
                        return parseCreateAliasTx(transaction, hash, isUtx);
                    case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
                        return parseMassTransferTx(transaction, hash, isUtx);
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

export function parseIssueTx(tx: txApi.IIssue, assetsHash: IHash<Asset>, isUtx: boolean): IIssue {
    const quantity = new Money(new BigNumber(tx.quantity), assetsHash[normalizeAssetId(tx.id)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, quantity, fee, isUtx };
}

export function parseTransferTx(tx: txApi.ITransfer, assetsHash: IHash<Asset>, isUtx: boolean): ITransfer {
    const amount = new Money(new BigNumber(tx.amount), assetsHash[normalizeAssetId(tx.assetId)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[normalizeAssetId(tx.feeAsset)]);
    const assetId = normalizeAssetId(tx.assetId);
    return { ...tx, amount, fee, assetId, isUtx };
}

export function parseReissueTx(tx: txApi.IReissue, assetsHash: IHash<Asset>, isUtx: boolean): IReissue {
    const quantity = new Money(new BigNumber(tx.quantity), assetsHash[normalizeAssetId(tx.assetId)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, quantity, fee, isUtx };
}

export function parseBurnTx(tx: txApi.IBurn, assetsHash: IHash<Asset>, isUtx: boolean): IBurn {
    const amount = new Money(new BigNumber(tx.amount), assetsHash[normalizeAssetId(tx.assetId)]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, amount, fee, isUtx };
}

export function parseExchangeTx(tx: txApi.IExchange, assetsHash: IHash<Asset>, isUtx: boolean): IExchange {
    const order1 = parseExchangeOrder(tx.order1, assetsHash);
    const order2 = parseExchangeOrder(tx.order2, assetsHash);
    const price = order1.price;
    const amount = order1.amount.cloneWithTokens(BigNumber.min(order1.amount.getTokens(), order2.amount.getTokens()));
    const buyMatcherFee = new Money(new BigNumber(tx.buyMatcherFee), assetsHash[WAVES_ID]);
    const sellMatcherFee = new Money(new BigNumber(tx.sellMatcherFee), assetsHash[WAVES_ID]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, order1, order2, price, amount, buyMatcherFee, sellMatcherFee, fee, isUtx };
}

export function parseLeasingTx(tx: txApi.ILease, assetsHash: IHash<Asset>, isUtx: boolean): ILease {
    const amount = new Money(new BigNumber(tx.amount), assetsHash[WAVES_ID]);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, amount, fee, isUtx };
}

export function parseCancelLeasingTx(tx: txApi.ICancelLeasing, assetsHash: IHash<Asset>, isUtx: boolean): ICancelLeasing {
    const lease = parseLeasingTx(tx.lease, assetsHash, false);
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, lease, fee, isUtx };
}

export function parseCreateAliasTx(tx: txApi.ICreateAlias, assetsHash: IHash<Asset>, isUtx: boolean): ICreateAlias {
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    return { ...tx, fee, isUtx };
}

export function parseMassTransferTx(tx: txApi.IMassTransfer, assetsHash: IHash<Asset>, isUtx: boolean): IMassTransfer {
    const fee = new Money(new BigNumber(tx.fee), assetsHash[WAVES_ID]);
    const totalAmount = new Money(new BigNumber(tx.totalAmount), assetsHash[normalizeAssetId(tx.assetId)]);
    const transfers = tx.transfers.map((transfer) => ({
        recipient: transfer.recipient,
        amount: new Money(new BigNumber(transfer.amount), assetsHash[normalizeAssetId(tx.assetId)])
    }));
    return { ...tx, totalAmount, transfers, fee, isUtx };
}

function parseExchangeOrder(order: txApi.IExchangeOrder, assetsHash: IHash<Asset>): IExchangeOrder {
    const assetPair = normalizeAssetPair(order.assetPair);
    const price = new Money(new BigNumber(order.price), assetsHash[assetPair.priceAsset]);
    const amount = new Money(new BigNumber(order.amount), assetsHash[assetPair.amountAsset]);
    const matcherFee = new Money(new BigNumber(order.matcherFee), assetsHash[WAVES_ID]);
    return { ...order, price, amount, matcherFee, assetPair };
}
