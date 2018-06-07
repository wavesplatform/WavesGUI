import { Asset, AssetPair } from '@waves/data-entities';
import { getDataService } from '../../config';
import { request } from '../../utils/request';
import { get as getAsset } from '../assets/assets';
import { createOrderPair, MAINNET_DATA } from '@waves/assets-pairs-order';

export function get(assetId1: string | Asset, assetId2: string | Asset): Promise<AssetPair> {
    return getAsset([toId(assetId1), toId(assetId2)])
        .then(([asset1, asset2]) => {
            const hash = {
                [asset1.id]: asset1,
                [asset2.id]: asset2
            };
            const [amountAssetId, priceAssetId] = createOrderPair(MAINNET_DATA, asset1.id, asset2.id);
            return new AssetPair(hash[amountAssetId], hash[priceAssetId]);
        });
}

export function info(...pairs: AssetPair[]) {
    return request({
        method: () => getDataService().getPairs(...pairs)
    });
}

function toId(asset: string | Asset): string {
    return typeof asset === 'string' ? asset : asset.id;
}
