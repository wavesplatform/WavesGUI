declare class BaseNotificationManager<T> {
    public info(data: T, delay: number): Promise<void>;

    public success(data: T, delay: number): Promise<void>;

    public warn(data: T, delay: number): Promise<void>;

    public error(data: T, delay: number): Promise<void>;

    public getActiveNotificationsList(): Array<T>;
}

declare class INotification extends BaseNotificationManager<INotificationObj> {

}

interface INotificationObj {
    ns: string;
    noCloseIcon: boolean;
    noIcon: boolean;
    title: IPart;
    body: IPart;
    action: IActionPart;
    onClose: () => void;
}

interface IPart {
    literal: string;
    params: any;
}

interface IActionPart extends IPart {
    callback: Function;
}
