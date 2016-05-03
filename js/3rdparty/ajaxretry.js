/**
 * @depends {jquery-2.1.0.js}
 */

/*! jQuery.ajaxRetry v0.1.3 | (c) 2013 Daniel Herman | opensource.org/licenses/MIT | https://github.com/dcherman/jQuery.ajaxRetry */
(function($) {
	"use strict";

	var retryKey = "__RETRY__" + new Date().getTime();

	function isPromiseResolved(promise) {
		if (promise.state) {
			return promise.state() !== "pending";
		} else {
			return promise.isResolved() || promise.isRejected();
		}
	}

	$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
		// Don't handle a call that's already "fixed" or that doesn't specify a shouldRetry option
		if (options[retryKey] || typeof options.shouldRetry === "undefined") {
			return;
		}

		// Mark this as having been processed so the prefilter doesn't touch subsequent retried requests
		originalOptions[retryKey] = true;

		var
		// A deferred that will be resolved to satisfy the success, error, done, fail, and always handlers and deferreds
		dfr = $.Deferred(),

			// A deferred that'll be resolved to satisy the complete handler and deferred
			completeDeferred = $.Deferred(),

			// Any status code specific callbacks that should be invoked
			statusCode = {},

			// The number of times our request has been retried thus far
			retryCount = 0,

			// The options that'll be passed to our ajax handler if a retry is needed
			newOptions,

			// When the request finally completes, this will be the statusCode that the XHR returned
			finalStatusCode,

			// Returns either a boolean or a promise that'll be resolved with a boolean to determine
			// whether or not we should retry a given request.
			shouldRetry = function(jqXHR, retryCount, method) {
				var result,
					test = options.shouldRetry,
					type = typeof test;

				switch (type) {
					case "number":
						result = retryCount < test;
						break;
					case "boolean":
						result = test;
						break;
					case "function":
						result = test(jqXHR, retryCount, method);
						break;
				}

				//added by wesley..
				if (method.toLowerCase() == "post") {
					result = false;
				}

				if (typeof result === "object" && typeof result.then === "function") {
					// If the value returned from a function is a promise, then ensure that
					// if it's rejecteded, the promise returned from the function is resolved with false
					// in order to avoid any situations where the request just hangs if someone rejects a promise.
					// We can't simply use .then or .pipe here since those did not exist in 1.5
					return $.Deferred(function(dfr) {
						result.then(dfr.resolve, function() {
							dfr.resolve(false);
						});
					}).promise();
				}

				return $.when(result);
			};

		newOptions = $.extend({}, originalOptions, {
			success: $.noop,
			error: $.noop,
			complete: $.noop,
			statusCode: {}
		});

		(function tryRequest(options, lastJqXHR, finalizer) {
			// If lastJqXHR === undefined at this point, then it's the first ever request.
			// Ensure that we always proceed without calling the shouldRetry function in that case
			(!lastJqXHR ? $.when(true) : shouldRetry(lastJqXHR, retryCount++, options.type || "GET")).done(function(willRetry) {
				if (willRetry === true) {
					(!lastJqXHR ? jqXHR : $.ajax(options)).then(
						function(data, textStatus, jqXHR) {
							finalStatusCode = jqXHR.status;
							dfr.resolveWith(this, arguments);
							dfr.done(statusCode[finalStatusCode]);
							completeDeferred.resolveWith(this, [jqXHR, textStatus]);
						},
						function(jqXHR, textStatus) {
							var failureArgs = arguments,
								failureContext = this;

							tryRequest(options, jqXHR, function() {
								finalStatusCode = jqXHR.status;
								dfr.rejectWith(failureContext, failureArgs);
								dfr.fail(statusCode[finalStatusCode]);
								completeDeferred.resolveWith(failureContext, [jqXHR, textStatus]);
							});
						}
					);
				} else {
					finalizer();
				}


			});
		}(newOptions));

		// Install legacy deferred style functions.  These are deprecated,
		// and presumably will be removed as a group at some point.
		// To maintain API compatibility, first check if we should even install these.
		if (jqXHR.complete) {
			jqXHR.complete = completeDeferred.done;
			jqXHR.success = dfr.done;
			jqXHR.error = dfr.fail;
		}

		// Override the promise methods on the jqXHR.  Don't use the .promise(obj) syntax
		// here since that wasn't introduced until 1.6.
		$.extend(jqXHR, dfr.promise());

		jqXHR.statusCode = function(map) {
			var code;

			if (map) {
				if (isPromiseResolved(dfr)) {
					// Execute the appropriate callbacks.  Don't use .always() since it's not 1.5 compatible.
					dfr.then(map[finalStatusCode], map[finalStatusCode]);
				} else {
					for (code in map) {
						// Lazy-add the new callback in a way that preserves old ones
						statusCode[code] = [statusCode[code], map[code]];
					}
				}
			}

			return this;
		};
	});
}(jQuery));