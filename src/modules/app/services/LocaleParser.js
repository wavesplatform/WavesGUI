(function () {
    'use strict';

    const factory = function () {

        const AVAILABLE_TAGS = ['div', 'span'];
        const AVAILABLE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:'];

        class LocaleParser {

            constructor(open, close, contentOpen, contentClose, compile) {
                this.openChar = open;
                this.closeChar = close;
                this.contentOpenChar = contentOpen;
                this.contentCloseChar = contentClose;
                this.compile = compile;
            }

            parse(text) {
                const openList = [];
                const closeList = [];
                const openContent = [];
                const closeContent = [];

                text.split('').forEach((char, index) => {
                    switch (char) {
                        case this.openChar:
                            openList.push(index);
                            break;
                        case this.closeChar:
                            closeList.push(index);
                            break;
                        case this.contentOpenChar:
                            openContent.push(index);
                            break;
                        case this.contentCloseChar:
                            closeContent.push(index);
                            break;
                        default:
                            break;
                    }
                });

                const mainIntervals = [];
                const contentIntervals = [];

                openList.reverse().forEach((open) => {
                    closeList.some((close, i) => {
                        if (open < close) {
                            mainIntervals.push({ open, close });
                            closeList.splice(i, 1);
                            return true;
                        }
                        return false;
                    });
                });

                openContent.reverse().forEach((open) => {
                    closeContent.some((close, i) => {
                        if (open < close) {
                            contentIntervals.push({ open, close });
                            closeContent.splice(i, 1);
                            return true;
                        }
                        return false;
                    });
                });

                let index = 0;
                let result = '';

                mainIntervals.reverse().forEach((mainData) => {
                    contentIntervals.forEach((contentData) => {
                        if (contentData.open === mainData.close + 1) {
                            const content = text.slice(contentData.open + 1, contentData.close);
                            const main = text.slice(mainData.open + 1, mainData.close);
                            result += text.slice(index, mainData.open) + this.compile({ main, content });
                            index = contentData.close + 1;
                        }
                    });
                });

                result += text.slice(index);

                return result;
            }

        }

        const tagCompile = ({ main, content }) => {
            try {
                const firstDotIndex = main.indexOf('.');
                const tagName = firstDotIndex === 0 ? 'span' : main.slice(0, firstDotIndex);
                const classes = main.slice(firstDotIndex + 1).split('.').join(' ');

                if (AVAILABLE_TAGS.indexOf(tagName) === -1) {
                    throw new Error(`Locale parser: Wrong tag name! ${tagName}`);
                }

                return `<${tagName} class="${classes}">${content}</${tagName}>`;
            } catch (e) {
                return content;
            }
        };

        const linkCompile = ({ main, content }) => {
            try {
                const url = new URL(content);

                if (AVAILABLE_URL_PROTOCOLS.indexOf(url.protocol) === -1) {
                    throw new Error(`Locale parser: Wrong url protocol! ${url.protocol}`);
                }

                return `<a href="${content}" target="_blank">${main}</a>`;
            } catch (e) {
                return '';
            }
        };

        const tagParser = new LocaleParser('{', '}', '[', ']', tagCompile);
        const linkParser = new LocaleParser('[', ']', '(', ')', linkCompile);

        return function (text) {
            return tagParser.parse(linkParser.parse(text));
        };
    };

    factory.$inject = [];

    angular.module('app').factory('localeParser', factory);
})();
