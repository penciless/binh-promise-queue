
var expect = require('chai').expect;

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

var { PromiseQueue } = require('../lib/promise-queue');


describe('PromiseQueue - Create interfaces adding items (functions returning promise) to queue', function() {

    const ERROR_EXPECTING_REJECTED_PROMISE = new Error('Expect to get rejected promise, but get a fulfilled one');

    const DIRECTORY_PATH = path.join(__dirname, 'test-interface');
    const { add, callback, exception, promise, call, interface, catchable, throwable, resolve, reject } = new PromiseQueue();

    var consoleLogOrigin = console.log();

    before(function(done) {
        console.log = function(){};
        fsp.mkdir(DIRECTORY_PATH, { recursive: true }).then(function() { done(); }).catch(done);
    });

    after(function(done) {
        console.log = consoleLogOrigin;
        fsp.rm(DIRECTORY_PATH, { force: true, recursive: true }).then(function() { done(); }).catch(done);
    });

    it('should create interface for an isolated function', function(done) {
        function samplePromiseFunc(success) {
            return new Promise(function (resolve, reject) {
                if (success) resolve(true);
                else reject(false);
            });
        }

        var queueInterfaceFunc = interface(samplePromiseFunc);

        queueInterfaceFunc(true).then(function(result) {
            expect(result).to.be.true;
        })
        .catch(done);

        queueInterfaceFunc(false).then(function(result) {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.false;
            done();
        });
    });

    it('should create interface for a class instance (promise-based)', function(done) {
        var fspInterface = interface(fsp);

        fspInterface.writeFile(path.join(DIRECTORY_PATH, 'file1'), JSON.stringify({ sample: 123 }), { encoding: 'utf8', flag: 'w' })
            .then(function(result) {
                expect(result).to.be.undefined;
            })
            .catch(done);

        
        fspInterface.readFile(path.join(DIRECTORY_PATH, 'file1'), { encoding: 'utf8', flag: 'r' })
            .then(function(result) {
                expect(result).to.equal(JSON.stringify({ sample: 123 }));
            })
            .catch(done);

        
        fspInterface.readFile(path.join(DIRECTORY_PATH, 'not-existing-file'), { encoding: 'utf8', flag: 'r' })
            .then(function() {
                done(ERROR_EXPECTING_REJECTED_PROMISE);
            })
            .catch(function(error) {
                expect(error).to.be.an.instanceof(Error);
                done();
            })
            .catch(done);
    });

    it('should create interface for a class instance (callback-based)', function(done) {
        var fsInterface = interface(fs);

        fsInterface.writeFile(path.join(DIRECTORY_PATH, 'file2'), JSON.stringify({ sample: 123 }), { encoding: 'utf8', flag: 'w' }, callback())
            .then(function(args) {
                var error = args[0], data = args[1];
                expect(error).to.be.null;
                expect(data).to.be.undefined;
            })
            .catch(done);
        
        fsInterface.readFile(path.join(DIRECTORY_PATH, 'file2'), { encoding: 'utf8', flag: 'r' }, function(error, data) {
            if (error) reject(error);
            resolve(data);
        })
        .then(function(result) {
            expect(result).to.equal(JSON.stringify({ sample: 123 }));
        })
        .catch(done);

        
        fsInterface.readFile(path.join(DIRECTORY_PATH, 'not-existing-file'), { encoding: 'utf8', flag: 'r' }, function(error, data) {
            if (error) reject(error);
            resolve(data);
        })
        .then(function() {
            done(ERROR_EXPECTING_REJECTED_PROMISE);
        })
        .catch(function(error) {
            expect(error).to.be.an.instanceof(Error);
            done();
        })
        .catch(done);
    });

    it('should create different interfaces for the same class instance (without naming the interface)', function() {
        var fsInterface1 = interface(fs);
        var fsInterface2 = interface(fs);
        expect(fsInterface1).to.not.equal(fsInterface2);
    });

    it('should create the same interface for the same class instance (with the same name of interface)', function() {
        var fsInterface1 = interface('fs', fs);
        var fsInterface2 = interface('fs');
        expect(fsInterface1).to.equal(fsInterface2);
    });

    it('should override a new interface for the same class instance (with the same name of interface)', function() {
        var fsInterface1 = interface('fs', fs);
        var fsInterface2 = interface('fs', fs);
        expect(fsInterface1).to.not.equal(fsInterface2);
    });

    it('should get the same cached interface from a different queue (by the name assigned for that interface)', function() {
        var fsInterface1 = interface('fs', fs);
        var new_queue = new PromiseQueue();
        var fsInterface2 = new_queue.interface('fs');
        expect(fsInterface1).to.equal(fsInterface2);
    });

    it('should create an empty interface when initialized with undefined class instance or function (no input)', function() {
        var theInterface = interface();
        expect(theInterface).to.eql({});
    });

    it('should create an empty interface when getting a cached interface with unknown name (no existing cache)', function() {
        var theInterface = interface('no-existing-cache-name');
        expect(theInterface).to.eql({});
    });

});