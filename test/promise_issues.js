
var expect = require('chai').expect;

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

var { PromiseQueue } = require('../lib/promise-queue');


describe('PromiseQueue - Verify promise behaviours after customized', function() {

    const ERROR_EXPECTING_REJECTED_PROMISE = new Error('Expect to get a rejected promise, but got a fulfilled one');

    const DIRECTORY_PATH = path.join(__dirname, 'test-promise');
    const queue = new PromiseQueue();
    const { add, callback, exception, promise, call } = queue;

    before(function(done) {
        fsp.mkdir(DIRECTORY_PATH, { recursive: true }).then(function() { done(); }).catch(done);
    });

    after(function(done) {
        fsp.rm(DIRECTORY_PATH, { force: true, recursive: true }).then(function() { done(); }).catch(done);
    });

    it('should normally queueing tasks (add, done, and next) without using .then or .catch', function(done) {
        // Resolved promise without .then or .catch
        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(111);
            });
        });

        // Rejected promise without .then or .catch
        var p2 = promise(function(resolve, reject) {
            setTimeout(function() {
                reject(new Error('example'));
            });
        });

        // Promise to verify above promises
        promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('done');
            });
        })
        .then(function(result) {
            expect(result).to.equal('done');

            expect(p1.state).to.equal('fulfilled');
            expect(p1.value).to.equal(111);
            expect(p1.next).to.be.undefined; // last one

            expect(p2.state).to.equal('rejected');
            expect(p2.value).to.be.instanceof(Error);
            expect(p2.next).to.be.undefined; // last one

            done();
        })
        .catch(done);
    });

    it('when throwable(false) - last promise (customized as rejected, but actually fulfilled since exception handled by mode throwable:false) should still trigger .catch afterward', function(done) {
        queue.throwable(false);

        var is_rejected = false;

        var p0 = promise(function(resolve, reject) {
            setTimeout(function() {
                reject(0);
            });
        });

        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                is_rejected = true;
                reject(123456);
            });
        });

        var p2 = p1.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });

        var p3 = p2.then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        });

        var p4;

        var interval_id = setInterval(function() {
            if (is_rejected) {
                clearInterval(interval_id);

                p0.catch(function(error) {
                    expect(error).to.equal(0);
                });

                p4 = p3.then(function() {
                    done(ERROR_EXPECTING_REJECTED_PROMISE);
                });

                setTimeout(function() {
                    p5 = p4.then(function() {
                        done(ERROR_EXPECTING_REJECTED_PROMISE);
                    })
                    .catch(function(error) {
                        expect(error).to.equal(123456);
                        done();
                    });
                });
            }
        });
    });

    it('Promise(resolve).then(return Promise.reject) - final promise should still trigger .catch afterward', function(done) {
        queue.throwable(false);

        var complete = false;

        var p1, p2, p3, p4;

        var p1 = promise(function(resolve) {
            setTimeout(function() {
                complete = true;
                resolve(99);
            });
        });

        var p2 = p1.then(function() {
            return Promise.reject(88);
        });

        var interval_id = setInterval(function() {
            if (complete) {
                clearInterval(interval_id);

                p3 = p2.then(function() {
                    done(ERROR_EXPECTING_REJECTED_PROMISE);
                });

                setTimeout(function() {
                    p4 = p3.then(function() {
                        done(ERROR_EXPECTING_REJECTED_PROMISE);
                    })
                    .catch(function(error) {
                        expect(error).to.equal(88);
                        done();
                    });
                });
            }
        });
    });

    it('Promise(reject).then(return Promise.resolve) - final promise should still trigger .then afterward', function(done) {
        queue.throwable(false);

        var complete = false;

        var p1, p2, p3, p4;

        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                complete = true;
                reject(99);
            });
        });

        var p2 = p1.catch(function() {
            return Promise.resolve(88);
        });

        var interval_id = setInterval(function() {
            if (complete) {
                clearInterval(interval_id);
                p3 = p2.then(function(result) {
                    expect(result).to.equal(88);
                    return Promise.resolve(77);
                });

                setTimeout(function() {
                    p4 = p3.then(function(result) {
                        expect(result).to.equal(77);
                        done();
                    });
                });
            }
        });
    });

});