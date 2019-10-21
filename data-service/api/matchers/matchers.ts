import { request } from '../../utils/request';
import { stringifyJSON } from '../../utils/utils';
import { get } from '../../config';

export function getRates(matcherAddress: string, pairs: string[][]) {
    return request({
        url: `${get('api')}/${get('apiVersion')}/matchers/${matcherAddress}/rates`,
        fetchOptions: {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: stringifyJSON({
                pairs: pairs.map(pair => pair.join('/'))
            })
        }
    });
}
