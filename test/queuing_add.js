
var expect = require('chai').expect;

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

var { PromiseQueue } = require('../lib/promise-queue');


describe('PromiseQueue - Add items (functions returning promise) to queue', function() {

    const ERROR_EXPECTING_REJECTED_PROMISE = new Error('Expect to get a rejected promise, but got a fulfilled one');

    const DIRECTORY_PATH = path.join(__dirname, 'test-add');
    const queue = new PromiseQueue();
    const { add, addAsync } = queue;

    before(function(done) {
        fsp.mkdir(DIRECTORY_PATH, { recursive: true }).then(function() { done(); }).catch(done);
    });

    after(function(done) {
        fsp.rm(DIRECTORY_PATH, { force: true, recursive: true }).then(function() { done(); }).catch(done);
    });

    it('should handle when adding to queue an item using string name of function', function(done) {
        add(fsp, 'writeFile', path.join(DIRECTORY_PATH, 'file1'), JSON.stringify({ sample: 123 }), { encoding: 'utf8', flag: 'w' })
            .then(function(result) {
                expect(result).to.be.undefined;
                done();
            })
            .catch(done);
    });

    it('should handle when adding to queue an item using function object', function(done) {
        add(fsp, fsp.readFile, path.join(DIRECTORY_PATH, 'file1'), { encoding: 'utf8', flag: 'r' })
            .then(function(result) {
                expect(result).to.equal(JSON.stringify({ sample: 123 }));
                done();
            })
            .catch(done);
    });

    it('should handle when adding to queue an isolated function (have no source object, or binded to any "this" argument)', function(done) {
        add(null, function() {
            return new Promise(function (resolve, reject) {
                resolve(999);
            });
        })
        .then(function(result) {
            expect(result).to.equal(999);
            done();
        })
        .catch(done);
    });

    it('should be error (rejected promise) when adding to queue an isolated function requiring source object (but missing)', function(done) {
        add(null, function() {
            var undefined_value = this.undefined_property;
            return new Promise(function (resolve, reject) {
                var value = undefined_value.toString(); // intended causing exception (throw error)
                resolve(value);
            });
        })
        .then(function(result) {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.an.instanceof(Error);
            done();
        });
    });

    it('should be error (rejected promise) when adding to queue: non-existing function, existing source object', function(done) {
        add(fsp, 'not_existing_function_name', 'random_arg1', 'random_arg2')
            .then(function() {
                done(ERROR_EXPECTING_REJECTED_PROMISE);
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            });
    });

    it('should be error (rejected promise) when adding to queue: non-existing function, undefined source object', function(done) {
        add(undefined, 'not_existing_function_name', 'random_arg1', 'random_arg2')
            .then(function() {
                done(ERROR_EXPECTING_REJECTED_PROMISE);
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            });
    });

    it('should be error (rejected promise) when adding to queue: undefined function, any source object', function(done) {
        add({}, undefined, 'random_arg1', 'random_arg2')
            .then(function() {
                done(ERROR_EXPECTING_REJECTED_PROMISE);
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            });
    });

    it('addAsync() - getting arguments should be waited until the task starts processing', function(done) {
        var required_arg = null;

        add(fsp, 'writeFile', path.join(DIRECTORY_PATH, 'file2'), JSON.stringify({ sample: 345 }), { encoding: 'utf8', flag: 'w' })
        .then(function() {
            required_arg = 'file2';
        })
        .catch(done);

        addAsync(fsp, fsp.readFile, function() {
            return [path.join(DIRECTORY_PATH, required_arg), { encoding: 'utf8', flag: 'r' }];
        })
        .then(function(result) {
            expect(result).to.equal(JSON.stringify({ sample: 345 }));
            done();
        })
        .catch(done);
    });

    it('addAsync() - should pass no argument to function when argsCallback() being undefined or non-function, or returning value that not an array', function(done) {
        var required_arg = 'hello';

        function sample(any_arg) {
            return new Promise(function (resolve) {
                setTimeout(function() {
                    resolve(any_arg);
                });
            });
        }

        addAsync(null, sample)
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, null)
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, [])
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, {})
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, 1234)
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, function() {})
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, function() { return { abc: 123 }; })
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        addAsync(null, sample, function() { return required_arg; })
        .then(function(result) {
            expect(result).to.be.undefined;
        })
        .catch(done);

        // Correct way to define argsCallback()
        addAsync(null, sample, function() { return [required_arg]; })
        .then(function(result) {
            expect(result).to.equal('hello');
            done();
        })
        .catch(done);
    });

    it('addAsync() - should handle rejected promise when argsCallback() throws error', function(done) {
        function sample(any_arg) {
            return new Promise(function (resolve) {
                setTimeout(function() {
                    resolve(any_arg);
                });
            });
        }

        function argsCallback() {
            var undefined_value;
            var makeItError = undefined_value.toString();
            return [makeItError];
        };

        addAsync(null, sample, argsCallback)
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.instanceof(Error);
            done();
        })
        .catch(done);
    });

    it('addAsync() - should handle rejected promise when adding to queue an undefined function', function(done) {
        addAsync({}, undefined, function(){})
            .then(function() {
                done(ERROR_EXPECTING_REJECTED_PROMISE);
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            })
            .catch(done);
    });

});