import { IHash } from '../interface';
import { Poll } from '../utils/Poll';

export class PollControl<T extends IHash<Poll<any>>> {

    private _create: ICreatePoll<T>;
    private _hash: T;


    constructor(create: ICreatePoll<T>) {
        this._create = create;
    }

    public restart() {
        if (this._hash) {
            Object.values(this._hash)
                .forEach(poll => poll.restart());
        }
    }

    public destroy() {
        if (this._hash) {
            Object.values(this._hash)
                .forEach((poll) => poll.destroy());
            this._hash = null;
        }
    }

    public create() {
        this.destroy();
        this._hash = this._create();
    }

    public getPollHash(): T {
        return this._hash;
    }

}

export interface ICreatePoll<T extends IHash<Poll<any>>> {
    (): T;
}
