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
import { getAliasesByAddress } from '../api/aliases/aliases';
import { defer, TDefer } from '../utils/utils';


export class DataManager {

    public transactions: UTXManager = new UTXManager();

    private _address: string;
    private _pollBlances: Poll<IPollData>;
    private _pollAliases: Poll<Array<string>>;
    private _txHash: IHash<Money>;
    private _ordersHash: IHash<Money>;


    public applyAddress(address: string): void {
        this._address = address;
        if (!this._pollBlances) {
            const apiBalance = this._getPollBalanceApi();
            const apiAliasList = this._getPollAliasListApi();
            this._pollBlances = new Poll<IPollData>(apiBalance, 1000);
            this._pollAliases = new Poll<Array<string>>(apiAliasList, 5000);
        } else {
            this._pollBlances.restart();
            this._pollAliases.restart();
        }
        this.transactions.applyAddress(this._address);
    }

    public dropAddress() {
        this._address = null;
        if (this._pollBlances) {
            this._pollBlances.destroy();
            this._pollBlances = null;
        }
        if (this._pollAliases) {
            this._pollAliases.destroy();
            this._pollAliases = null;
        }
        this.transactions.dropAddress();
    }

    public getBalances(): Promise<Array<IBalanceItem>> {
        return this._pollBlances.getDataPromise().then((data) => data.balanceList);
    }

    public getOrders(): Promise<Array<IOrder>> {
        return this._pollBlances.getDataPromise().then((data) => data.orders);
    }

    public getAliasesPromise(): Promise<Array<string>> {
        return this._pollAliases.getDataPromise();
    }

    public getLastAliases(): Array<string> {
        return this._pollAliases.lastData || [];
    }

    private _getPollBalanceApi(): IPollAPI<IPollData> {
        return {
            get: () => Promise.all([
                balanceList(this._address, Object.create(null), this._ordersHash || Object.create(null)),
                this._getOrders()
            ]).then(([balanceList, orders]) => ({ balanceList, orders })),
            set: () => null
        };
    }

    private _getPollAliasListApi(): IPollAPI<Array<string>> {
        return {
            get: () => getAliasesByAddress(this._address),
            set: () => null
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
