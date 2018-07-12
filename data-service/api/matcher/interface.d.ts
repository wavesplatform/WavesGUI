import { IAssetPair } from '../../interface';
import { Money, AssetPair } from '@waves/data-entities';

export type TOrderStatus = 'Accepted' | 'Cancelled' | 'PartiallyFilled' | 'Filled';
export type TOrderType = 'buy' | 'sell';

export module api {
    export interface IOrder {
        amount: string;
        price: string
        filled: string;
        assetPair: IAssetPair;
        id: string;
        status: TOrderStatus;
        timestamp: number;
        type: TOrderType
    }
}

export interface IOrder {
    amount: Money;
    price: Money;
    filled: Money;
    total: Money;
    assetPair: AssetPair;
    id: string;
    progress: number;
    status: TOrderStatus;
    timestamp: Date;
    isActive: boolean;
    type: TOrderType
}
