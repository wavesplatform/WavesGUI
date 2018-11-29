import { toArray } from './utils/utils';
import { IOrder } from './api/matcher/interface';
import { pipe, concat, eqProps, uniqBy, prop, differenceWith, tap } from 'ramda';

export type TStore<T> = Array<IStoreContainerItem<T>>;

const ordersStore: Array<IStoreContainerItem<IOrder>> = [];
const toRemoveOrders: Array<IStoreContainerItem<IOrder>> = [];

function createAddStore<T>(container: TStore<T>, timeout: number) {
    return (item: T | Array<T>) => {
        toArray(item).forEach((item) => {
            const storeItem = {
                data: item,
                expiration: window.setTimeout(() => {
                    container.splice(container.indexOf(storeItem), 1);
                }, timeout)
            };
            container.push(storeItem);
        });
        return item;
    };
}

function removeFromStoreById<T>(container: TStore<T>, idKey: keyof T, item: Partial<T>) {
    const id = item[idKey];
    for (let i = container.length - 1; i >= 0; i--) {
        if (container[i].data[idKey] === id) {
            window.clearTimeout(container[i].expiration);
            container.splice(i, 1);
            break;
        }
    }
}

function createClearStore<T>(addContainer: TStore<T>, addRemoveF: IRemoveOrderFunc<Partial<T>>, idKey: keyof T) {
    return (item: Partial<T> | Array<Partial<T>>) => {
        toArray(item).forEach((item) => {
            removeFromStoreById(addContainer, idKey, item);
        });
        addRemoveF(item);
        return item;
    };
}

function createProcessStore<T>(toAddContainer: TStore<T>, toRemoveContainer: TStore<T>, idKey: string): (list: Array<T>) => Array<T> {
    return pipe(
        list => concat(toAddContainer.map(prop('data')), list),
        list => differenceWith(eqProps(idKey), list, toRemoveContainer.map(prop('data'))) as any,
        uniqBy(prop(idKey) as any)
    );
}

const addToRemoveStore = createAddStore(toRemoveOrders, 10000);
export const addOrderToStore = createAddStore(ordersStore, 10000);
export const removeOrderFromStore = createClearStore(ordersStore, addToRemoveStore, 'id');
export const processOrdersWithStore = createProcessStore(ordersStore, toRemoveOrders, 'id');

export interface IStoreContainerItem<T> {
    data: T;
    expiration: number;
}

interface IRemoveOrderFunc<T> {
    (item: T | Array<T>): T | Array<T>;
}
