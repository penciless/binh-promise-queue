
var expect = require('chai').expect;

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

var {
    PromiseQueue,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_CATCHABLE_FLAG,
    DEFAULT_THROWABLE_FLAG
} = require('../lib/promise-queue');


describe('PromiseQueue - Utilities that configure queue behaviors', function() {

    const ERROR_EXPECTING_REJECTED_PROMISE = new Error('Expect to get a rejected promise, but got a fulfilled one');
    const ERROR_EXPECTING_RESOLVED_PROMISE = new Error('Expect to get a fulfilled promise, but got a rejected one')

    const { add, callback, exception, promise, call, interface, catchable, throwable, resolve, reject, timeout, defaults } = new PromiseQueue();

    it('should cancel current task when timeout (in millisecond), and continue the next task', function(done) {
        var output = [];

        timeout(1);
        
        promise(function(resolve) {
            setTimeout(function() {
                resolve(true);
            }, 10);
        })
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            output.push(error);
            expect(error).to.be.an.instanceof(Error);
        })
        .catch(done);
        
        promise(function(resolve) {
            setTimeout(function() {
                resolve(true);
            });
        })
        .then(function(result) {
            output.push(result);
            expect(result).to.be.true;
            expect(output[0]).to.be.an.instanceof(Error);
            expect(output[1]).to.be.true;
            done();
        })
        .catch(function() {
            done(ERROR_EXPECTING_RESOLVED_PROMISE);
        });
    });

    it('should timeout immediately when set timeout values as: 0, NaN, Infinity, negative number (n < 0)', function() {
        expect(Number.isNaN(timeout(NaN))).to.be.true;

        expect(timeout(Infinity)).to.equal(Infinity);

        expect(timeout(0)).to.equal(0);
        expect(timeout(-1)).to.equal(0);
        expect(timeout(-99)).to.equal(0);
    });

    it('should reset timeout to default value when it is set with non-number values: boolean, string, object, null, undefined, array, function', function() {
        expect(timeout(function(){})).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout({})).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout([])).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout('')).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout('any string')).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout(null)).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout(undefined)).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout(true)).to.equal(DEFAULT_TIMEOUT_MS);
        expect(timeout(false)).to.equal(DEFAULT_TIMEOUT_MS);
    });

    it('should always resolved (.then) as undefined (not allow .catch) when error happens in mode queue.catchable(false)', function(done) {
        var count_then = 0;

        catchable(false);

        promise(function(resolve, reject) {
            reject(new Error('Example error'));
        })
        .then(function(result) {
            count_then++;
            expect(result).to.be.undefined;
            return true;
        })
        .then(function(result) {
            count_then++;
            expect(result).to.be.true;
            return false;
        })
        .catch(function() {
            done(ERROR_EXPECTING_RESOLVED_PROMISE);
        })
        .then(function(result) {
            count_then++;
            expect(result).to.be.false;
            expect(count_then).to.equal(3);
            done();
        })
        .catch(done);
    });

    it('should be always set as boolean when queue.catchable(value) is called with different types of input', function() {
        expect(catchable(true)).to.be.true;
        expect(catchable({})).to.be.true;
        expect(catchable([])).to.be.true;
        expect(catchable(function(){})).to.be.true;
        expect(catchable('any string')).to.be.true;
        expect(catchable(undefined)).to.be.true;
        expect(catchable(Infinity)).to.be.true;
        expect(catchable(99)).to.be.true;
        
        expect(catchable(false)).to.be.false;
        expect(catchable('')).to.be.false;
        expect(catchable(0)).to.be.false;
        expect(catchable(NaN)).to.be.false;
        expect(catchable(null)).to.be.false;

        expect(catchable()).to.equal(DEFAULT_CATCHABLE_FLAG);
    });

    it('should be always set as boolean when queue.throwable(value) is called with different types of input', function() {
        expect(throwable(true)).to.be.true;
        expect(throwable({})).to.be.true;
        expect(throwable([])).to.be.true;
        expect(throwable(function(){})).to.be.true;
        expect(throwable('any string')).to.be.true;
        expect(throwable(undefined)).to.be.true;
        expect(throwable(Infinity)).to.be.true;
        expect(throwable(99)).to.be.true;
        
        expect(throwable(false)).to.be.false;
        expect(throwable('')).to.be.false;
        expect(throwable(0)).to.be.false;
        expect(throwable(NaN)).to.be.false;
        expect(throwable(null)).to.be.false;
        
        expect(throwable()).to.equal(DEFAULT_THROWABLE_FLAG);
    });

    it('should reset all settings of .timeout(), .catchable(), .throwable() to defaults', function() {
        expect(defaults()).to.eql({
            timeout: DEFAULT_TIMEOUT_MS,
            catchable: DEFAULT_CATCHABLE_FLAG,
            throwable: DEFAULT_THROWABLE_FLAG
        });
    });

    it('queue.throwable(true) - should throw exception (stop program) when not using any .catch()', function(done) {
        throwable(true);
        
        var is_rejected = false;

        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                is_rejected = true;
                reject(new Error('Example error'));
            });
        });
        
        var p2 = p1.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });
        
        var p3 = p2.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });

        var interval_id = setInterval(function() {
            if (is_rejected) {
                clearInterval(interval_id);

                expect(p1.state).to.equal('rejected');
                expect(p1.value).to.be.instanceof(Error);
                expect(p1.uncaugtht).to.be.true;

                expect(p2.state).to.equal('rejected');
                expect(p2.value).to.be.instanceof(Error);
                expect(p2.uncaugtht).to.be.true;

                expect(p3.state).to.equal('rejected');
                expect(p3.value).to.be.instanceof(Error);
                expect(p3.uncaugtht).to.be.true;
                expect(p3.next).to.be.undefined; // last one

                done();
            }
        });
    });

    it('queue.throwable(false) - should ignore exception (not stop program) without using .catch(), but all .then() are skipped', function(done) {
        throwable(false);
        
        var is_rejected = false;

        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                is_rejected = true;
                reject(new Error('Example error'));
            });
        });
        
        var p2 = p1.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });
        
        var p3 = p2.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });

        var interval_id = setInterval(function() {
            if (is_rejected) {
                clearInterval(interval_id);

                expect(p1.state).to.equal('rejected');
                expect(p1.value).to.be.instanceof(Error);
                expect(p1.uncaugtht).to.be.undefined;

                expect(p2.state).to.equal('rejected');
                expect(p2.value).to.be.instanceof(Error);
                expect(p2.uncaugtht).to.be.undefined;

                expect(p3.state).to.equal('rejected');
                expect(p3.value).to.be.instanceof(Error);
                expect(p3.uncaugtht).to.be.undefined;
                expect(p3.next).to.be.undefined; // last one

                done();
            }
        });
    });

    it('queue.throwable(false) - should ignore exception (not stop program), but still able to use .catch() to handle exception', function(done) {
        throwable(false);
        
        var is_rejected = false;

        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                is_rejected = true;
                reject(new Error('Example error'));
            });
        });
        
        var p2 = p1.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });
        
        var p3 = p2.catch(function(error) {
            expect(error).to.be.instanceof(Error);
            return 123;
        });
        
        var p4 = p3.then(function(result) {
            expect(result).to.equal(123);
            return result;
        });

        var interval_id = setInterval(function() {
            if (is_rejected) {
                clearInterval(interval_id);

                expect(p1.state).to.equal('rejected');
                expect(p1.value).to.be.instanceof(Error);

                expect(p2.state).to.equal('rejected');
                expect(p2.value).to.be.instanceof(Error);

                expect(p3.state).to.equal('fulfilled');
                expect(p3.value).to.equal(123);

                expect(p4.state).to.equal('fulfilled');
                expect(p4.value).to.equal(123);
                expect(p4.next).to.be.undefined; // last one

                done();
            }
        });
    });

    it('should interfere and resolve inside a callback-based function using queue.resolve(result)', function(done) {
        function sampleFunction(callback) {
            setTimeout(function() {
                callback(99);
            });
        }

        var queue = new PromiseQueue();

        queue.add(null, sampleFunction, function(result) {
            queue.resolve(result);
        })
        .then(function(result) {
            expect(result).to.equal(99);
            done();
        })
        .catch(done);
    });

    it('should interfere and reject inside a callback-based function using queue.reject(error)', function(done) {
        function sampleFunction(callback) {
            setTimeout(function() {
                callback(new Error('Example error'));
            });
        }

        var queue = new PromiseQueue();

        queue.add(null, sampleFunction, function(error) {
            queue.reject(error);
        })
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.instanceof(Error);
            done();
        })
        .catch(done);
    });

    it('should be safe when unpurposely triggering queue.resolve, queue.reject, queue.callback, queue.exception', function() {
        var queue = new PromiseQueue();

        queue.resolve();
        queue.reject();
        queue.callback()();
        queue.exception()();

        queue.resolve();
        queue.reject();
        queue.callback()();
        queue.exception()();
    });

    it('queue.status() - should returns final parameters of the current running queue', function(done) {
        var queue = new PromiseQueue();

        queue.catchable(!DEFAULT_CATCHABLE_FLAG);
        queue.throwable(!DEFAULT_THROWABLE_FLAG);
        queue.timeout(DEFAULT_TIMEOUT_MS + 2000);

        var status = queue.status();

        expect(status.catchable).to.equal(!DEFAULT_CATCHABLE_FLAG);
        expect(status.throwable).to.equal(!DEFAULT_THROWABLE_FLAG);
        expect(status.timeout).to.equal(DEFAULT_TIMEOUT_MS + 2000);
        expect(status.busy).to.be.false;
        expect(status.tasks).to.equal(0);

        queue.defaults();
        
        // Run immediately after added => queue size: 0
        queue.promise(function(resolve) {
            setTimeout(function() {
                resolve(99);
            });
        })
        .catch(done);

        // Waiting above task after added => queue size: 1
        queue.promise(function(resolve) {
            setTimeout(function() {
                resolve(99);
            });
        })
        .catch(done);

        var status = queue.status();

        expect(status.catchable).to.equal(DEFAULT_CATCHABLE_FLAG);
        expect(status.throwable).to.equal(DEFAULT_THROWABLE_FLAG);
        expect(status.timeout).to.equal(DEFAULT_TIMEOUT_MS);
        expect(status.busy).to.be.true;
        expect(status.tasks).to.equal(1);

        done();
    });

    it('queue.takeover() - should prioritize the last task, having just added to queue, to run first (move to front queue) after the running task', function(done) {
        var queue = new PromiseQueue();

        var { promise, takeover } = queue;

        var chain = [];
        
        // Add task 01 to queue
        promise(function(resolve) {
            setTimeout(function() {
                resolve('task 01');
            });
        })
        .then(function(result) {
            chain.push(result);
            // Add task interception to queue
            interception();
            takeover();
        })
        .catch(done);

        // Add task 02 to queue
        promise(function(resolve) {
            setTimeout(function() {
                resolve('task 02');
            });
        })
        .then(function(result) {
            chain.push(result);
        })
        .catch(done);

        // Declare task interception
        function interception() {
            promise(function(resolve) {
                setTimeout(function() {
                    resolve('task interception');
                });
            })
            .then(function(result) {
                chain.push(result);
            })
            .catch(done);
        }

        var interval_id = setInterval(function() {
            if (chain.length >= 3) {
                clearInterval(interval_id);
                expect(chain[0]).to.equal('task 01');
                expect(chain[1]).to.equal('task interception');
                expect(chain[2]).to.equal('task 02');
                done();
            }
        });
    });

    it('queue.takeover() - should only move task to front queue once, multiple calls of .takeover() not affecting multiple tasks in rear queue, until a new task is added', function(done) {
        var queue = new PromiseQueue();

        var { promise, takeover } = queue;

        var chain = [];

        function createTask(input) {
            promise(function(resolve) {
                setTimeout(function() {
                    resolve(input);
                });
            })
            .then(function(result) {
                chain.push(result);
            })
            .catch(done);
        }

        // Add task 01 to queue
        // queue: [01 running][]
        createTask('task 01');

        // Add task 02 to queue
        // queue: [01 running][02]
        createTask('task 02');

        // Add task 03 to queue
        // queue: [01 running][02, 03]
        createTask('task 03');

        // Move task 03 before task 02 (not before 01, because 01 is executed right after added to queue)
        takeover(); // queue: [01 running][03, 02]
        takeover(); // try to move more, but failed
        takeover(); // try to move more, but failed

        // Add task 04 to queue
        // queue: [01 running][03, 02, 04]
        createTask('task 04');

        // Move task 04 before task 03 (since 03 is currently the most queue-front task)
        takeover(); // queue: [01 running][04, 03, 02]
        takeover(); // try to move more, but failed
        takeover(); // try to move more, but failed

        var interval_id = setInterval(function() {
            if (chain.length >= 4) {
                clearInterval(interval_id);
                expect(chain[0]).to.equal('task 01');
                expect(chain[1]).to.equal('task 04');
                expect(chain[2]).to.equal('task 03');
                expect(chain[3]).to.equal('task 02');
                done();
            }
        });
    });
    
});
