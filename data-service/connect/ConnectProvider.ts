export interface ConnectProvider {
    send<T>(data: string, options: Record<string, unknown>): Promise<T>;
    listen(cb: Function): Promise<void>;
    destroy(): void
}
