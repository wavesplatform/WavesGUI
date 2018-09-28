import { Asset, Money } from '@waves/data-entities';
import { txApi as txApi } from '../transactions/interface';

export module assetsApi {

    export interface IBalanceList {
        address: string;
        balances: Array<IBalanceItem>
    }

    export interface IBalanceItem {
        assetId: string;
        balance: string;
        issueTransaction: txApi.IIssue;
        quantity: string;
        reissuable: boolean;
        sponsorBalance: string | number | void;
        minSponsoredAssetFee: string | number | void;
    }

    export interface IWavesBalance {
        address: string;
        available: string;
        effective: string;
        generating: string;
        regular: string;
    }
}

export interface IBalanceItem {
    asset: Asset;
    regular: Money;
    available: Money;
    inOrders: Money;
    leasedOut: Money;
    leasedIn: Money;
}
