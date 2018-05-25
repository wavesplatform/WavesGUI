import { Money } from '@waves/data-entities';
import { IPollAPI, Poll } from '../utils/Poll';
import { balanceList } from '../api/assets/assets';
import { hasSignature, getOrders } from '../api/matcher/getOrders';
import { IBalanceItem } from '../api/assets/interface';
import { IHash } from '../interface';
import { IOrder } from '../api/matcher/interface';
import { contains } from 'ts-utils';
import { MoneyHash } from '../utils/MoneyHash';
import { UTXManager } from './UTXManager';


export class BalanceManager {

    public balanceList: Array<IBalanceItem>;
    public orders: Array<IOrder>;
    public transactions: UTXManager = new UTXManager();

    private _address: string;
    private _poll: Poll<IPollData>;
    private _txHash: IHash<Money>;
    private _ordersHash: IHash<Money>;


    public applyAddress(address: string): void {
        this._address = address;
        if (!this._poll) {
            const api = this._getPollBalanceApi();
            this._poll = new Poll<IPollData>(api, 1000);
        } else {
            this._poll.restart();
        }
        this.transactions.applyAddress(this._address);
    }

    public dropAddress() {
        this._address = null;
        if (this._poll) {
            this._poll.destroy();
            this._poll = null;
        }
        this.transactions.dropAddress();
    }


    private _getPollBalanceApi(): IPollAPI<IPollData> {
        return {
            get: () => Promise.all([
                balanceList(this._address),
                this._getOrders()
            ]).then(([balanceList, orders]) => ({ balanceList, orders })),
            set: (data) => {
                this.balanceList = data.balanceList;
                this.orders = data.orders;
            }
        };
    }

    private _getOrders(): Promise<Array<IOrder>> {
        if (hasSignature()) {
            return getOrders().then((orders) => {
                this._updateInOrdersHash(orders);
                return orders;
            });
        } else {
            return Promise.resolve([]);
        }
    }

    private _updateInOrdersHash(orders: Array<IOrder>): void {
        const hash = new MoneyHash();

        orders.filter(contains({ isActive: true })).forEach((order) => {
            const amountWithoutFilled = order.amount.sub(order.filled);

            switch (order.type) {
                case 'sell':
                    hash.add(amountWithoutFilled);
                    break;
                case 'buy':
                    const amountForSell = amountWithoutFilled.getTokens().times(order.price.getTokens());
                    hash.add(order.price.cloneWithTokens(amountForSell));
                    break;
            }
        });

        this._ordersHash = hash.toHash();
    }

}

interface IPollData {
    balanceList: Array<IBalanceItem>;
    orders: Array<IOrder>;
}
