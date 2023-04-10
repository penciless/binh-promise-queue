
var expect = require('chai').expect;

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

var { PromiseQueue } = require('../lib/promise-queue');


describe('PromiseQueue - Other ways to add items (functions returning promise) to queue', function() {

    const ERROR_EXPECTING_REJECTED_PROMISE = new Error('Expect to get a rejected promise, but got a fulfilled one');

    const DIRECTORY_PATH = path.join(__dirname, 'test-others');
    const queue = new PromiseQueue();
    const { add, callback, exception, promise, call } = queue;

    before(function(done) {
        fsp.mkdir(DIRECTORY_PATH, { recursive: true }).then(function() { done(); }).catch(done);
    });

    after(function(done) {
        fsp.rm(DIRECTORY_PATH, { force: true, recursive: true }).then(function() { done(); }).catch(done);
    });

    it('should handle rejected item added using queue.promise() with input as standard promise callback', function(done) {
        promise(function(resolve, reject) {
            reject(new Error('Example error'));
        })
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.an.instanceof(Error);
            done();
        })
        .catch(done); // catch error throwed from expect()
    });

    it('should handle resolved item added using queue.promise() with input as standard promise callback', function(done) {
        promise(function(resolve) {
            resolve(999);
        })
        .then(function(result) {
            expect(result).to.equal(999);
            done();
        })
        .catch(done);
    });

    it('should handle resolved item added using queue.promise() with input as non-function (number, string, boolean, null, undefined, Error, object, etc.)', function(done) {
        promise(999)
        .then(function(result) {
            expect(result).to.equal(999);
        })
        .catch(done);
        
        promise('hello')
        .then(function(result) {
            expect(result).to.equal('hello');
        })
        .catch(done);
        
        promise(true)
        .then(function(result) {
            expect(result).to.equal(true);
        })
        .catch(done);
        
        promise(null)
        .then(function(result) {
            expect(result).to.be.null;
            expect(result).to.not.be.undefined;
        })
        .catch(done);
        
        promise(undefined)
        .then(function(result) {
            expect(result).to.be.undefined;
            expect(result).to.not.be.null;
        })
        .catch(done);
        
        promise(NaN)
        .then(function(result) {
            expect(Number.isNaN(result)).to.be.true;
        })
        .catch(done);
        
        var example_error = new Error('sample error');
        promise(example_error)
        .then(function(result) {
            expect(result).to.equal(example_error);
        })
        .catch(done);
        
        var object = { a: 1, b: 2 };
        promise(object)
        .then(function(result) {
            expect(result).to.equal(object);
            done();
        })
        .catch(done);
    });

    it('should handle resolved item added using queue.call(function) with non-function values (number, string, boolean, null, undefined, Error, object, etc.)', function(done) {
        call(999)
        .then(function(result) {
            expect(result).to.equal(999);
        })
        .catch(done);
        
        call('hello')
        .then(function(result) {
            expect(result).to.equal('hello');
        })
        .catch(done);
        
        call(true)
        .then(function(result) {
            expect(result).to.equal(true);
        })
        .catch(done);
        
        call(null)
        .then(function(result) {
            expect(result).to.be.null;
            expect(result).to.not.be.undefined;
        })
        .catch(done);
        
        call(undefined)
        .then(function(result) {
            expect(result).to.be.undefined;
            expect(result).to.not.be.null;
        })
        .catch(done);
        
        call(NaN)
        .then(function(result) {
            expect(Number.isNaN(result)).to.be.true;
        })
        .catch(done);
        
        var example_error = new Error('sample error');
        call(example_error)
        .then(function(result) {
            expect(result).to.equal(example_error);
        })
        .catch(done);
        
        var object = { a: 1, b: 2 };
        call(object)
        .then(function(result) {
            expect(result).to.equal(object);
            done();
        })
        .catch(done);
    });

    it('should handle resolved item added using queue.call(function) with a function (might return a value or not)', function(done) {
        call(function() {
            return 9 + 1;
        })
        .then(function(result) {
            expect(result).to.equal(10);
        })
        .catch(done);

        
        call(function() {
            var list = ['not', 'return', 'anything'];
        })
        .then(function(result) {
            expect(result).to.be.undefined;
            done();
        })
        .catch(done);
    });

    it('should handle rejected item added using queue.call(function) with a function throwing error', function(done) {
        call(function() {
            throw new Error('Example error');
        })
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.an.instanceof(Error);
            done();
        })
        .catch(done); // catch error throwed from expect()
    });

    it('should handle native callback-based item added using queue.callback() - always resolved', function(done) {
        add(fs, 'writeFile', path.join(DIRECTORY_PATH, 'file1'), JSON.stringify({ sample: 123 }), { encoding: 'utf8', flag: 'w' }, callback())
        .then(function(args) {
            var error = args[0];
            expect(error).to.be.null;
        })
        .catch(done);

        add(fs, 'readFile', path.join(DIRECTORY_PATH, 'file1'), { encoding: 'utf8', flag: 'r' }, callback())
        .then(function(args) {
            var error = args[0], data = args[1];
            expect(error).to.be.null;
            expect(data).to.equal(JSON.stringify({ sample: 123 }));
        })
        .catch(done);

        add(fs, 'readFile', path.join(DIRECTORY_PATH, 'not-existing-file'), { encoding: 'utf8', flag: 'r' }, callback())
        .then(function(args) {
            var error = args[0], data = args[1];
            expect(error).to.be.instanceof(Error);
            expect(data).to.be.undefined;
            done();
        })
        .catch(done);
    });

    it('should handle native callback-based item added using queue.exception() - always rejected', function(done) {
        add(fs, 'readFile', path.join(DIRECTORY_PATH, 'not-existing-file'), { encoding: 'utf8', flag: 'r' }, exception())
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(args) {
            var error = args[0], data = args[1];
            expect(error).to.be.instanceof(Error);
            expect(data).to.be.undefined;
            done();
        })
        .catch(done); // catch error throwed from expect()
    });

    it('should ALWAYS handle resolved (.then) with queue.callback(), and rejected (.catch) with queue.exception()', function(done) {
        function sampleFunction(success, doneCallback, errorCallback) {
            setTimeout(function() {
                if (success) doneCallback(success);
                else errorCallback(success);
            });
        }

        add(null, sampleFunction, true, callback(), exception())
        .then(function(args) {
            var success = args[0];
            expect(success).to.be.true;
        })
        .catch(done);

        add(null, sampleFunction, false, callback(), exception())
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(args) {
            var success = args[0];
            expect(success).to.be.false;
            done();
        })
        .catch(done); // catch error throwed from expect()
    });

});