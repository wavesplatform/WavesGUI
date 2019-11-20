import { Bus, WindowAdapter, WindowProtocol, IOneArgFunction } from '@waves/waves-browser-bus';
import { delay } from '../utils/utils';
import { ConnectProvider } from './ConnectProvider';

interface PostMessageConnectProviderOptioins {
    win?: Window;
    mode?: 'export' | 'import';
    origins?: string[];
}

interface SendOptions {
    event?: string;
    timeout?: number;
    attempts?: number;
    mode?: 'listen' | 'dispatch'
}

export class PostMessageConnectProvider implements ConnectProvider {
    private adapter: WindowAdapter;
    private bus: Bus;
    private active: boolean;

    constructor(options: PostMessageConnectProviderOptioins = {}) {
        this.adapter = new WindowAdapter(
            [new WindowProtocol(window, WindowProtocol.PROTOCOL_TYPES.LISTEN)],
            [new WindowProtocol(options.win, WindowProtocol.PROTOCOL_TYPES.DISPATCH)],
            { origins: options.origins }
        );
        this.bus = new Bus(this.adapter);
        this.active = true;
    }

    public async send<T>(data: string, options: SendOptions = {}): Promise<T> {
        this.checkActive();

        const { timeout = 5000, attempts = 1 } = options;

        for (let i = attempts; i > 0; i--) {
            try {
                const res = await this.bus.request<string>(
                    options.event,
                    data,
                    options.timeout
                );

                return JSON.parse(res) as T;
            } catch (e) {
                await delay(timeout);
            }
        }

        throw new Error('Could not connect');
    }

    public async listen<T, R>(cb: IOneArgFunction<T, R>): Promise<void> {
        this.checkActive();

        this.bus.registerRequestHandler('data', (data) => {
            return cb(JSON.parse(data));
        });
    }

    public destroy(): void {
        try {
            this.bus.destroy();
        } catch (e) {

        }
        this.active = false;
    }

    private checkActive(): void {
        if (!this.active) {
            throw new Error('Provider was destroyed');
        }
    }
}
