import { Adapter, getAdapterByType, adapterList, AdapterType } from '@waves/signature-adapter';

export interface IUserData {
    userType: AdapterType;
    address: string;
    networkByte: number;
    seed?: string;
    id?: string;
    privateKey?: string;
    publicKey?: string;
}

let API: Adapter;
let _userData: IUserData;

export function setSignatureApi(api: Adapter) {
    API = api;
}

export function dropSignatureApi() {
    API = null;
}

export function setUserData(userData: IUserData) {
    _userData = userData;
}

export function dropUserData() {
    _userData = null;
}

export function getUserAddress() {
    return _userData ? _userData.address : '';
}

export function getSignatureApi(): Adapter {
    if (API === null || API.isDestroyed()) {
        try {
            const ConcreteAdapter = getAdapterByType(_userData.userType);

            switch (_userData.userType) {
                case AdapterType.Seed:
                    setSignatureApi(new ConcreteAdapter(_userData.seed, _userData.networkByte));
                    break;
                case AdapterType.PrivateKey:
                    setSignatureApi(new ConcreteAdapter(_userData.privateKey, _userData.networkByte));
                    break;
                default:
                    setSignatureApi(new ConcreteAdapter(_userData, _userData.networkByte));
            }
        } catch (e) {
            return API;
        }
    }

    return API;
}

export function getDefaultSignatureApi(user): Adapter {

    const encryptionRounds = user.settings.get('encryptionRounds');
    const userData = { ...user, encryptionRounds };
    const Adapter = getAdapterByType(user.userType) ||
        getAdapterByType(adapterList[0].type);

    return new Adapter(userData);
}
