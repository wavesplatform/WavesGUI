/* WebDB v1.2 - 3/18/2014
   http://github.com/haas85/webdb
   Copyright (c) 2014 Iñigo Gonzalez Vazquez <ingonza85@gmail.com> (@haas85) - Under MIT License */
(function() {
	var WebDB, indexedDB, webDB, webSQL, _mix, _typeOf, _hasLocalStorage;

	window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

	webDB = (function() {
		webDB.prototype.db = null;

		function webDB(name, schema, version, size, callback) {
			var manager;
			this.name = name;
			this.schema = schema;
			this.version = version;
			this.size = size != null ? size : 5242880;
			try {
				window.localStorage;
				_hasLocalStorage = true;
			} catch (err) {
				_hasLocalStorage = false;
			}
			if (!_hasLocalStorage) {
				throw "Local storage not supported";
			} else {
				if (window.indexedDB && !navigator.userAgent.match(/Version\/8\.0 Safari/i)) {
					manager = new WebDB.indexedDB(this.name, this.schema, this.version, callback);
				} else if (window.openDatabase) {
					manager = new WebDB.webSQL(this.name, this.schema, this.version, this.size, callback);
				}
			}

			if (!window.openDatabase && !window.indexedDB) {
				this.select = function(table, query, callback) {
					if (callback != null) {
						return callback.call(callback, "HTML5 Databases not supported", null);
					}
				};
				this.insert = function(table, data, callback) {
					if (callback != null) {
						return callback.call(callback, "HTML5 Databases not supported", null);
					}
				};
				this.update = function(table, data, query, callback) {
					if (query == null) {
						query = [];
					}
					if (callback != null) {
						return callback.call(callback, "HTML5 Databases not supported", null);
					}
				};
				this["delete"] = function(table, query, callback) {
					if (callback != null) {
						return callback.call(callback, "HTML5 Databases not supported", null);
					}
				};
				this.drop = function(table, callback) {
					if (callback != null) {
						return callback.call(callback, "HTML5 Databases not supported", null);
					}
				};
				this.execute = function(sql, callback) {
					if (callback != null) {
						return callback.call(callback, "HTML5 Databases not supported", null);
					}
				};
			} else {
				this.db = manager.db;
				this.select = function() {
					return manager.select.apply(manager, arguments);
				};
				this.insert = function() {
					return manager.insert.apply(manager, arguments);
				};
				this.update = function() {
					return manager.update.apply(manager, arguments);
				};
				this["delete"] = function() {
					return manager["delete"].apply(manager, arguments);
				};
				this.drop = function() {
					return manager.drop.apply(manager, arguments);
				};
				this.execute = function() {
					return manager.execute.apply(manager, arguments);
				};
			}
		}

		return webDB;

	})();

	WebDB = window.WebDB = webDB;

	_mix = function(receiver, emitter) {
		var key, _results;
		_results = [];
		for (key in emitter) {
			_results.push(receiver[key] = emitter[key]);
		}
		return _results;
	};

	_typeOf = function(obj) {
		return Object.prototype.toString.call(obj).match(/[a-zA-Z] ([a-zA-Z]+)/)[1].toLowerCase();
	};

	indexedDB = (function() {
		var SCHEMA_KEY, VERSION_KEY, _check, _queryOp, _write;

		indexedDB.prototype.db = null;

		indexedDB.prototype.version = 0;

		indexedDB.prototype.schema = "";

		indexedDB.prototype.name = "";

		VERSION_KEY = "indexedDB_version";

		SCHEMA_KEY = "indexedDB_schema";

		function indexedDB(name, schema, version, callback) {
			VERSION_KEY += "_" + name;
			SCHEMA_KEY += "_" + name;

			var openRequest, _schema;
			if (version == null) {
				version = 1;
			}

			if (!window.indexedDB && (callback != null)) {
				callback.call(callback, "IndexedDB not supported", null);
			}
			this.version = parseInt(localStorage[VERSION_KEY]);

			if ((this.version == null) || this.version < version || isNaN(this.version)) {
				localStorage[VERSION_KEY] = this.version = parseInt(version);
			}
			this.schema = localStorage[SCHEMA_KEY];
			_schema = JSON.stringify(schema);
			if ((this.schema != null) && this.schema !== _schema) {
				localStorage[SCHEMA_KEY] = this.schema = _schema;
				localStorage[VERSION_KEY] = this.version += 1;
			} else {
				localStorage[SCHEMA_KEY] = this.schema = _schema;
			}
			this.name = name;
			openRequest = window.indexedDB.open(name, this.version);
			openRequest.onsuccess = (function(_this) {
				return function(e) {
					_this.db = e.target.result;
					if (callback != null) {
						return callback.call(callback, null, _this.db);
					}
				};
			})(this);
			openRequest.onerror = function(error) {
				if (callback != null) {
					return callback.call(callback, error, null);
				}
			};
			openRequest.onupgradeneeded = (function(_this) {
				return function(e) {
					var column, options, table, _results;
					_this.db = e.target.result;
					_results = [];
					for (table in schema) {
						options = {};
						for (column in schema[table]) {
							if (_typeOf(schema[table][column]) === "object") {
								if (schema[table][column]["primary"]) {
									options["keyPath"] = column;
								}
								if (schema[table][column]["autoincrement"]) {
									options["autoIncrement"] = true;
								}
							}
						}
						if (options.keyPath == null) {
							options = {
								keyPath: "__key",
								autoIncrement: true
							};
						}
						if (!_this.db.objectStoreNames.contains(table)) {
							_results.push(_this.db.createObjectStore(table, options));
						} else {
							_results.push(void 0);
						}
					}
					return _results;
				};
			})(this);
			openRequest.onversionchange = function(e) {
				return console.log(e);
			};
		}

		indexedDB.prototype.select = function(table, query, callback) {
			if (query == null) {
				query = [];
			}
			return _queryOp(this.db, table, null, query, callback);
		};

		indexedDB.prototype.insert = function(table, data, callback) {
			var len, row, _error, _i, _len, _result, _results;
			if (_typeOf(data) === "object") {
				return _write(this, table, data, callback);
			} else {
				len = data.length;
				_result = 0;
				_error = [];
				_results = [];
				for (_i = 0, _len = data.length; _i < _len; _i++) {
					row = data[_i];
					_results.push(_write(this, table, row, function(error, result) {
						if (error == null) {
							_result++;
						}
						if (error != null) {
							_error.push(error);
						}
						len--;
						if (len === 0 && (callback != null)) {
							if (_error.length === 0) {
								_error = null;
							}
							return callback.call(callback, _error, _result);
						}
					}));
				}
				return _results;
			}
		};

		indexedDB.prototype.update = function(table, data, query, callback) {
			if (query == null) {
				query = [];
			}
			return _queryOp(this.db, table, data, query, function(error, result) {
				if (callback != null) {
					return callback.call(callback, error, result.length);
				}
			});
		};

		indexedDB.prototype["delete"] = function(table, query, callback) {
			var exception, result, store, transaction;
			if (query == null) {
				query = [];
			}
			try {
				result = 0;
				store = this.db.transaction([table], "readwrite").objectStore(table);
				transaction = store.openCursor();
				transaction.onsuccess = function(e) {
					var cursor, element;
					cursor = e.target.result;
					if (cursor) {
						element = cursor.value;
						if (_check(element, query)) {
							result++;
							store["delete"](cursor.primaryKey);
						}
						return cursor["continue"]();
					} else {
						if (callback != null) {
							return callback.call(callback, null, result);
						}
					}
				};
				return transaction.onerror = function(error) {
					if (callback != null) {
						return callback.call(callback, error, null);
					}
				};
			} catch (_error) {
				exception = _error;
				if (callback != null) {
					return callback.call(callback, exception, null);
				}
			}
		};

		indexedDB.prototype.drop = function(table, callback) {
			var exception, openRequest;
			try {
				this.db.close();
				this.version += 1;
				localStorage[VERSION_KEY] = this.version;
				openRequest = window.indexedDB.open(this.name, this.version);
				openRequest.onsuccess = (function(_this) {
					return function(e) {
						return _this.db = e.target.result;
					};
				})(this);
				openRequest.onupgradeneeded = (function(_this) {
					return function(e) {
						var _schema;
						_this.db = e.target.result;
						_this.db.deleteObjectStore(table);
						_schema = JSON.parse(_this.schema);
						delete _schema[table];
						_this.schema = localStorage[SCHEMA_KEY] = JSON.stringify(_schema);
						if (callback != null) {
							return callback.call(callback, null);
						}
					};
				})(this);
				return openRequest.onerror = function(error) {
					if (callback != null) {
						return callback.call(callback, error);
					}
				};
			} catch (_error) {
				exception = _error;
				if (callback != null) {
					return callback.call(callback, exception);
				}
			}
		};

		indexedDB.prototype.execute = function(sql, callback) {
			if (callback != null) {
				return callback.call(callback, "Execute not supported");
			}
		};

		_write = function(_this, table, data, callback) {
			var request, store;
			store = _this.db.transaction([table], "readwrite").objectStore(table);
			request = store.add(data);
			request.onerror = function(error) {
				if (callback != null) {
					return callback.call(callback, error, null);
				}
			};
			return request.onsuccess = function(result) {
				if (callback != null) {
					return callback.call(callback, null, 1);
				}
			};
		};

		_check = function(element, query) {
			var key, result, stmt, _i, _len;
			if (query == null) {
				query = [];
			}
			if (query.length === 0) {
				return true;
			}
			for (_i = 0, _len = query.length; _i < _len; _i++) {
				stmt = query[_i];
				result = true;
				for (key in stmt) {
					if (element[key] !== stmt[key]) {
						result = false;
						break;
					}
				}
				if (result === true) {
					return true;
				}
			}
			return false;
		};

		_queryOp = function(db, table, data, query, callback) {
			var op, result, transaction;
			if (query == null) {
				query = [];
			}
			result = [];
			op = data != null ? "readwrite" : "readonly";
			transaction = db.transaction([table], op).objectStore(table).openCursor();
			transaction.onsuccess = function(e) {
				var cursor, element;
				cursor = e.target.result;
				if (cursor) {
					element = cursor.value;
					if (_check(element, query)) {
						if (data != null) {
							_mix(element, data);
							_mix(cursor.value, data);
							cursor.update(cursor.value);
						}
						result.push(element);
					}
					return cursor["continue"]();
				} else {
					if (callback != null) {
						return callback.call(callback, null, result);
					}
				}
			};
			return transaction.onerror = function(error) {
				if (callback != null) {
					return callback.call(callback, error, null);
				}
			};
		};

		return indexedDB;

	})();

	WebDB.indexedDB = indexedDB;

	webSQL = (function() {
		var _insert, _queryToSQL, _schema, _setValue, _this;

		webSQL.prototype.db = null;

		_schema = {};

		_this = null;

		function webSQL(name, schema, version, size, callback) {
			var column, sql, table, _tables;
			if (size == null) {
				size = 5;
			}
			if ((callback != null) && !window.openDatabase) {
				return callback.call(callback, "WebSQL not supported", null);
			}
			size = size * 1024 * 1024;
			this.db = window.openDatabase(name, 1, "", size); //wesley -- do not care about version in websql
			_tables = 0;
			for (table in schema) {
				_schema[table] = {};
				sql = "CREATE TABLE IF NOT EXISTS " + table + " (";
				for (column in schema[table]) {
					if (_typeOf(schema[table][column]) === "object") {
						if (schema[table][column]["autoincrement"]) {
							sql += "'" + column + "' INTEGER";
						} else {
							sql += "'" + column + "' " + schema[table][column]['type'];
						}
						if (schema[table][column]["primary"]) {
							sql += " PRIMARY KEY";
						}
						if (schema[table][column]["autoincrement"]) {
							sql += " AUTOINCREMENT";
						}
						sql += ",";
						_schema[table][column] = schema[table][column]["type"];
					} else {
						sql += "'" + column + "' " + schema[table][column] + ",";
						_schema[table][column] = schema[table][column];
					}
				}
				sql = sql.substring(0, sql.length - 1) + ")";
				_tables++;
				_this = this;
				this.execute(sql, (function(_this) {
					return function(error, result) {
						_tables--;
						if (_tables === 0 && (callback != null)) {
							return callback.call(callback, error, _this.db);
						}
					};
				})(this));
			}
		}

		webSQL.prototype.select = function(table, query, callback) {
			var exception, sql;
			if (query == null) {
				query = [];
			}
			try {
				sql = ("SELECT * FROM " + table) + _queryToSQL(table, query);
				return this.execute(sql, callback);
			} catch (_error) {
				exception = _error;
				if (callback != null) {
					return callback.call(callback, exception, null);
				}
			}
		};

		webSQL.prototype.insert = function(table, data, callback) {
			var len, result, row, _error, _i, _len, _results;
			if (_typeOf(data) === "object") {
				return _insert(table, data, callback);
			} else {
				len = data.length;
				result = 0;
				_error = [];
				_results = [];
				for (_i = 0, _len = data.length; _i < _len; _i++) {
					row = data[_i];
					_results.push(_insert(table, row, function(error, row) {
						if (error != null) {
							_error.push(error);
						}
						len--;
						if (error == null) {
							result++;
						}
						if (len === 0 && (callback != null)) {
							if (_error.length === 0) {
								_error = null;
							}
							return callback.call(callback, _error, result);
						}
					}));
				}
				return _results;
			}
		};

		webSQL.prototype.update = function(table, data, query, callback) {
			var exception, key, sql;
			if (query == null) {
				query = [];
			}
			try {
				sql = "UPDATE " + table + " SET ";
				for (key in data) {
					sql += "" + key + " = " + (_setValue(table, key, data[key])) + ", ";
				}
				sql = sql.substring(0, sql.length - 2) + _queryToSQL(table, query);
				return this.execute(sql, callback);
			} catch (_error) {
				exception = _error;
				if (callback != null) {
					return callback.call(callback, exception, null);
				}
			}
		};

		webSQL.prototype["delete"] = function(table, query, callback) {
			var exception, sql;
			if (query == null) {
				query = [];
			}
			try {
				sql = "DELETE FROM " + table + " " + (_queryToSQL(table, query));
				return this.execute(sql, callback);
			} catch (_error) {
				exception = _error;
				if (callback != null) {
					return callback.call(callback, exception, null);
				}
			}
		};

		webSQL.prototype.drop = function(table, callback) {
			return this.execute("DROP TABLE IF EXISTS " + table, function(error, result) {
				if (callback != null) {
					return callback.call(callback, error);
				}
			});
		};

		webSQL.prototype.execute = function(sql, callback) {
			if (!this.db && (callback != null)) {
				return callback.call(callback, "Database not initializated", null);
			} else {
				return this.db.transaction(function(tx) {
					return tx.executeSql(sql, [], (function(transaction, resultset) {
						var i, result;
						result = [];
						if (sql.indexOf("SELECT") !== -1) {
							result = (function() {
								var _i, _ref, _results;
								_results = [];
								for (i = _i = 0, _ref = resultset.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
									_results.push(resultset.rows.item(i));
								}
								return _results;
							})();
							if (callback != null) {
								return callback.call(callback, null, result);
							}
						} else {
							if (callback != null) {
								return callback.call(callback, null, resultset.rowsAffected);
							}
						}
					}), (function() {
						if (callback != null) {
							return callback.call(callback, arguments[1], null);
						}
					}));
				});
			}
		};

		_insert = function(table, row, callback) {
			var data, exception, key, sql;
			try {
				sql = "INSERT INTO " + table + " (";
				data = "(";
				for (key in row) {
					sql += "" + key + ", ";
					data += "" + (_setValue(table, key, row[key])) + ", ";
				}
				sql = sql.substring(0, sql.length - 2) + ") ";
				data = data.substring(0, data.length - 2) + ") ";
				sql += " VALUES " + data;
				return _this.execute(sql, callback);
			} catch (_error) {
				exception = _error;
				if (callback != null) {
					return callback.call(callback, exception, null);
				}
			}
		};

		_queryToSQL = function(table, query) {
			var elem, or_stmt, sql, value, _i, _len;
			if (query.length > 0) {
				sql = " WHERE (";
				for (_i = 0, _len = query.length; _i < _len; _i++) {
					elem = query[_i];
					for (or_stmt in elem) {
						value = elem[or_stmt];
						sql += "" + or_stmt + " = " + (_setValue(table, or_stmt, value)) + " AND ";
					}
					sql = sql.substring(0, sql.length - 5) + ") OR (";
				}
				return sql.substring(0, sql.length - 5);
			} else {
				return "";
			}
		};

		_setValue = function(table, column, value) {
			if (_schema[table][column] === "NUMBER" && /^\d+$/.test(value)) {
				return value;
			} else {
				return "'" + (String(value).replace(/'/g, "''")) + "'";
			}
		};

		return webSQL;

	})();

	WebDB.webSQL = webSQL;

}).call(this);