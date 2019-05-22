import { Asset, AssetPair, Money } from '@waves/data-entities';
import { BigNumber } from '@waves/bignumber';
import { getDataService, matcherSettingsPromise } from '../../config';
import { request } from '../../utils/request';
import { get as getAsset } from '../assets/assets';
import { createOrderPair } from '@waves/assets-pairs-order';
import { WAVES_ID } from '@waves/signature-generator';
import { IPairJSON } from '@waves/data-service-client-js/src/types';
import { TMoneyInput } from '@waves/data-entities/dist/entities/Money';


export function get(assetId1: string | Asset, assetId2: string | Asset): Promise<AssetPair> {
    return matcherSettingsPromise.then(list => {

        return getAsset([toId(assetId1), toId(assetId2)])
            .then(([asset1, asset2]) => {
                const hash = {
                    [asset1.id]: asset1,
                    [asset2.id]: asset2
                };
                const [amountAssetId, priceAssetId] = createOrderPair(list, asset1.id, asset2.id);
                return new AssetPair(hash[amountAssetId], hash[priceAssetId]);
            });
    });
}

const remapPairInfo = (pairs: Array<AssetPair>, volumeFactory: (data: TMoneyInput) => Money) => (list: Array<IPairJSON>) => pairs.map((pair, index) => {
    const moneyOrNull = (pair: AssetPair) => (data: TMoneyInput): Money => data && Money.fromTokens(data, pair.priceAsset) || null;
    const change24F = (open, close) => ((!open || open.eq(0)) || !close) ? new BigNumber(0) : close.sub(open).div(open).mul(100).roundTo(2);
    const moneyFactory = moneyOrNull(pair);

    const data = list[index] || Object.create(null);

    const amountAsset = pair.amountAsset;
    const priceAsset = pair.priceAsset;
    const lastPrice = moneyFactory(data.lastPrice);
    const firstPrice = moneyFactory(data.firstPrice);
    const volume = volumeFactory(data.volumeWaves);
    let change24 = change24F(firstPrice && firstPrice.getTokens(), lastPrice && lastPrice.getTokens());

    if (change24.gt(1000)) {
        change24 = change24.roundTo(0);
    }

    const id = [amountAsset.id, priceAsset.id].sort().join();

    return { amountAsset, priceAsset, lastPrice, firstPrice, volume, change24, id };
});

export function info(...pairs: AssetPair[]) {
    return Promise.all([
        getAsset(WAVES_ID),
        request({ method: () => getDataService().getPairs(...pairs).then(response => response.data) })
    ]).then(([waves, list]) => {
        const factory = (data: TMoneyInput) => data && Money.fromTokens(data, waves) || null;
        return remapPairInfo(pairs, factory)(list);
    });
}

function toId(asset: string | Asset): string {
    return typeof asset === 'string' ? asset : asset.id;
}
