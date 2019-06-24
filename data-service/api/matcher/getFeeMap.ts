import { request } from '../../utils/request';
import { get } from '../../config';

export function getFeeMap() {
    return request({
       url: `${get('matcher')}/settings/rates`
    });
}
