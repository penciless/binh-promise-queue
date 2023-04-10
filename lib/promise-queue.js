
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
        throwable = DEFAULT_THROWABLE_FLAG, current_task = null, last_task = null;

    queue.timeout = function(ms) {
        timeout = typeof ms === 'number' ? Math.max(0, ms) : DEFAULT_TIMEOUT_MS;
        return timeout;
    };

    queue.catchable = function(flag = true) {
        catchable = !!flag;
        return catchable;
    };

    queue.throwable = function(flag = true) {
        throwable = !!flag;
        return throwable;
    };

    queue.defaults = function() {
        timeout = DEFAULT_TIMEOUT_MS;
        catchable = DEFAULT_CATCHABLE_FLAG;
        throwable = DEFAULT_THROWABLE_FLAG;
        return { timeout, catchable, throwable };
    };

    queue.interface = function() {
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
                clone[key].args = function(argsCallback) {
                    return queue.addAsync.apply(queue, [object, key, argsCallback]);
                };
            }
        });

        if (typeof name === 'string') {
            interfaces[name] = clone;
            interfacess[name] = clone;
        }

        return clone;
    };
    
    queue.add = function(source, method) {
        var target = validateTarget(source, method);
        if (target.invalid) return target.invalid;

        var args = [source].concat(Array.from(arguments).slice(2));

        var task = {
            name: target.name,
            process: target.func,
            catchable: catchable,
            throwable: throwable,
            timeout: timeout,
            args: args
        };

        return queuingTask(task);
    };

    queue.addAsync = function(source, method, argsCallback) {
        var target = validateTarget(source, method);
        if (target.invalid) return target.invalid;

        var task = {
            name: target.name,
            process: target.func,
            catchable,
            throwable,
            timeout,
            args: [source],
            argsCallback: argsCallback
        };

        return queuingTask(task);
    };

    function validateTarget(source, method) {
        var func = method instanceof Function ? method : typeof method === 'string' && source != undefined ? source[method] : null;
        var name = method && method.name || (typeof method === 'string' && method) || 'anonymous';
        
        if (!(func instanceof Function)) {
            return {
                invalid: queue.promise(function(resolve, reject) {
                    reject(new Error(`Inspected that "${name}" is not a funtion`));
                })
            };
        }

        return { name, func };
    }

    function queuingTask(task) {
        tasks.push(task);
        last_task = task;

        var callback = reference.callback;
        delete reference.callback;

        var exception = reference.exception;
        delete reference.exception;

        var promize = new Promise(function(resolve, reject) {
            task.resolve = function(result) {
                resolve(result);
                if (!promize.next) {
                    promize.state = 'fulfilled';
                    promize.value = result;
                    next();
                }
            };

            task.reject = function(error) {
                if (!task.catchable) return task.resolve(undefined);
                reject(error);
                if (!promize.next) {
                    promize.state = 'rejected';
                    promize.value = error;
                    next();
                }
            };

            if (callback) {
                callback.task = task;
            }

            if (exception) {
                exception.task = task;
            }
        });

        promize.now = queue.takeover;

        customizePromise(promize, task);

        return execute(promize);
    }

    function customizePromise(before, task) {
        var beforeThen = before.then;
    
        before.then = function(onFulfillment, onRejection) {
            // when throwable(false) and the final promise marked as 'rejected' (customized),
            // its native state is actually 'fulfilled' due to self-handled catching (to not throw uncaugth exception);
            // therefore, this block of code helps the final promise to behave like a 'rejected' one for future .then/.catch
            if (!before.next && before.state === 'rejected' && task.catchable && !task.throwable)  {
                var between = beforeThen.call(before, function(error) {
                    return Promise.reject(error);
                });
                between.index = (typeof before.index === 'number' ? before.index : (before.index = 0));
                before = between;
                beforeThen = between.then;
            }

            before.next = true;

            var onResolve = function(result) {
                before.state = after.state = 'fulfilled';
                before.value = result;
                after.value = onFulfillment instanceof Function ? onFulfillment(result) : result;
                if (!after.next) next();
                return after.value;
            };
    
            var onReject = onRejection instanceof Function ? function(error) {
                before.state = 'rejected';
                after.state = 'fulfilled';
                before.value = error;
                after.value = onRejection(error);
                if (!after.next) next();
                return after.value;
            }
            : task.catchable && !task.throwable && function(error) {
                before.state = after.state = 'rejected';
                before.value = after.value = error;
                if (!after.next) next();
                return after.next ? Promise.reject(error) : error;
            }
            || function(error) {
                before.state = after.state = 'rejected';
                before.value = after.value = error;
                before.uncaugtht = after.uncaugtht = true;
                if (!after.next) next();
                return Promise.reject(error);
            };

            var after = beforeThen.call(before, onResolve, onReject);

            after.index = 1 + (typeof before.index === 'number' ? before.index : (before.index = 0));
            after.now = queue.takeover;

            customizePromise(after, task);
    
            return after;
        };
    }
    
    function execute(promize) {
        if (queuing) return promize;

        var task = tasks.shift();

        if (!task) {
            return promize;
        }
        else queuing = true;

        current_task = task;

        if (last_task === current_task) last_task = null;

        var promise;

        try {
            var args = task.argsCallback instanceof Function ? task.argsCallback() : [];
            args = args instanceof Array && args || [];
            promise = task.process.bind.apply(task.process, task.args.concat(args))();
        }
        catch (error) {
            task.reject(error);
            return promize;
        }

        timeout_id = setTimeout(function() {
            task.reject(new Error(`Function "${task.name}" was timeout (${task.timeout}ms) waiting resolved`));
        }, task.timeout);
        
        if (promise instanceof Promise) {
            promise.then(task.resolve, task.reject);
        }

        return promize;
    }

    function next() {
        clearTimeout(timeout_id);
        current_task = null;
        queuing = false;
        execute();
    };

    queue.takeover = function() {
        if (last_task) {
            tasks.pop();
            tasks = [last_task].concat(tasks);
            last_task = null;
        }
    };

    queue.status = function() {
        return {
            busy: queuing,
            tasks: tasks.length,
            timeout,
            catchable,
            throwable
        };
    };

    queue.callback = function() {
        var callback = {};
        reference.callback = callback;

        return function() {
            callback.task ? callback.task.resolve(arguments) : null;
        };
    };

    queue.exception = function() {
        var exception = {};
        reference.exception = exception;

        return function() {
            exception.task ? exception.task.reject(arguments) : null
        };
    };

    queue.resolve = function(result) {
        current_task && current_task.resolve ? current_task.resolve(result) : null;
    };

    queue.reject = function(error) {
        current_task && current_task.reject ? current_task.reject(error) : null;
    };

    queue.promise = function(promiseCallback) {
        return queue.add(null, function() {
            return promiseCallback instanceof Function ? new Promise(promiseCallback) : new Promise(function(resolve) {
                resolve(promiseCallback);
            });
        });
    };

    queue.call = function(syncFunction) {
        return queue.promise(function(resolve, reject) {
            try {
                resolve(syncFunction instanceof Function ? syncFunction() : syncFunction);
            }
            catch (error) {
                reject(error);
            }
        });
    };
}

module.exports = {
    PromiseQueue,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_CATCHABLE_FLAG,
    DEFAULT_THROWABLE_FLAG
};

try {
    window.PromiseQueue = PromiseQueue;
}
catch (e) {}
