import { main } from './main';

export function transfer(message: string, data: object = Object.create(null)): Promise<any> {
    return main.bridge.transfer(message, data);
}
