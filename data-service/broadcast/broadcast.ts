import { Money, BigNumber } from '@waves/data-entities';
import { idToNode, normalizeTime } from '../utils/utils';
import { libs, TRANSACTION_TYPE_VERSION } from '@waves/waves-signature-generator';
import { getSignatureApi, SIGN_TYPE } from '../sign';
import { request } from '../utils/request';
import { parse } from '../api/matcher/getOrders';
import { get } from '../config';
import { addOrderToStore, removeOrderFromStore } from '../store';


export function broadcast(type: SIGN_TYPE, data: any) {
    const api = getSignatureApi();
    return Promise.all([
        api.getPublicKey(),
        api.getAddress()
    ]).then(([senderPublicKey, sender]) => {
        const timestamp = normalizeTime(data.timestamp || Date.now());
        const schema = schemas.getSchemaByType(type);
        return api.sign({ type, data: schema.sign({ ...data, sender, senderPublicKey, timestamp }) } as any)
            .then((signature) => {
                const proofs = [signature];
                return schema.api({ ...data, sender, senderPublicKey, signature, timestamp, proofs });
            });
    }).then((data) => {
        return request({
            url: `${get('node')}/transactions/broadcast`,
            fetchOptions: {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                body: JSON.stringify(data)
            }
        });
    });
}

export function createOrder(data) {
    const api = getSignatureApi();
    return Promise.all([
        api.getPublicKey(),
        api.getAddress(),
        request({ url: `${get('matcher')}/` })
    ])
        .then(([senderPublicKey, sender, matcherPublicKey]) => {
            const timestamp = normalizeTime(data.timestamp || Date.now());
            const expiration = data.expiration || prepare.processors.expiration();
            const schema = schemas.getSchemaByType(SIGN_TYPE.CREATE_ORDER);
            const assetPair = {
                amountAsset: idToNode(data.amountAsset),
                priceAsset: idToNode(data.priceAsset)
            };
            return api.sign({
                type: SIGN_TYPE.CREATE_ORDER,
                data: schema.sign({ ...data, sender, senderPublicKey, timestamp, matcherPublicKey, expiration })
            } as any)
                .then((signature) => {
                    return schema.api({
                        ...data,
                        sender,
                        senderPublicKey,
                        signature,
                        timestamp,
                        matcherPublicKey,
                        expiration
                    });
                })
                .then((data) => ({ ...data, assetPair }));
        })
        .then((data) => {
            return request({
                url: `${get('matcher')}/orderbook`,
                fetchOptions: {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    body: JSON.stringify(data)
                }
            });
        })
        .then((data: any) => {
            return parse([{ ...data.message, type: data.message.orderType, status: 'Accepted', filled: 0 }]);
        })
        .then(addOrderToStore);
}

export function cancelOrder(amountId: string, priceId: string, orderId: string, type: 'cancel' | 'delete' = 'cancel') {
    const api = getSignatureApi();
    const schema = schemas.getSchemaByType(SIGN_TYPE.CANCEL_ORDER);
    return Promise.all([api.getPublicKey(), api.getAddress()])
        .then(([senderPublicKey, sender]) => {
            return api.sign({ type: SIGN_TYPE.CANCEL_ORDER, data: schema.sign({ senderPublicKey, orderId }) })
                .then((signature) => {
                    return schema.api({ senderPublicKey, orderId, signature, sender });
                });
        })
        .then((data) => {
            return request({
                url: `${get('matcher')}/orderbook/${amountId}/${priceId}/${type}`,
                fetchOptions: {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json;charset=UTF-8'
                    },
                    body: JSON.stringify(data)
                }
            });
        })
        .then((data) => {
            removeOrderFromStore({ id: orderId });
            return data;
        });
}

export module prepare {

    export module processors {

        export function moneyToAssetId(money: Money): string {
            return money.asset.id;
        }

        export function moneyToNodeAssetId(money: Money): string {
            return idToNode(money.asset.id);
        }

        export function moneyToNumber(money: Money): number { // TODO Remove!
            return Number(money.toCoins());
        }

        export function moneyToBigNumberCoins(money: Money): BigNumber {
            return money.getCoins();
        }

        export function timestamp(time) {
            return (time && time instanceof Date ? time.getTime() : time) || Date.now();
        }

        export function orString(data) {
            return data || '';
        }

        export function noProcess(data) {
            return data;
        }

        export function recipient(data) {
            return data.length < 30 ? `alias:${get('code')}:${data}` : data;
        }

        export function attachment(data: string) {
            data = data || '';
            const value = Uint8Array.from(libs.converters.stringToByteArray(data));
            return libs.base58.encode(Uint8Array.from(value));
        }

        export function bigNumberToNumber(num: BigNumber): number { // TODO Remove!
            return Number(num);
        }

        export function addValue(value: any) {
            return () => value;
        }

        export function expiration(date?) {
            return date || new Date().setDate(new Date().getDate() + 20);
        }

        export function transfers(recipient, amount) {
            return (transfers) => transfers.map((transfer) => ({
                recipient: recipient(transfer.recipient),
                amount: amount(transfer.amount)
            }));
        }

        export function quantity(data) {
            return bigNumberToNumber(new BigNumber(data.quantity).times(new BigNumber(10).pow(data.precision)));
        }
    }

    export function wrap(from: string, to: string, cb: any): IWrappedFunction {
        if (typeof cb != 'function') {
            return { from, to, cb: () => cb };
        }
        return { from, to, cb };
    }

    export interface IWrappedFunction {
        from: string;
        to: string;
        cb: Function;
    }

    export function schema(...args: Array<IWrappedFunction | string>) {
        return (data) => args.map((item) => {
            return typeof item === 'string' ? {
                key: item,
                value: processors.noProcess(data[item])
            } : {
                key: item.to,
                value: item.cb(item.from ? data[item.from] : data)
            };
        })
            .reduce((result, item) => {
                result[item.key] = item.value;
                return result;
            }, Object.create(null));
    }
}

export module schemas {

    export module api {

        export const createOrder = prepare.schema(
            'matcherPublicKey',
            'orderType',
            prepare.wrap('price', 'price', prepare.processors.bigNumberToNumber),
            prepare.wrap('amount', 'amount', prepare.processors.bigNumberToNumber),
            prepare.wrap('matcherFee', 'matcherFee', prepare.processors.bigNumberToNumber),
            prepare.wrap('expiration', 'expiration', prepare.processors.expiration),
            'senderPublicKey',
            'timestamp',
            'signature'
        );

        export const cancelOrder = prepare.schema(
            'orderId',
            prepare.wrap('senderPublicKey', 'sender', prepare.processors.noProcess),
            'signature'
        );

        export const issue = prepare.schema(
            'senderPublicKey',
            'name',
            'description',
            prepare.wrap(null, 'quantity', prepare.processors.quantity),
            prepare.wrap('precision', 'decimals', prepare.processors.noProcess),
            prepare.wrap('reissuable', 'reissuable', prepare.processors.noProcess),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.ISSUE)),
            'signature'
        );

        export const transfer = prepare.schema(
            prepare.wrap('amount', 'assetId', prepare.processors.moneyToNodeAssetId),
            prepare.wrap('amount', 'amount', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'feeAssetId', prepare.processors.moneyToNodeAssetId),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('recipient', 'recipient', prepare.processors.recipient),
            prepare.wrap('attachment', 'attachment', prepare.processors.attachment),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            'senderPublicKey',
            'signature',
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.TRANSFER))
        );

        export const reissue = prepare.schema(
            'senderPublicKey',
            prepare.wrap('assetId', 'assetId', prepare.processors.noProcess),
            prepare.wrap('quantity', 'quantity', prepare.processors.moneyToNumber),
            prepare.wrap('reissuable', 'reissuable', prepare.processors.noProcess),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            'signature',
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.REISSUE))
        );

        export const burn = prepare.schema(
            'senderPublicKey',
            prepare.wrap('assetId', 'assetId', prepare.processors.noProcess),
            prepare.wrap('quantity', 'quantity', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            'signature',
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.BURN))
        );

        export const lease = prepare.schema(
            'senderPublicKey',
            prepare.wrap('recipient', 'recipient', prepare.processors.recipient),
            prepare.wrap('amount', 'amount', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            'signature',
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.LEASE))
        );

        export const cancelLeasing = prepare.schema(
            'senderPublicKey',
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('leaseId', 'leaseId', prepare.processors.noProcess),
            'signature',
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.CANCEL_LEASING))
        );

        export const alias = prepare.schema(
            'senderPublicKey',
            prepare.wrap('alias', 'alias', prepare.processors.noProcess),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            'signature',
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.CREATE_ALIAS))
        );

        export const massTransfer = prepare.schema(
            'senderPublicKey',
            prepare.wrap('version', 'version', prepare.processors.addValue(TRANSACTION_TYPE_VERSION.MASS_TRANSFER)),
            prepare.wrap('totalAmount', 'assetId', prepare.processors.moneyToNodeAssetId),
            prepare.wrap('transfers', 'transfers', prepare.processors.transfers(
                prepare.processors.recipient,
                prepare.processors.moneyToNumber
            )),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('attachment', 'attachment', prepare.processors.attachment),
            prepare.wrap('type', 'type', prepare.processors.addValue(SIGN_TYPE.MASS_TRANSFER)),
            'proofs'
        );

    }

    export module sign {

        export const createOrder = prepare.schema(
            'matcherPublicKey',
            'amountAsset',
            'priceAsset',
            'orderType',
            prepare.wrap('price', 'price', prepare.processors.bigNumberToNumber),
            prepare.wrap('amount', 'amount', prepare.processors.bigNumberToNumber),
            prepare.wrap('matcherFee', 'matcherFee', prepare.processors.bigNumberToNumber),
            prepare.wrap('expiration', 'expiration', prepare.processors.expiration),
            'senderPublicKey',
            'timestamp'
        );

        export const cancelOrder = prepare.schema(
            'senderPublicKey',
            'orderId'
        );

        export const issue = prepare.schema(
            'senderPublicKey',
            'name',
            'description',
            prepare.wrap(null, 'quantity', prepare.processors.quantity),
            prepare.wrap('precision', 'precision', prepare.processors.noProcess),
            prepare.wrap('reissuable', 'reissuable', prepare.processors.noProcess),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp)
        );

        export const transfer = prepare.schema(
            'senderPublicKey',
            prepare.wrap('amount', 'assetId', prepare.processors.moneyToAssetId),
            prepare.wrap('fee', 'feeAssetId', prepare.processors.moneyToAssetId),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('amount', 'amount', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('recipient', 'recipient', prepare.processors.noProcess),
            prepare.wrap('attachment', 'attachment', prepare.processors.orString)
        );

        export const reissue = prepare.schema(
            'senderPublicKey',
            prepare.wrap('assetId', 'assetId', prepare.processors.noProcess),
            prepare.wrap('quantity', 'quantity', prepare.processors.moneyToNumber),
            prepare.wrap('reissuable', 'reissuable', prepare.processors.noProcess),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp)
        );

        export const burn = prepare.schema(
            'senderPublicKey',
            prepare.wrap('assetId', 'assetId', prepare.processors.noProcess),
            prepare.wrap('quantity', 'quantity', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp)
        );

        export const lease = prepare.schema(
            'senderPublicKey',
            prepare.wrap('recipient', 'recipient', prepare.processors.noProcess),
            prepare.wrap('amount', 'amount', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp)
        );

        export const cancelLeasing = prepare.schema(
            'senderPublicKey',
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('leaseId', 'transactionId', prepare.processors.noProcess)
        );

        export const alias = prepare.schema(
            'senderPublicKey',
            prepare.wrap('alias', 'alias', prepare.processors.noProcess),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
        );

        export const massTransfer = prepare.schema(
            'senderPublicKey',
            prepare.wrap('totalAmount', 'assetId', prepare.processors.moneyToAssetId),
            prepare.wrap('transfers', 'transfers', prepare.processors.transfers(
                prepare.processors.noProcess,
                prepare.processors.moneyToNumber
            )),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('attachment', 'attachment', prepare.processors.noProcess),
            'proofs'
        );
    }

    export function getSchemaByType(type: SIGN_TYPE) {
        switch (type) {
            case SIGN_TYPE.CREATE_ORDER:
                return { api: api.createOrder, sign: sign.createOrder };
            case SIGN_TYPE.CANCEL_ORDER:
                return { api: api.cancelOrder, sign: sign.cancelOrder };
            case SIGN_TYPE.TRANSFER:
                return { api: api.transfer, sign: sign.transfer };
            case SIGN_TYPE.ISSUE:
                return { api: api.issue, sign: sign.issue };
            case SIGN_TYPE.REISSUE:
                return { api: api.reissue, sign: sign.reissue };
            case SIGN_TYPE.BURN:
                return { api: api.burn, sign: sign.burn };
            case SIGN_TYPE.LEASE:
                return { api: api.lease, sign: sign.lease };
            case SIGN_TYPE.CANCEL_LEASING:
                return { api: api.cancelLeasing, sign: sign.cancelLeasing };
            case SIGN_TYPE.CREATE_ALIAS:
                return { api: api.alias, sign: sign.alias };
            case SIGN_TYPE.MASS_TRANSFER:
                return { api: api.massTransfer, sign: sign.massTransfer };
        }
    }
}
