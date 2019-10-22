import { Bus, WindowAdapter, WindowProtocol, IOneArgFunction } from '@waves/waves-browser-bus';
import { delay } from '../utils/utils';
import { ConnectProvider } from './ConnectProvider';

interface PostMessageConnectProviderOptioins {
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
            [new WindowProtocol(
                options.mode === 'import' ?
                    (window.opener || window.parent) :
                    window,
                'listen'
            )],
            [new WindowProtocol(
                options.mode === 'import' ?
                    (window.opener || window.parent) :
                    window,
                'dispatch'
            )],
            {
                origins: options.origins,
                chanelId: `postMessageConnectProvider${options.mode === 'export' ? 'Client' : 'Server'}`,
                availableChanelId: `postMessageConnectProvider${options.mode !== 'export' ? 'Client' : 'Server'}`,
            }
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
        this.bus.destroy();
        this.active = false;
    }

    private checkActive(): void {
        if (!this.active) {
            throw new Error('Provider was destroyed');
        }
    }
}
