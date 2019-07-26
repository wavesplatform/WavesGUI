import { Stream } from 'stream';

export interface IMetaJSON {
    vendors: Array<string>;
    exportPageVendors: Array<string>;
    stylesheets: Array<string>;
    domain: string;
    copyNodeModules: Array<string>;
    debugInjections: Array<string>;
    electronScripts: Array<string>;
    analyticsIframe: string;
    langList: object,
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
    server: string;
    license: string;
    devDependencies: IHash<string>;
    scripts: IHash<string>;
    dependencies: IHash<string>;
}

export interface IHash<T> {
    [key: string]: T;
}

export interface IConfItem {
    tradingPairs: Array<Array<string, string>>;
    oracles: object;
    apiVersion: string;
    code: string;
    bankRecipient: string;
    node: string;
    matcher: string;
    api: string;
    explorer: string;
    coinomat: string;
    support: string;
    nodeList: string;
    scamListUrl: string;
    tokensNameListUrl: string;
    featuresConfigUrl: string;
    origin: string;
    assets: IHash<string>;
    feeConfigUrl: string;
    analyticsIframe: string;
}

export type TConnection = 'mainnet' | 'testnet';
export type TBuild = 'development' | 'production';
export type TPlatform = 'web' | 'desktop';
