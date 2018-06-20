import { utils, libs, config } from '@waves/waves-signature-generator';
import dictionary from '../utils/seedDictionary';
import { get } from '../config';
import { IKeyPair } from '../interface';

config.set({
    networkByte: (window as any).WavesApp.network.code.charCodeAt(0)
});

export class Seed {

    public readonly phrase: string;
    public readonly address: string;
    public readonly keyPair: IKeyPair;

    constructor(phrase: string) {
        if (phrase.length < get('minimalSeedLength')) {
            throw new Error('Your seed length is less than allowed in config');
        }

        const keys = utils.crypto.buildKeyPair(phrase);

        this.phrase = phrase;
        this.address = utils.crypto.buildRawAddress(keys.publicKey);
        this.keyPair = {
            privateKey: libs.base58.encode(keys.privateKey),
            publicKey: libs.base58.encode(keys.publicKey)
        };

        Object.freeze(this);
        Object.freeze(this.keyPair);

    }

    public encrypt(password: string, encryptionRounds?: number) {
        return Seed.encryptSeedPhrase(this.phrase, password, encryptionRounds);
    }

    public static encryptSeedPhrase(seedPhrase: string, password: string, encryptionRounds: number = 5000): string {
        if (password && password.length < 8) {
            // logger.warn('Your password may be too weak');
        }

        if (encryptionRounds < 1000) {
            // logger.warn('Encryption rounds may be too few');
        }

        if (seedPhrase.length < get('minimalSeedLength')) {
            throw new Error('The seed phrase you are trying to encrypt is too short');
        }

        return utils.crypto.encryptSeed(seedPhrase, password, encryptionRounds);
    }

    public static decryptSeedPhrase(encryptedSeedPhrase: string, password: string, encryptionRounds: number = 5000): string {

        const wrongPasswordMessage = 'The password is wrong';

        let phrase;

        try {
            phrase = utils.crypto.decryptSeed(encryptedSeedPhrase, password, encryptionRounds);
        } catch (e) {
            throw new Error(wrongPasswordMessage);
        }

        if (phrase === '' || phrase.length < get('minimalSeedLength')) {
            throw new Error(wrongPasswordMessage);
        }

        return phrase;

    }

    public static create(words: number = 15): Seed {
        const phrase = Seed._generateNewSeed(words);
        const minimumSeedLength = get('minimalSeedLength');

        if (phrase.length < minimumSeedLength) {
            // If you see that error you should increase the number of words in the generated seed
            throw new Error(`The resulted seed length is less than the minimum length (${minimumSeedLength})`);
        }

        return new Seed(phrase);
    }

    private static _generateNewSeed(length: number): string {

        const random = utils.crypto.generateRandomUint32Array(length);
        const wordCount = dictionary.length;
        const phrase = [];

        for (let i = 0; i < length; i++) {
            const wordIndex = random[i] % wordCount;
            phrase.push(dictionary[wordIndex]);
        }

        random.set(new Uint8Array(random.length));

        return phrase.join(' ');

    }

}
