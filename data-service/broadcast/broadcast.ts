import { Money, BigNumber } from '@waves/data-entities';
import { idToNode } from '../utils/utils';
import { TRANSACTION_TYPE_NUMBER, libs, utils } from '@waves/waves-signature-generator';
import { getAddress, getPublicKey, sign } from '../sign';
import { request } from '../utils/request';
import { get } from '../config';


export function broadcast(type: TRANSACTION_TYPE_NUMBER, data: any) {
    return Promise.all([
        getPublicKey(),
        getAddress()
    ]).then(([senderPublicKey, sender]) => {
        const timestamp = data.timestamp || Date.now();
        const schema = schemas.getSchemaByType(type);
        return sign({ type, data: schema.sign({ ...data, sender, senderPublicKey, timestamp }) } as any)
            .then((signature) => {
                return schema.api({ ...data, sender, senderPublicKey, signature, timestamp });
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
                body: JSON.stringify({ ...data, type })
            }
        });
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
            return libs.base58.encode(Uint8Array.from(value))
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

    export function schema(...args: Array<IWrappedFunction>) {
        return (data) => args.map(({ from, to, cb }) => ({ key: to, value: cb(data[from]) }))
            .reduce((result, item) => {
                result[item.key] = item.value;
                return result;
            }, Object.create(null));
    }
}

export module schemas {

    export module api {

        export const transfer = prepare.schema(
            prepare.wrap('amount', 'assetId', prepare.processors.moneyToNodeAssetId),
            prepare.wrap('amount', 'amount', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'feeAssetId', prepare.processors.moneyToNodeAssetId),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('recipient', 'recipient', prepare.processors.recipient),
            prepare.wrap('attachment', 'attachment', prepare.processors.attachment),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('senderPublicKey', 'senderPublicKey', prepare.processors.noProcess),
            prepare.wrap('signature', 'signature', prepare.processors.noProcess),
        );

    }

    export module sign {

        export const transfer = prepare.schema(
            prepare.wrap('senderPublicKey', 'senderPublicKey', prepare.processors.noProcess),
            prepare.wrap('amount', 'assetId', prepare.processors.moneyToAssetId),
            prepare.wrap('fee', 'feeAssetId', prepare.processors.moneyToAssetId),
            prepare.wrap('timestamp', 'timestamp', prepare.processors.timestamp),
            prepare.wrap('amount', 'amount', prepare.processors.moneyToNumber),
            prepare.wrap('fee', 'fee', prepare.processors.moneyToNumber),
            prepare.wrap('recipient', 'recipient', prepare.processors.noProcess),
            prepare.wrap('attachment', 'attachment', prepare.processors.orString)
        );

    }

    export function getSchemaByType(type: TRANSACTION_TYPE_NUMBER) {
        switch (type) {
            case TRANSACTION_TYPE_NUMBER.TRANSFER:
                return { api: api.transfer, sign: sign.transfer };
        }
    }
}
