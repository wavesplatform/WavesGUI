import { request } from '../../utils/request';
import { get } from '../../config';

export function getAliasesByAddress(address: string): Promise<Array<string>> {
    return request<Array<string>>({ url: `${get('node')}/alias/by-address/${address}` })
        .then((list) => list.map(clearAliasName));
}

export function getAddressByAlias(alias: string): Promise<{ address: string }> {
    return request<{ address: string }>({ url: `${get('node')}/alias/by-alias/${alias}` });
}

export function clearAliasName(item: string): string {
    return item.replace(`alias:${get('code')}:`, '');
}
