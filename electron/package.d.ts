export interface IMetaJSON {
    lastOpen?: ILastOpen;
}

export interface ILastOpen {
    isFullScreen: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    setProtocolStatus?: boolean;
    lastOpenPath?: string;
}

export interface ISize {
    width: number;
    height: number;
}
