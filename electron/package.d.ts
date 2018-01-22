export interface IMetaJSON {
    window: {
        open: {
            maxSize: ISize;
            minSize: ISize;
        },
        minSize: ISize;
        lastOpen: {
            isFullScreen: boolean;
            x: number;
            y: number;
            width: number;
            height: number;
        }
    }
}

export interface ISize {
    width: number;
    height: number;
}
