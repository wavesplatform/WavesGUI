import { IHash } from '../interface';
import { Poll } from '../utils/Poll';

export class PollControl<T extends IHash<Poll<any>>> {

    private readonly _create: ICreatePoll<T>;
    private _hash: T;
    private paused: boolean = false;


    constructor(create: ICreatePoll<T>) {
        this._create = create;
    }

    public restart(name?: string): void {
        if (name && this._hash && this._hash[name]) {
            this._hash[name].restart();
            return;
        }

        if (this._hash) {
            Object.values(this._hash)
                .forEach(poll => poll.restart());
        }
    }

    public pause(): void {
        this.paused = true;
        if (this._hash) {
            Object.values(this._hash)
                .forEach(poll => poll.pause());
        }
    }

    public play(): void {
        this.paused = false;
        if (this._hash) {
            Object.values(this._hash)
                .forEach(poll => poll.play());
        }
    }

    public destroy() {
        if (this._hash) {
            Object.values(this._hash)
                .forEach((poll) => poll.destroy());
            this._hash = null;
        }
    }

    public create(): void {
        this.destroy();
        this._hash = this._create();
        if (this.paused) {
            this.pause();
        }
    }

    public getPollHash(): T {
        return this._hash;
    }

}

export interface ICreatePoll<T extends IHash<Poll<any>>> {
    (): T;
}
