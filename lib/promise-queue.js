
const DEFAULT_TIMEOUT_MS = 5000, DEFAULT_CATCHABLE_FLAG = true, DEFAULT_THROWABLE_FLAG = true;
const queues = {}, interfacess = {};

function PromiseQueue(name) {
    if (name !== undefined && queues[name]) {
        return queues[name];
    }
    else if (name !== undefined) {
        queues[name] = this;
    }

    var queue = this, queuing = false, timeout_id = null,
        tasks = [], reference = {}, interfaces = {}, interfere = {},
        timeout = DEFAULT_TIMEOUT_MS, catchable = DEFAULT_CATCHABLE_FLAG,
        throwable = DEFAULT_THROWABLE_FLAG,current_task = null;

    this.timeout = function(ms) {
        timeout = typeof ms === 'number' ? Math.max(0, ms) : DEFAULT_TIMEOUT_MS;
        return queue;
    };

    this.catchable = function(flag = true) {
        catchable = flag;
        return queue;
    };

    this.throwable = function(flag = true) {
        throwable = flag;
        return queue;
    };

    this.default = function() {
        timeout = DEFAULT_TIMEOUT_MS;
        catchable = DEFAULT_CATCHABLE_FLAG;
        throwable = DEFAULT_THROWABLE_FLAG;
        return queue;
    };

    this.interface = function() {
        var object, name;

        if (arguments.length > 1) {
            name = arguments[0];
            object = arguments[1];
        }
        else if (arguments.length === 1) {
            object = arguments[0];

            if (typeof object === 'string') {
                var cache = interfaces[object] || interfacess[object];
                if (cache) return cache;
            }
        }
        else return {};

        var clone = object instanceof Function ? function() {
            return queue.add.apply(queue, [null, object].concat(Array.from(arguments)));
        } : {};

        for (var key in object) {
            if (object[key] instanceof Function) {
                clone[key] = function() {
                    return queue.add.apply(queue, [object, key].concat(Array.from(arguments)));
                };
            }
        }

        if (typeof name === 'string') {
            interfaces[name] = clone;
            interfacess[name] = clone;
        }

        return clone;
    };

    this.add = function(source, method) {
        var aFunction = method instanceof Function ? method : typeof method === 'string' && source != undefined ? source[method] : null;

        var name = method && method.name || method || 'anonymous';

        if (!(aFunction instanceof Function)) {
            return queue.promise(function(resolve, reject) {
                reject(new Error(`Inspected that "${name}" is not a funtion`));
            });
        }

        var args = [source].concat(Array.from(arguments).slice(2));

        var task = {
            name: name,
            catchable: catchable,
            throwable: throwable,
            process: aFunction.bind.apply(aFunction, args),
            timeout: timeout
        };
        
        tasks.push(task);

        var callback = reference.callback;
        delete reference.callback;

        var exception = reference.exception;
        delete reference.exception;

        var promize = new Promise(function(resolve, reject) {
            task.resolve = function(result) {
                resolve(result);
                queue.next();
            };

            task.reject = function(error) {
                if (!task.catchable) return task.resolve(undefined);
                reject(error);
                queue.next();
            };

            if (interfere.hasOwnProperty('resolved')) {
                return task.resolve(interfere.resolved);
            }

            if (interfere.hasOwnProperty('rejected')) {
                return task.reject(interfere.rejected);
            }

            if (callback) {
                callback.task = task;
            }

            if (exception) {
                exception.task = task;
            }
        });

        if (task.catchable && !task.throwable) {
            makePromiseUnthrowable(promize);
        }

        return execute(promize);
    };

    function makePromiseUnthrowable(promise) {
        var thenOrigin = promise.then;

        console.log('step 3 - making promise unthrowable');
        promise.then = function(onFulfillment, onRejection) {
            console.log('step 4 - then: to create next promise', onFulfillment, onRejection);

            var handler = onFulfillment instanceof Function ? function(result) {
                console.log('step 5 - then is trigger after resolved. Have After:', !!new_promise.next);

                if (!new_promise.next) {console.log('lalala');
                // if (onRejection instanceof Function && onFulfillment == undefined) {
                    console.log('step 5 - not next > catch error');
                    new_promise.catch(function(e){ console.log('eeee', e); });
                    // new_promise.end = true;
                    console.log('step 5 - not next > catch error - after');
                }

                if (!(onFulfillment instanceof Function)) {
                    console.log('onFulfillment not fun:', result);
                }
                console.log('step 6 - Resolved');
                return onFulfillment(result);
            } : undefined;

            var new_promise = thenOrigin.call(promise, handler, onRejection || function(e) {
                console.log('step 5 - 5 - catch and throw');
                if (!new_promise.next) new_promise.catch(function(){});
                return Promise.reject(e); 
            });

            promise.next = true;
            makePromiseUnthrowable(new_promise);

            return new_promise;
        };
    }

    this.callback = function() {
        var callback = {};
        reference.callback = callback;

        return function() {
            if (callback.task) {
                console.log('on callback resolve');
                callback.task.resolve(arguments);
            }
            else if (Object.keys(interfere).length < 1) {
                console.log('on task resolve');
                interfere.resolved = arguments;
            }
        };
    };

    this.exception = function() {
        var exception = {};
        reference.exception = exception;

        return function() {
            if (exception.task) {
                exception.task.reject(arguments);
            }
            else if (Object.keys(interfere).length < 1) {
                interfere.rejected = arguments;
            }
        };
    };

    this.resolve = function(result) {
        if (current_task && current_task.resolve) {
            current_task.resolve(result);
        }
        else if (Object.keys(interfere).length < 1) {
            interfere.resolved = result;
        }
    };

    this.reject = function(error) {
        if (current_task && current_task.reject) {
            current_task.reject(error);
        }
        else if (Object.keys(interfere).length < 1) {
            interfere.rejected = error;
        }
    };

    this.promise = function(promiseCallback) {
        return queue.add(null, function() {
            return promiseCallback instanceof Function ? new Promise(promiseCallback) : new Promise(function(resolve) {
                resolve(promiseCallback);
            });
        });
    };

    this.call = function(syncFunction) {
        return queue.promise(function(resolve, reject) {
            try {
                resolve(syncFunction instanceof Function ? syncFunction() : syncFunction);
            }
            catch (error) {
                reject(error);
            }
        });
    };

    this.next = function() {
        clearTimeout(timeout_id);
        current_task = null;
        interfere = {};
        queuing = false;
        execute();
    };

    function execute(promize) {
        if (queuing) return promize;

        var task = tasks.shift();

        if (!task) {
            return promize;
        }
        else queuing = true;

        current_task = task;

        var promise = task.process();

        timeout_id = setTimeout(function() {
            task.reject(new Error(`Function "${task.name}" was timeout (${task.timeout}ms) waiting resolved`));
        }, task.timeout);
        
        if (promise instanceof Promise) {
            promise.then(task.resolve).catch(task.reject);
        }

        return promize;
    };

    // for (var key in this) {
    //     var method = this[key];
    //     if (method instanceof Function) {
    //         this[key] = method.bind(this);
    //     }
    // }
}

module.exports = { PromiseQueue };
