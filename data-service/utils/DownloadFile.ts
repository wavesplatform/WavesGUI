const xhr = new XMLHttpRequest();

export async function downloadFile (url: string, progressCb?: (progress: number, size?: number) => void): Promise<Uint8Array> {
    return new Promise(resolve => {
        xhr.open('GET', url, true);
        xhr.responseType = "blob";

        xhr.onprogress = (event) => {
            if (typeof progressCb === 'function') {
                progressCb(event.total ? event.loaded / event.total * 100 : 0, event.loaded);
            }
        };

        // @ts-ignore
        xhr.onload = function (req: XMLHttpRequest): any {
            const blob = req.response;
            resolve(blob);
        };

        xhr.send();
    });

}

export function abortDownloading (): void {
    xhr.abort();
}
