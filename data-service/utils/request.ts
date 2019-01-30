import { get, parse } from '../config';
import { normalizeUrl } from './utils';
import { isEmpty } from 'ts-utils';


export function request<T>(params: IRequestParams<T>): Promise<T> {
    let promise;
    if (params.url) {
        params.fetchOptions = addDefaultRequestParams(params.url, params.fetchOptions);
        promise = fetch(normalizeUrl(params.url), params.fetchOptions || Object.create(null))
            .then((response) => {
                const isJSON = response.headers.get('Content-Type').toLowerCase().includes('application/json');
                if (response.ok) {
                    return response.text().then((data) => isJSON ? parse(data) : data);
                } else {
                    if (response.status >= 500) {
                        return Promise.reject(new Error(`An unexpected error has occurred: # + ${response.status}`));
                    } else {
                        return response.text()
                            .then(tryParseError)
                            .then(error => Promise.reject(error));
                    }
                }
            });
    } else if (params.method) {
        promise = params.method();
    } else {
        throw new Error('Wrong request params!');
    }
    // TODO catch errors

    return promise;
}

function tryParseError(error: string): string | object {
    try {
        return JSON.parse(error);
    } catch (e) {
        return error;
    }
}

function addDefaultRequestParams(url: string, options: IFetchOptions = Object.create(null)): IFetchOptions {
    if (url.indexOf(get('node')) === 0 && isEmpty(options.credentials) && options.method !== 'POST') {
        options.credentials = 'include';
    }
    return options;
}

export interface IRequestParams<T> {
    url?: string;
    data?: object;
    method?: () => Promise<T>;
    fetchOptions?: IFetchOptions;
}

declare const fetch: (url: string, options?: IFetchOptions) => Promise<any>;

export interface IFetchOptions {
    method?: 'POST' | 'GET';
    headers?: object;
    credentials?: string;
    body?: string;
}
