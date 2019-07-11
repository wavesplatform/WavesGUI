import { Asset } from '@waves/data-entities';
import { IHash } from '../interface';
import { isPromise, toArray } from './utils';
import { BigNumber } from "@waves/data-entities/dist/libs/bignumber";

type TAssetORList = Asset | Array<Asset>;
type TIdOrList = string | Array<string>;
type TPromiseOrAsset<T> = Promise<T> | T;

export class AssetStorage {

    private _promiseHash: IHash<Promise<TAssetORList>> = Object.create(null);
    private _hash: IHash<Asset> = Object.create(null);


    public getAssets(idList: Array<string>, getMethod: (idList: Array<string>) => Promise<Array<Asset>>): Promise<Array<Asset>> {
        const promiseHash = idList.reduce((result, assetId) => {
            if (this._promiseHash[assetId]) {
                result[assetId] = this._promiseHash[assetId];
            }
            return result;
        }, Object.create(null));
        const noCachedList = idList.filter((assetId) => {
            return !promiseHash[assetId] && !this._hash[assetId];
        });
        const loadedIdList = Object.keys(promiseHash);
        if (loadedIdList.length) {
            const promiseList = loadedIdList.map((id) => promiseHash[id]);
            const newRequestPromise = this._getNewRequestPromise(noCachedList, getMethod);

            promiseList.push(newRequestPromise);
            return Promise.all(promiseList).then(() => idList.map((id) => this._hash[id]));
        } else {
            if (noCachedList.length) {
                const newRequestPromise = this._getNewRequestPromise(noCachedList, getMethod);

                return newRequestPromise.then(() => idList.map((id) => this._hash[id]));
            } else {
                return Promise.resolve(idList.map((id) => this._hash[id]));
            }
        }
    }

    public updateAsset(id: string, quantity: BigNumber, reissuable: boolean) {
        if (this._hash[id]) {
            const asset = this._hash[id];

            if (asset.reissuable !== reissuable || !quantity.eq(asset.quantity)) {
                const info = {
                    id,
                    ticker: asset.ticker,
                    name: asset.name,
                    precision: asset.precision,
                    description: asset.description,
                    height: asset.height,
                    timestamp: asset.timestamp,
                    sender: asset.sender,
                    hasScript: asset.hasScript,
                    minSponsoredFee: asset.minSponsoredFee,
                    quantity,
                    reissuable
                };
                this._hash[id] = new Asset(info);
            }
        }
    }

    public save(idList: TIdOrList, data: TPromiseOrAsset<TAssetORList>): void {
        if (isPromise(data)) {
            const list = toArray(idList);
            list.forEach((id) => {
                this._promiseHash[id] = data;
            });
            data.then((asset) => {
                const assetList = toArray(asset);
                assetList.forEach((asset) => {
                    delete this._promiseHash[asset.id];
                    this._hash[asset.id] = asset;
                });
            });
            data.catch(() => {
                list.forEach((id) => {
                    delete this._promiseHash[id];
                });
            });
        } else {
            const list = toArray(data);
            list.forEach((asset) => {
                delete this._promiseHash[asset.id];
                this._hash[asset.id] = asset;
            });
        }
    }

    private _getNewRequestPromise(idList: Array<string>, getMethod: (idList: Array<string>) => Promise<Array<Asset>>): Promise<Array<Asset>> {
        let newRequestPromise = idList.length ? getMethod(idList) : Promise.resolve([]);
        if (idList.length) {
            this.save(idList, newRequestPromise);
        }
        return newRequestPromise;
    }
}

export const assetStorage = new AssetStorage();
