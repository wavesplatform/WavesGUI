import { Stream } from 'stream';

export interface IMetaJSON {
    vendors: Array<string>;
    stylesheets: Array<string>;
    domain: string;
    copyNodeModules: Array<string>;
    debugInjections: Array<string>;
    electronScripts: Array<string>;
    configurations: {
        testnet: IConfItem;
        mainnet: IConfItem;
    };
    tradingView: {
        domain: string;
        files: Array<string>;
    };
    electron: {
        createPackageJSONFields: Array<string>;
        defaults: object;
        server: string;
    }
}

export interface IPackageJSON {
    name: string;
    version: string;
    description: string;
    author: {
        name: string;
        email: string;
        url: string;
    };
    repository: {
        type: string;
        url: string;
    };
    license: string;
    devDependencies: IHash<string>;
    scripts: IHash<string>;
    dependencies: IHash<string>;
}

export interface IHash<T> {
    [key: string]: T;
}

export interface IConfItem {
    code: string;
    node: string;
    coinomat: string;
    matcher: string;
    datafeed: string;
}

export type TConnection = 'mainnet' | 'testnet';
export type TBuild = 'dev' | 'normal' | 'min';
export type TPlatform = 'web' | 'desktop';

export interface ITaskFunction {
    (name: string, deps: Array<string>): void;

    (name: string, deps: Array<string>, cb: ITaskCallback): void;

    (name: string, cb: ITaskCallback): void;
}

export interface ITaskCallback {
    (done?: (error?: any) => void): Stream | void;
}
