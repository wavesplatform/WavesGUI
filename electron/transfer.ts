import { main } from './main';

export function transfer(message: string, data: object = Object.create(null)): Promise<any> {
    return main.bridge.transfer(message, data);
}

const __mainListeners = [];

export function listenMainProcessEvent(cb) {
    __mainListeners.push(cb);
}

export function stopListenMainProcessEvent(cb) {
    for (let i = __mainListeners.length - 1; i >= 0; i--) {
        if (__mainListeners[i] === cb) {
            __mainListeners.splice(i, 1);
        }
    }
}

export function runMainProcessEvent(...args) {
    __mainListeners.slice().forEach(cb => {
        try {
            cb(...args);
        } catch (e) {
            console.error(e);
        }
    });
}
