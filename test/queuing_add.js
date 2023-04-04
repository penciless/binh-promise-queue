
var expect = require('chai').expect;

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

var { PromiseQueue } = require('../lib/promise-queue');


describe('PromiseQueue - Add items (functions returning promise) to queue', function() {

    const DIRECTORY_PATH = path.join(__dirname, 'test-add');
    const { add, callback, exception, promise, call, interface, catchable, throwable, resolve, reject } = new PromiseQueue();

    before(function(done) {
        fsp.mkdir(DIRECTORY_PATH, { recursive: true }).then(function() { done(); }).catch(done);
    });

    after(function(done) {
        add(fsp, 'rm', DIRECTORY_PATH, { force: true, recursive: true }).then(done).catch(done);
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
            done(new Error('Expect to get rejected promise, but get a fulfilled one'));
        })
        .catch(function(error) {
            expect(error).to.be.an.instanceof(Error);
            done();
        });
    });

    it('should be error (rejected promise) when adding to queue: non-existing function, existing source object', function(done) {
        add(fsp, 'not_existing_function_name', 'random_arg1', 'random_arg2')
            .then(function() {
                done(new Error('Expect to get rejected promise, but get a fulfilled one'));
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            });
    });

    it('should be error (rejected promise) when adding to queue: non-existing function, undefined source object', function(done) {
        add(undefined, 'not_existing_function_name', 'random_arg1', 'random_arg2')
            .then(function() {
                done(new Error('Expect to get rejected promise, but get a fulfilled one'));
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            });
    });

    it('should be error (rejected promise) when adding to queue: undefined function, any source object', function(done) {
        add({}, undefined, 'random_arg1', 'random_arg2')
            .then(function() {
                done(new Error('Expect to get rejected promise, but get a fulfilled one'));
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            });
    });

    // it('should return different queues when initialized with name as special value: undefined', function() {
    //     var queue1 = new PromiseQueue(undefined);
    //     var queue2 = new PromiseQueue(undefined);

    //     expect(queue1).to.not.equal(queue2);
    // });

});