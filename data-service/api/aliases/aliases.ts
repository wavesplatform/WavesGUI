import { request } from '../../utils/request';
import { get, getDataService } from '../../config';

export function getAliasesByAddress(address: string): Promise<Array<string>> {
    const ds = getDataService();
    return request({ method: () => ds.aliases.getByAddress(address) })
        .then((r) => r.data.map((alias) => alias.alias));
}

export function getAddressByAlias(alias: string): Promise<{ address: string }> {
    return request<{ address: string }>({ url: `${get('node')}/alias/by-alias/${alias}` });
}
