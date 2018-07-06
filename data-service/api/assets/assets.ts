import { Asset, Money, BigNumber } from '@waves/data-entities';
import { get as configGet, getDataService } from '../../config';
import { request } from '../../utils/request';
import { IBalanceItem, assetsApi } from './interface';
import { WAVES_ID } from '@waves/waves-signature-generator';
import { assetStorage } from '../../utils/AssetStorage';
import { normalizeAssetId, toArray, toHash } from '../../utils/utils';
import { IHash } from '../../interface';

const MAX_ASSETS_IN_REQUEST = 30;

export function get(id: string): Promise<Asset>;
export function get(idList: Array<string>): Promise<Array<Asset>>;

export function get(assets: string | Array<string>): Promise<any> {
    if (toArray(assets).some((id) => id.length < 4)) {
        debugger;
    }
    return assetStorage.getAssets(toArray(assets), getAssetRequestCb)
        .then((list) => {
            if (typeof assets === 'string') {
                return list[0];
            } else {
                return list;
            }
        });
}

export function getAssetFromNode(assetId: string): Promise<Asset> {
    return request<INodeAssetData>({ url: `${configGet('node')}/assets/details/${assetId}` })
        .then((data) => new Asset({
            id: data.assetId,
            name: data.name,
            description: data.description,
            height: data.issueHeight,
            precision: data.decimals,
            quantity: data.quantity,
            reissuable: data.reissuable,
            sender: data.issuer,
            timestamp: new Date(data.issueTimestamp)
        }));
}

export function balanceList(address: string, txHash?: IHash<Money>, ordersHash?: IHash<Money>): Promise<Array<IBalanceItem>> {
    return Promise.all([
        wavesBalance(address),
        assetsBalance(address)
    ])
        .then(([waves, balances]) => applyTxAndOrdersDif([waves].concat(balances), txHash, ordersHash));
}

export function wavesBalance(address: string): Promise<IBalanceItem> {
    return Promise.all([
        get(WAVES_ID),
        request<assetsApi.IWavesBalance>({ url: `${configGet('node')}/addresses/balance/details/${address}` })
    ]).then(([waves, details]) => remapWavesBalance(waves, details));
}

export function assetsBalance(address: string): Promise<Array<IBalanceItem>> {
    return request({ url: `${configGet('node')}/assets/balance/${address}` })
        .then((data: assetsApi.IBalanceList) => {
            return getAssetsByBalanceList(data)
                .then((assets) => {
                    const hash = toHash(assets, 'id');
                    return remapAssetsBalance(data, hash);
                });
        });
}

export function remapWavesBalance(waves: Asset, data: assetsApi.IWavesBalance): IBalanceItem {
    const inOrders = new Money(0, waves);
    const regular = new Money(data.regular, waves);
    const available = new Money(data.available, waves);
    const leasedOut = new Money(data.regular, waves).sub(available);
    const leasedIn = new Money(data.effective, waves).sub(available);

    return {
        asset: waves,
        regular,
        available,
        inOrders,
        leasedOut,
        leasedIn
    };
}

export function remapAssetsBalance(data: assetsApi.IBalanceList, assetsHash: IHash<Asset>): Array<IBalanceItem> {
    return data.balances.map((balance) => {
        const asset = assetsHash[balance.assetId];
        const inOrders = new Money(new BigNumber('0'), asset);
        const regular = new Money(new BigNumber(balance.balance), asset);
        const available = regular.sub(inOrders);
        const empty = new Money(new BigNumber('0'), asset);
        return {
            asset,
            regular,
            available,
            inOrders,
            leasedOut: empty,
            leasedIn: empty
        };
    }).sort(((a, b) => a.asset.name > b.asset.name ? 1 : a.asset.name === b.asset.name ? 0 : -1));
}

export function applyTxAndOrdersDif(balance: IBalanceItem, txHash?: IHash<Money>, ordersHash?: IHash<Money>): IBalanceItem;
export function applyTxAndOrdersDif(balance: Array<IBalanceItem>, txHash?: IHash<Money>, ordersHash?: IHash<Money>): Array<IBalanceItem>;
export function applyTxAndOrdersDif(balance: IBalanceItem | Array<IBalanceItem>, txHash?: IHash<Money>, ordersHash?: IHash<Money>): IBalanceItem | Array<IBalanceItem> {
    const list = toArray(balance);
    txHash = txHash || Object.create(null);
    ordersHash = ordersHash || Object.create(null);
    list.forEach((balance) => {
        balance.regular = moneyDif(balance.regular, txHash[balance.asset.id]);
        balance.available = moneyDif(balance.available, txHash[balance.asset.id], ordersHash[balance.asset.id]);
        balance.inOrders = ordersHash[balance.asset.id] || new Money(new BigNumber(0), balance.asset);
    });
    if (Array.isArray(balance)) {
        return list;
    }
    return list[0];
}

export function moneyDif(target: Money, ...toDif: Array<Money>): Money {
    const result = toDif.filter(Boolean).reduce((result, toSub) => {
        return result.sub(toSub);
    }, target);
    if (result.getTokens().lt(0)) {
        return result.cloneWithCoins('0');
    } else {
        return result;
    }
}

export function getAssetsByBalanceList(data: assetsApi.IBalanceList): Promise<Array<Asset>> {
    return get(data.balances.map((balance) => normalizeAssetId(balance.assetId)));
}

const splitRequest = (list: string[], getData) => {

    const newList = [...list];
    const requests = [];

    while (newList.length) {
        const listPart = newList.splice(0, MAX_ASSETS_IN_REQUEST);
        requests.push(getData(listPart));
    }

    return Promise.all(requests).then((results) => {
        let data = [];
        for (const items of results) {
            data = [...data, ...items.data];
        }
        return {data: data};
    });
};

const getAssetRequestCb = (list: Array<string>): Promise<Array<Asset>> => {
    const ds = getDataService();
    return splitRequest(list as any, ds.getAssets as any)
        .then((response) => {
            const assets = response.data;
            const fails = [];

            list.forEach((id, index) => {
                if (!assets[index]) {
                    fails.push(id);
                }
            });

            return Promise.all(fails.map(getAssetFromNode))
                .then((reloadedAssets) => {
                    let failCount = 0;
                    return list.map((id, index) => {
                        if (assets[index]) {
                            return assets[index];
                        } else {
                            return reloadedAssets[failCount++];
                        }
                    });
                });
        });
};

export interface INodeAssetData {
    assetId: string;
    complexity: number;
    decimals: number;
    description: string;
    extraFee: number;
    issueHeight: number;
    issueTimestamp: number;
    issuer: string;
    name: string;
    quantity: string | number;
    reissuable: boolean;
}
