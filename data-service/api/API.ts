import * as assetsApi from './assets/assets';
import * as transactionsApi from './transactions/transactions';
import { parseTx, parseExchangeOrder, getAssetsHashFromTx } from './transactions/parse';
import * as utilsFunctions from '../utils/utils';
import { request } from '../utils/request';
import { assetStorage } from '../utils/AssetStorage';
import { height } from './node/node';
import { get as getOrderBook } from './matcher/orderBook';
import {
    addSignature,
    clearSignature,
    getOrders,
    getOrdersByPair,
    signatureTimeout,
    factory
} from './matcher/getOrders';
import * as addressModule from './address';
import { getLastPrice } from './matcher/getLastPrice';
import { getAddressByAlias, getAliasesByAddress } from './aliases/aliases';
import { getFeeRates, getSettings } from './matcher/getSettings';
import * as pairsModule from './pairs/pairs';
import * as ratingModule from './rating/rating';
import * as dataModule from './data';


export const aliases = { getAliasesByAddress, getAddressByAlias };

export const node = { height };

export const matcher = {
    getOrderBook, getOrdersByPair, addSignature, clearSignature, getOrders, signatureTimeout, factory, getLastPrice,
    getFeeRates, getSettings
};

export const assets = { ...assetsApi };

export const transactions = { ...transactionsApi, parseTx, parseExchangeOrder, getAssetsHashFromTx };

export const utils = { ...utilsFunctions, request, assetStorage };

export const pairs = {
    ...pairsModule
};

export const rating = {
    ...ratingModule
};

export const data = {
    ...dataModule
};

export const address = addressModule;
