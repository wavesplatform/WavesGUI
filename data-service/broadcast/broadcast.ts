import { request } from '../utils/request';
import { parse } from '../api/matcher/getOrders';
import { get } from '../config';
import { stringifyJSON } from "../utils/utils";


export function broadcast(data) {
    return request({
        url: `${get('node')}/transactions/broadcast`,
        fetchOptions: {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: stringifyJSON(data)
        }
    });
}

export function createOrderSend(txData) {
    return request({
        url: `${get('matcher')}/orderbook`,
        fetchOptions: {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: stringifyJSON(txData)
        }
    })
        .then((data: any) => {
            return parse([{
                ...data.message,
                type: data.message.orderType,
                status: 'Accepted',
                filled: 0
            }]);
        })
}

export function cancelOrderSend(txData, amountId, priceId, type: 'cancel' | 'delete' = 'cancel') {
    return request({
        url: `${get('matcher')}/orderbook/${amountId}/${priceId}/${type}`,
        fetchOptions: {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: stringifyJSON(txData)
        }
    }).then((data) => {
        return data;
    });
}
