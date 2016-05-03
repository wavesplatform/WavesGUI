/**
 * @depends {waves.js}
 */
var Waves = (function (Waves, $, undefined) {
    var _password;

    Waves.setServerPassword = function (password) {
        _password = password;
    };

    Waves.sendOutsideRequest = function (url, data, callback, async) {
        if ($.isFunction(data)) {
            async = callback;
            callback = data;
            data = {};
        } else {
            data = data || {};
        }

        $.support.cors = true;

        $.ajax({
            url: url,
            crossDomain: true,
            dataType: "json",
            type: "GET",
            timeout: 30000,
            async: (async === undefined ? true : async),
            data: data
        }).done(function (json) {
            //why is this necessary??..
            if (json.errorCode && !json.errorDescription) {
                json.errorDescription = (json.errorMessage ? json.errorMessage : $.t("server_error_unknown"));
            }
            if (callback) {
                callback(json, data);
            }
        }).fail(function (xhr, textStatus, error) {
            if (callback) {
                callback({
                    "errorCode": -1,
                    "errorDescription": error
                }, {});
            }
        });
    };

  

    return Waves;
}(Waves || {}, jQuery));