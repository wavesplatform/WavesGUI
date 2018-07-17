import * as assetsApi from './assets/assets';
import * as transactionsApi from './transactions/transactions';
import { parseTx } from './transactions/parse';
import * as utilsFunctions from '../utils/utils';
import { request } from '../utils/request';
import { assetStorage } from '../utils/AssetStorage';
import { height } from './node/node';
import { get as getOrderBook } from './matcher/orderBook';
import { addSignature, clearSignature, getOrders, getOrdersByPair, signatureTimeout } from './matcher/getOrders';
import { getAddressByAlias, getAliasesByAddress } from './aliases/aliases';
import * as pairsModule from './pairs/pairs';


export const aliases = { getAliasesByAddress, getAddressByAlias };

export const node = { height };

export const matcher = {
    getOrderBook, getOrdersByPair, addSignature, clearSignature, getOrders, signatureTimeout
};

export const assets = { ...assetsApi };

export const transactions = { ...transactionsApi, parseTx };

export const utils = { ...utilsFunctions, request, assetStorage };

export const pairs = {
    ...pairsModule
};
