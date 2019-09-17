import { Signal } from 'ts-utils';


export class Poll<T> {

    public signals: ISignals<T> = {
        requestSuccess: new Signal<T>(),
        requestError: new Signal<Error>()
    };

    public lastData: T;

    private readonly _timeout: number;
    private _api: IPollAPI<T>;
    private _timer: number;


    constructor(api: IPollAPI<T>, timeout: number) {
        this._api = api;
        this._timeout = timeout;

        this._run();
    }

    public pause(): void {
        this._clear();
    }

    public play(): void {
        this._clear();
        this._run()
    }

    public getDataPromise(): Promise<T> {
        if (this.lastData) {
            return Promise.resolve(this.lastData);
        } else {
            return new Promise((resolve, reject) => {
                const s = (data) => {
                    resolve(data);
                    this.signals.requestError.off(r);
                };
                const r = (data) => {
                    reject(data);
                    this.signals.requestSuccess.off(s);
                };
                this.signals.requestSuccess.once(s);
                this.signals.requestError.once(r);
            });
        }
    }

    public destroy() {
        this._clear();
    }

    public restart() {
        this._clear();
        this._run();
    }

    private _run() {
        try {
            const promise = this._api.get();
            promise.then(data => {
                if (this._timer === null) {
                    return;
                }

                this._api.set(data);
                this.lastData = data;
                this.signals.requestSuccess.dispatch(data);
                this._setTimeout();
            }, e => {
                if (this._timer === null) {
                    return;
                }

                this.signals.requestError.dispatch(e);
                this._setTimeout(true);
            });
        } catch (e) {
            this.signals.requestError.dispatch(e);
            this._setTimeout(true);
        }
    }

    private _setTimeout(isError?: boolean) {
        this._clear();
        this._timer = window.setTimeout(() => this._run(), isError ? this._timeout * 10 : this._timeout);
    }

    private _clear() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

}

export interface IPollAPI<T> {
    get: () => Promise<T>;
    set: (data: T) => void;
}

export interface ISignals<T> {
    requestSuccess: Signal<T>;
    requestError: Signal<Error>;
}
