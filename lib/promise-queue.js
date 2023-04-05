
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
        tasks = [], reference = {}, interfaces = {},
        timeout = DEFAULT_TIMEOUT_MS, catchable = DEFAULT_CATCHABLE_FLAG,
        throwable = DEFAULT_THROWABLE_FLAG, current_task = null;

    this.timeout = function(ms) {
        timeout = typeof ms === 'number' ? Math.max(0, ms) : DEFAULT_TIMEOUT_MS;
        return timeout;
    };

    this.catchable = function(flag = true) {
        catchable = !!flag;
        return catchable;
    };

    this.throwable = function(flag = true) {
        throwable = !!flag;
        return throwable;
    };

    this.defaults = function() {
        timeout = DEFAULT_TIMEOUT_MS;
        catchable = DEFAULT_CATCHABLE_FLAG;
        throwable = DEFAULT_THROWABLE_FLAG;
        return { timeout, catchable, throwable };
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
                return interfaces[object] || interfacess[object] || {};
            }
        }
        else return {};

        var clone = object instanceof Function ? function() {
            return queue.add.apply(queue, [null, object].concat(Array.from(arguments)));
        } : {};

        Object.keys(object).forEach(function(key) {
            if (object[key] instanceof Function) {
                clone[key] = function() {
                    return queue.add.apply(queue, [object, key].concat(Array.from(arguments)));
                };
            }
        });

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

            if (callback) {
                callback.task = task;
            }

            if (exception) {
                exception.task = task;
            }
        });

        customizePromise(promize, task);

        return execute(promize);
    };

    function customizePromise(before, task) {
        var beforeThen = before.then;
    
        before.then = function(onFulfillment, onRejection) {
            before.next = true;

            var onResolve = onFulfillment instanceof Function ? function(result) {
                before.state = after.state = 'fulfilled';
                before.value = result;
                after.value = onFulfillment(result);
                return after.value;
            } : undefined;
    
            var onReject = onRejection instanceof Function ? function(error) {
                before.state = after.state = 'rejected';
                before.value = error;
                after.value = onRejection(error);
                return after.value;
            }
            : task.catchable && !task.throwable && function(error) {
                before.state = after.state = 'rejected';
                before.value = after.value = error;
                return after.next ? Promise.reject(error) : error;
            }
            || undefined;

            var after = beforeThen.call(before, onResolve, onReject);

            after.index = 1 + (typeof before.index === 'number' ? before.index : (before.index = 0));

            customizePromise(after, task);
    
            return after;
        };
    }

    this.callback = function() {
        var callback = {};
        reference.callback = callback;

        return function() {
            callback.task ? callback.task.resolve(arguments) : null;
        };
    };

    this.exception = function() {
        var exception = {};
        reference.exception = exception;

        return function() {
            exception.task ? exception.task.reject(arguments) : null
        };
    };

    this.resolve = function(result) {
        current_task && current_task.resolve ? current_task.resolve(result) : null;
    };

    this.reject = function(error) {
        current_task && current_task.reject ? current_task.reject(error) : null;
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
            promise.then(task.resolve, task.reject);
        }

        return promize;
    };
}

module.exports = {
    PromiseQueue,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_CATCHABLE_FLAG,
    DEFAULT_THROWABLE_FLAG
};
