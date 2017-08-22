import { Stream } from "stream";

export interface IMetaJSON {
    vendors: Array<string>;
    stylesheets: Array<string>;
    developmentScripts: Array<string>;
    configurations: {
        testnet: IConfItem;
        mainnet: IConfItem;
    }
}

export interface IPackageJSON {
    name: string;
    version: string;
    description: string;
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
    server: string;
    coinomat: string;
    matcher: string;
    datafeed: string;
}

export interface ITaskFunction {
    (name: string, deps: Array<string>): void;
    (name: string, deps: Array<string>, cb: ITaskCallback): void;
    (name: string, cb: ITaskCallback): void;
}

export interface ITaskCallback {
    (done?: () => void): Stream | void;
}
