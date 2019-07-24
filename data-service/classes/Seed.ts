import { Adapter } from '@waves/signature-adapter';
import { seedUtils } from '@waves/waves-transactions';

Adapter.initOptions({ networkCode: (window as any).WavesApp.network.code.charCodeAt(0) });
export const Seed = seedUtils.Seed;
