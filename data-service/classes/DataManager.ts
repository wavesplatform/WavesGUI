import { Money } from '@waves/data-entities';
import { IPollAPI, Poll } from '../utils/Poll';
import { balanceList } from '../api/assets/assets';
import { getReservedBalance } from '../api/matcher/getOrders';
import { IBalanceItem } from '../api/assets/interface';
import { IHash } from '../interface';
import { IOrder } from '../api/matcher/interface';
import { contains } from 'ts-utils';
import { MoneyHash } from '../utils/MoneyHash';
import { UTXManager } from './UTXManager';
import { getAliasesByAddress } from '../api/aliases/aliases';
import { PollControl } from './PollControl';


export class DataManager {

    public transactions: UTXManager = new UTXManager();
    public pollControl: PollControl<TPollHash>;
    private _address: string;

    constructor() {
        this.pollControl = new PollControl<TPollHash>(() => this._createPolls());
    }


    public applyAddress(address: string): void {
        this._address = address;
        this.pollControl.create();
        this.transactions.applyAddress(this._address);
    }

    public dropAddress() {
        this.pollControl.destroy();
        this.transactions.dropAddress();
    }

    public getBalances(): Promise<Array<IBalanceItem>> {
        return this.pollControl.getPollHash().balance.getDataPromise();
    }

    public getReservedInOrders(): Promise<IHash<Money>> {
        return this.pollControl.getPollHash().orders.getDataPromise();
    }

    public getAliasesPromise(): Promise<Array<string>> {
        return this.pollControl.getPollHash().aliases.getDataPromise();
    }

    public getLastAliases(): Array<string> {
        return this.pollControl.getPollHash().aliases.lastData || [];
    }

    private _getPollBalanceApi(): IPollAPI<Array<IBalanceItem>> {
        const get = () => {
            const hash = this.pollControl.getPollHash();
            const inOrdersHash = hash && hash.orders.lastData || Object.create(null);
            return balanceList(this._address, Object.create(null), inOrdersHash);
        };
        return { get, set: () => null };
    }

    private _getPollOrdersApi(): IPollAPI<IHash<Money>> {
        return {
            get: () => getReservedBalance(),
            set: () => null
        };
    }

    private _getPollAliasesApi(): IPollAPI<Array<string>> {
        return {
            get: () => getAliasesByAddress(this._address),
            set: () => null
        };
    }

    private _createPolls(): TPollHash {
        const balance = new Poll(this._getPollBalanceApi(), 1000);
        const orders = new Poll(this._getPollOrdersApi(), 1000);
        const aliases = new Poll(this._getPollAliasesApi(), 5000);

        return { balance, orders, aliases };
    }

}

type TPollHash = {
    balance: Poll<Array<IBalanceItem>>;
    orders: Poll<IHash<Money>>;
    aliases: Poll<Array<string>>;
}
