import { get, parse } from '../config';
import { normalizeUrl } from './utils';
import { isEmpty } from 'ts-utils';


export function request<T>(params: IRequestParams<T>): Promise<T> {
    let promise;
    if (params.url) {

        addDefaultRequestParams(params.url, params.fetchOptions);

        promise = fetch(normalizeUrl(params.url), params.fetchOptions || Object.create(null))
            .then((response) => {
                if (response.ok) {
                    return response.text();
                } else {
                    return response.text().then((text) => Promise.reject(text));
                }
            })
            .then(parse);
    } else if (params.method) {
        promise = params.method();
    } else {
        throw new Error('Wrong request params!');
    }
    // TODO catch errors

    return promise;
}

function addDefaultRequestParams(url: string, options: IFetchOptions = Object.create(null)): void {
    if (url.indexOf(get('node')) === 0 && isEmpty(options.credentials)) {
        options.credentials = 'include';
    }
}

export interface IRequestParams<T> {
    url?: string;
    data?: object;
    method?: () => Promise<T>;
    fetchOptions?: IFetchOptions;
}

declare const fetch: (url: string, options?: IFetchOptions) => Promise<any>;

export interface IFetchOptions {
    type?: 'POST' | 'GET';
    headers?: object;
    credentials?: string;
}
