import { request } from '../../utils/request';
import { get } from '../../config';
import { indexBy, prop } from 'ramda';
import { IOracleData } from '../../classes/DataManager';


export function getDataFields(address: string): Promise<Array<IDataTransactionField>> {
    return request({ url: `${get('node')}/addresses/data/${address}` });
}

export function getOracleData(address: string): Promise<IOracleData> {
    return getDataFields(address)
        .then(indexBy(prop('key')))
        .then(hash => {

            const oracle = getOracleInfo(hash);
            const assets = indexBy(prop('id'), getOracleAssets(hash)) as any;

            return { oracle, assets };
        });
}

function getOracleInfo(hash: Record<string, IDataTransactionField>): IOracleData['oracle'] {
    const name = getValue(hash[ORACLE_RESERVED_FIELDS.NAME]) as string;
    const site = getValue(hash[ORACLE_RESERVED_FIELDS.SITE]) as string;
    const email = getValue(hash[ORACLE_RESERVED_FIELDS.MAIL]) as string;
    const logoType = getValue(hash[ORACLE_RESERVED_FIELDS.LOGO_META]) as string || '';
    const logoBase = getValue(hash[ORACLE_RESERVED_FIELDS.LOGO]) as string || '';
    const logo = `${logoType}${logoBase.replace('base64:', '')}`;

    const description = {
        en: getValue(hash[`${ORACLE_RESERVED_FIELDS.DESCRIPTION}_<en>`])
    } as any;

    return { name, site, email, logo, description };
}

function getAssetIdFromStatusKey(key: string): string | null {
    const start = ORACLE_ASSET_FIELD_PATTERN.STATUS.replace(PATTERNS.ASSET_ID, '');
    if (key.indexOf(start) !== 0) {
        return null;
    }
    const id = (key.match(/<(.+)?>/) || [])[1];

    return id || null;
}


function getOracleAssets(hash: Record<string, IDataTransactionField>): any {
    return Object.keys(hash)
        .map(getAssetIdFromStatusKey)
        .filter(Boolean)
        .map(id => {
            const description = {
                en: getValue(hash[getDescriptionField(id, 'en')])
            };
            const status = getValue(hash[replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.STATUS, id)]) as number;
            const site = getValue(hash[replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.SITE, id)]) as string;
            const email = getValue(hash[replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.EMAIL, id)]) as string;
            const ticker = getValue(hash[replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.TICKER, id)]) as string;

            const logoType = getValue(hash[replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.LOGO_META, id)]) as string || '';
            const logoBase = getValue(hash[replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.LOGO, id)]) as string || '';

            const logo = `${logoType}${logoBase.replace('base64:', '')}`;

            return { id, status, email, site, ticker, logo, description };
        });
}

function replaceAssetID(key: string, id: string): string {
    return key.replace(PATTERNS.ASSET_ID, `<${id}>`);
}

function getValue(field?: IDataTransactionField) {
    return field && field.value;
}

export interface IDataTransactionField {
    type: DATA_TRANSACTION_FIELD_TYPE;
    key: string;
    value: string | boolean | number;
}

export const enum DATA_TRANSACTION_FIELD_TYPE {
    INTEGER = 'integer',
    BOOLEAN = 'boolean',
    STRING = 'string',
    BINARY = 'binary'
}

export const enum ORACLE_RESERVED_FIELDS {
    NAME = 'oracle_name',
    SITE = 'oracle_site',
    LOGO = 'oracle_logo',
    LOGO_META = 'oracle_logo_meta',
    MAIL = 'oracle_mail',
    DESCRIPTION = 'oracle_description',
    LANG_LIST = 'oracle_lang_list'
}


export const enum ORACLE_ASSET_FIELD_PATTERN {
    STATUS = 'status_id_<ASSET_ID>',
    LOGO = 'logo_<ASSET_ID>',
    LOGO_META = 'logo_meta_<ASSET_ID>',
    DESCRIPTION = 'description_<LANG>_<ASSET_ID>',
    SITE = 'site_<ASSET_ID>',
    TICKER = 'ticker_<ASSET_ID>',
    EMAIL = 'email_<ASSET_ID>'
}

export const PATTERNS = {
    ASSET_ID: '<ASSET_ID>',
    LANG: '<LANG>'
};

export function getDescriptionField(id: string, lang: string): string {
    return replaceAssetID(ORACLE_ASSET_FIELD_PATTERN.DESCRIPTION, id).replace(PATTERNS.LANG, `<${lang}>`);
}
