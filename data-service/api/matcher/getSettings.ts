import { request } from '../../utils/request';
import { get } from '../../config';

export function getFeeRates() {
    return request({
       url: `${get('matcher')}/settings/rates`
    });
}

export function getSettings() {
    return request({
        url: `${get('matcher')}/settings`
    });
}
