export async function downloadFile (url: string, progressCb?: (progress: number, size?: number) => void): Promise<Uint8Array> {
    const response = await fetch(url);
    const contentLength = Number(response.headers.get('Content-Length') || response.headers.get('content-length')) || 0;
    const reader = response.body.getReader();
    let receivedLength = 0;
    let chunks = [];

    while(true) {
        const { done, value } = await reader.read();

        if (done) {
            progressCb(100);
            break;
        }

        chunks.push(value);
        receivedLength += value.length;

        if (typeof progressCb === 'function') {
            progressCb(contentLength ? receivedLength / contentLength * 100 : 0, receivedLength);
        }
    }

    let chunksAll = new Uint8Array(receivedLength);
    let position = 0;

    for(let chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }

    return chunksAll;
}

