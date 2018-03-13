function transfer(message: string, data: object = Object.create(null)) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', `cmd:${message}/${JSON.stringify(data)}`, true);

        xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState !== 4) {
                return null;
            }

            try {
                const result = JSON.parse(xhr.responseText);
                if (result.status === 'error') {
                    reject(result);
                } else {
                    resolve(result.data);
                }
            } catch (e) {
                reject(e);
            }
        });

        xhr.send();
    });
}
