// import { AssetPair, Money, BigNumber, OrderPrice } from '@waves/data-entities';
import { request } from '../../utils/request';
import { ITokenRating } from '../../interface';
import { stringifyJSON, toArray } from '../../utils/utils';
// import { get } from '../../config';


// export function getAssetRating(assets: string | Array<string>): Promise<Array<Number>> {
export function getAssetsRating(assets: string | Array<string>) {
    return request(
        {
            url: `https://tokenrating.wavesexplorer.com/api/v1/token/`,
            fetchOptions: {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                // body: stringifyJSON(toArray(assets))
                body: stringifyJSON({
                    "assetIds": toArray(assets)
                })
            }
        })
        .then((data: any) => {
            const tokensList = JSON.parse(data);
            return tokensList.map((ratingItem: ITokenRating) => {
                return ratingItem.averageScore;
            })
        });
}