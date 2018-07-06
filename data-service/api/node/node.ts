import { request } from '../../utils/request';
import { get } from '../../config';

export function height(): Promise<number> {
    return request<number>({ url: `${get('node')}/blocks/height` });
}

export function time(): Promise<Date> {
    return request({ url: `${get('node')}/utils/time` })
        .then(({ system }) => new Date(system));
}
