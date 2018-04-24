/* eslint-disable */
(function () {
    'use strict';

    const factory = function () {

        /**
         * @name Ease
         */

        const Ease = {

            /**
             * @name Ease#linear
             * @param {number} t
             * @return {number}
             */
            linear: function (t) {
                return t;
            },

            get: function (amount) {
                if (amount < -1) {
                    amount = -1;
                }
                if (amount > 1) {
                    amount = 1;
                }
                return function (t) {
                    if (amount === 0) {
                        return t;
                    }
                    if (amount < 0) {
                        return t * (t * -amount + 1 + amount);
                    }
                    return t * ((2 - t) * amount + (1 - amount));
                };
            },

            getPowIn: function (pow) {
                return function (t) {
                    return Math.pow(t, pow);
                };
            },


            /**
             * Configurable exponential ease.
             * @name Ease#getPowOut
             * @param pow The exponent to use (ex. 3 would return a cubic ease).
             **/
            getPowOut: function (pow) {
                return function (t) {
                    return 1 - Math.pow(1 - t, pow);
                };
            },


            /**
             * Configurable exponential ease.
             * @name Ease#getPowInOut
             * @param pow The exponent to use (ex. 3 would return a cubic ease).
             **/
            getPowInOut: function (pow) {
                return function (t) {
                    if ((t *= 2) < 1) return 0.5 * Math.pow(t, pow);
                    return 1 - 0.5 * Math.abs(Math.pow(2 - t, pow));
                };
            },


            /**
             * @name Ease#sineIn
             **/
            sineIn: function (t) {
                return 1 - Math.cos(t * Math.PI / 2);
            },

            /**
             * @name Ease#sineOut
             **/
            sineOut: function (t) {
                return Math.sin(t * Math.PI / 2);
            },

            /**
             * @name Ease#sineInOut
             **/
            sineInOut: function (t) {
                return -0.5 * (Math.cos(Math.PI * t) - 1);
            },

            /**
             * Configurable "back in" ease.
             * @name Ease#getBackIn
             * @param amount The strength of the ease.
             **/
            getBackIn: function (amount) {
                return function (t) {
                    return t * t * ((amount + 1) * t - amount);
                };
            },

            /**
             * Configurable "back out" ease.
             * @name Ease#getBackOut
             * @param amount The strength of the ease.
             **/
            getBackOut: function (amount) {
                return function (t) {
                    return (--t * t * ((amount + 1) * t + amount) + 1);
                };
            },

            /**
             * Configurable "back in out" ease.
             * @name Ease#getBackInOut
             * @param amount The strength of the ease.
             **/
            getBackInOut: function (amount) {
                amount *= 1.525;
                return function (t) {
                    if ((t *= 2) < 1) return 0.5 * (t * t * ((amount + 1) * t - amount));
                    return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
                };
            },


            /**
             * @name Ease#circIn
             **/
            circIn: function (t) {
                return -(Math.sqrt(1 - t * t) - 1);
            },

            /**
             * @name Ease#circOut
             **/
            circOut: function (t) {
                return Math.sqrt(1 - (--t) * t);
            },

            /**
             * @name Ease#circInOut
             **/
            circInOut: function (t) {
                if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
                return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
            },

            /**
             * @name Ease#bounceIn
             **/
            bounceIn: function (t) {
                return 1 - Ease.bounceOut(1 - t);
            },

            /**
             * @name Ease#bounceOut
             **/
            bounceOut: function (t) {
                if (t < 1 / 2.75) {
                    return (7.5625 * t * t);
                } else if (t < 2 / 2.75) {
                    return (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
                } else if (t < 2.5 / 2.75) {
                    return (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
                } else {
                    return (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
                }
            },

            /**
             * @name Ease#bounceInOut
             **/
            bounceInOut: function (t) {
                if (t < 0.5) return Ease.bounceIn(t * 2) * .5;
                return Ease.bounceOut(t * 2 - 1) * 0.5 + 0.5;
            },


            /**
             * Configurable elastic ease.
             * @name Ease#getElasticIn
             * @param amplitude
             * @param period
             **/
            getElasticIn: function (amplitude, period) {
                const pi2 = Math.PI * 2;
                return function (t) {
                    if (t == 0 || t == 1) return t;
                    const s = period / pi2 * Math.asin(1 / amplitude);
                    return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
                };
            },

            /**
             * Configurable elastic ease.
             * @name Ease#getElasticOut
             * @param amplitude
             * @param period
             **/
            getElasticOut: function (amplitude, period) {
                const pi2 = Math.PI * 2;
                return function (t) {
                    if (t == 0 || t == 1) return t;
                    const s = period / pi2 * Math.asin(1 / amplitude);
                    return (amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * pi2 / period) + 1);
                };
            },
            /**
             * Configurable elastic ease.
             * @name Ease#getElasticInOut
             * @param amplitude
             * @param period
             **/
            getElasticInOut: function (amplitude, period) {
                const pi2 = Math.PI * 2;
                return function (t) {
                    const s = period / pi2 * Math.asin(1 / amplitude);
                    if ((t *= 2) < 1) return -0.5 * (amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
                    return amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * pi2 / period) * 0.5 + 1;
                };
            }
        };


        /**
         * @name Ease#backOut
         **/
        Ease.backOut = Ease.getBackOut(1.7);

        /**
         * @name Ease#backIn
         **/
        Ease.backIn = Ease.getBackIn(1.7);

        /**
         * @name Ease#backInOut
         **/
        Ease.backInOut = Ease.getBackInOut(1.7);

        /**
         * @name Ease#elasticIn
         **/
        Ease.elasticIn = Ease.getElasticIn(1, 0.3);

        /**
         * @name Ease#elasticInOut
         **/
        Ease.elasticInOut = Ease.getElasticInOut(1, 0.3 * 1.5);

        /**
         * @name Ease#elasticOut
         **/
        Ease.elasticOut = Ease.getElasticOut(1, 0.3);

        /**
         * @name Ease#quadIn
         **/
        Ease.quadIn = Ease.getPowIn(2);

        /**
         * @name Ease#quadOut
         **/
        Ease.quadOut = Ease.getPowOut(2);
        /**
         * @name Ease#quadInOut
         **/
        Ease.quadInOut = Ease.getPowInOut(2);


        /**
         * @name Ease#cubicIn
         **/
        Ease.cubicIn = Ease.getPowIn(3);
        /**
         * @name Ease#cubicOut
         **/
        Ease.cubicOut = Ease.getPowOut(3);
        /**
         * @name Ease#cubicInOut
         **/
        Ease.cubicInOut = Ease.getPowInOut(3);

        /**
         * @name Ease#quartIn
         **/
        Ease.quartIn = Ease.getPowIn(4);
        /**
         * @name Ease#quartOut
         **/
        Ease.quartOut = Ease.getPowOut(4);
        /**
         * @name Ease#quartInOut
         **/
        Ease.quartInOut = Ease.getPowInOut(4);


        /**
         * @name Ease#quintIn
         **/
        Ease.quintIn = Ease.getPowIn(5);
        /**
         * @name Ease#quintOut
         **/
        Ease.quintOut = Ease.getPowOut(5);
        /**
         * @name Ease#quintInOut
         **/
        Ease.quintInOut = Ease.getPowInOut(5);

        return Ease;
    };

    factory.$inject = [];

    angular.module('app.utils').factory('ease', factory);
})();
/* eslint-enable */
