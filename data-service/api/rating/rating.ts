// import { AssetPair, Money, BigNumber, OrderPrice } from '@waves/data-entities';
import { request } from '../../utils/request';
import { toArray } from '../../utils/utils';
// import { get } from '../../config';


// export function getAssetRating(assets: string | Array<string>): Promise<Array<Number>> {
export function getAssetsRating(assets: string | Array<string>) {
    return Promise.all(toArray(assets).map(id => request({
        url: `https://tokenrating.philsitumorang.com/api/v1/token/${id}`
    })))
        .then(tokensList => {
            return tokensList.map(({token}) => {
                return token ? token.averageScore : null;
            })
        });
}