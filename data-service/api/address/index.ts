import { request } from '../../utils/request';
import { get as configGet } from '../../config';
import { get } from '../assets/assets';
import { Money } from '@waves/data-entities';


export function getScriptInfo(address: string): Promise<IScriptInfo<Money>> {
    return Promise.all([
        get('WAVES'),
        request<IScriptInfo<number | string>>({ url: `${configGet('node')}/addresses/scriptInfo/${address}` })
    ]).then(([asset, info]) => {
        return { ...info, extraFee: new Money(info.extraFee, asset) };
    });
}

export interface IScriptInfo<LONG> {
    address: string;
    script?: string;
    scriptText?: string;
    complexity: number;
    extraFee: LONG;
}
