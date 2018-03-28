declare class BaseNotificationManager<T> {
    public info(data: T, delay: number): Promise<void>;

    public success(data: T, delay: number): Promise<void>;

    public warn(data: T, delay: number): Promise<void>;

    public error(data: T, delay: number): Promise<void>;

    public getActiveNotificationsList(): Promise<Array<T>>;
}

declare class INotification extends BaseNotificationManager<INotificationObj> {

}

declare class IAlert extends BaseNotificationManager<IAlertObj> {

}

interface IAlertObj {
    ns: string;
    content: IPart;
}

interface INotificationObj {
    ns: string;
    title: IPart;
    body: IPart;
}

interface IPart {
    literal: string;
    params: any;
}
