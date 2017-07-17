
export interface IMteaJSON {
    vendors: Array<string>;
    stylesheets: Array<string>;
    developScripts: Array<string>;
    configurations: {
        testnet: {
            name: string;
            code: string;
            server: string;
            coinomat: string;
            matcher: string;
            datafeed: string;
        };
        mainnet: {
            name: string;
            code: string;
            server: string;
            coinomat: string;
            matcher: string;
            datafeed: string;
        };
        devnet: {
            name: string;
            code: string;
            server: string;
            coinomat: string;
            matcher: string;
            datafeed: string;
        };
        chrome: {
            testnet: {
                name: string;
            };
            mainnet: {
                name: string;
            }
        };
        desktop: {
            testnet: {
                name: string;
            };
            mainnet: {
                name: string;
            }
        }
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
