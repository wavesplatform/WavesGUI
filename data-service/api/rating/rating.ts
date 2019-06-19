// import { AssetPair, Money, BigNumber, OrderPrice } from '@waves/data-entities';
import { request } from '../../utils/request';
import { ITokenRating, IParsedRating } from '../../interface';
import { stringifyJSON, toArray } from '../../utils/utils';
// import { get } from '../../config';

const ratingApiUrl = 'https://tokenrating.wavesexplorer.com/api/v1';

export function getAssetsRating(assets: string | Array<string>): Promise<Array<IParsedRating>> {
    return request(
        {
            url: `${ratingApiUrl}/token/`,
            fetchOptions: {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                body: stringifyJSON({
                    "assetIds": toArray(assets),
                    "page": 1,
                    "limit": 25
                })
            }
        })
        .then((tokensList: any) => {
            return Object.values(tokensList).map((ratingItem: ITokenRating) => {
                return {
                    assetId: ratingItem.assetId,
                    rating: ratingItem.averageScore
                };
            })
        });
}