import { Adapter } from '@waves/signature-adapter';
import { seedUtils } from '@waves/waves-transactions';

Adapter.initOptions({ networkCode: (window as any).WavesApp.network.code.charCodeAt(0) });

export class Seed {
    constructor(seed, code) {
        return new seedUtils.Seed(seed, code || (window as any).WavesApp.network.code);
    }
}
