import { uniqBy, prop } from 'ramda';
import { T_TX } from './api/transactions/interface';
import { IOrder } from './api/matcher/interface';


const transactions: Array<T_TX> = [];
const orders: Array<IOrder> = [];

const add = container => timeout => content => {
    container.push(content);
    setTimeout(() => {
        const index = container.indexOf(content);
        container.splice(index, 1);
    }, timeout);
    return content;
};

export const addOrder: IAddOrder = add(orders)(5000);
export const addTransaction: IAddTransaction = add(transactions)(5000);

export const processOrders = (list: Array<IOrder>): Array<IOrder> => {
    return uniqBy(prop('id'), orders.concat(list)) as any;
};

export interface IAddOrder {
    (order: IOrder): IOrder;
}

export interface IAddTransaction {
    (tx: T_TX): T_TX;
}
