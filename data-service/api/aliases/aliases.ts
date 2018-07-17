import { request } from '../../utils/request';
import { getDataService } from '../../config';

export function getAliasesByAddress(address: string): Promise<Array<string>> {
    const ds = getDataService();
    return request({ method: () => ds.aliases.getByAddress(address) })
        .then((r) => r.data.map((alias) => alias.alias));
}

export function getAddressByAlias(alias: string): Promise<{ address: string }> {
    const ds = getDataService();
    return request({ method: () => ds.aliases.getById(alias).then(r => r.data) });
}
