import { IHash } from '../interface';
import { Money } from '@waves/data-entities';
import { listUTX } from '../api/transactions/transactions';
import { T_TX } from '../api/transactions/interface';
import { IPollAPI, Poll } from '../utils/Poll';
import { MoneyHash } from '../utils/MoneyHash';
import { TRANSACTION_TYPE_NUMBER } from '@waves/signature-adapter';


export class UTXManager {

    private _address: string;
    private _txList: Array<T_TX> = [];
    private _txHash: IHash<Money> = Object.create(null);
    private _poll: Poll<Array<T_TX>>;


    public applyAddress(address: string): void {
        this._address = address;
        this._txList = [];
        this._txHash = Object.create(null);
        this._getTransactionsFromUTX();
    }

    public dropAddress(): void {
        this._address = null;
        this._txList = [];
        this._txHash = Object.create(null);
        this._removePoll();
    }

    private _getTransactionsFromUTX() {
        return listUTX(this._address).then(this._applyUTXList.bind(this));
    }

    private _applyUTXList(list) {
        if (list.length) {
            this._createPoll();
            this._txList = list;
            this._updateTxMoneyHash();
        } else {
            this._removePoll();
        }
    }

    private _removePoll() {
        if (this._poll) {
            this._poll.destroy();
            this._poll = null;
        }
    }

    private _createPoll() {
        if (!this._poll) {
            this._poll = new Poll<Array<T_TX>>(this._getPollAPI(), 1000);
        }
    }

    private _getPollAPI(): IPollAPI<Array<T_TX>> {
        return {
            get: () => listUTX(this._address),
            set: this._applyUTXList.bind(this)
        };
    }

    private _updateTxMoneyHash() {

        const moneyList = this._txList.reduce((moneyList, tx: any) => {
            moneyList.push(tx.fee);

            switch (tx.type) {
                case TRANSACTION_TYPE_NUMBER.TRANSFER:
                    moneyList.push(tx.amount);
                    break;
                case TRANSACTION_TYPE_NUMBER.LEASE:
                    moneyList.push(tx.amount);
                    break;
                case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
                    moneyList.push(tx.totalAmount);
                    break;
            }

            return moneyList;
        }, []);

        const hash = new MoneyHash(moneyList).toHash();

        if (!this._isEqualHash(hash)) {
            this._txHash = hash;
        }
    }

    private _isEqualHash(hash: IHash<Money>): boolean {
        const newIdList = Object.keys(hash);
        const myIdList = Object.keys(this._txHash);

        const isEqualLength = newIdList.length === myIdList.length;

        return isEqualLength && (!myIdList.length || myIdList.every((id) => hash[id] && this._txHash[id].eq(hash[id])));
    }

}
