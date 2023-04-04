
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

    // const DIRECTORY_PATH = path.join(__dirname, 'test-interface');
    const { add, callback, exception, promise, call, interface, catchable, throwable, resolve, reject, timeout } = new PromiseQueue();

    var consoleLogOrigin = console.log();

    before(function() {
        console.log = function(){};
        // fsp.mkdir(DIRECTORY_PATH, { recursive: true }).then(function() { done(); }).catch(done);
    });

    after(function() {
        console.log = consoleLogOrigin;
        // fsp.rm(DIRECTORY_PATH, { force: true, recursive: true }).then(function() { done(); }).catch(done);
    });

    it('should cancel current task when timeout (in millisecond), and continue the next task', function(done) {
        var output = [];

        timeout(10);
        
        promise(function(resolve) {
            setTimeout(function() {
                resolve(true);
            }, 20);
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
    

});