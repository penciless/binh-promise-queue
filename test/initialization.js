var { PromiseQueue } = require('../lib/promise-queue');
var expect = require('chai').expect;

describe('PromiseQueue - Initialization', function() {

    it('should return a new queue object when initialized (without input name, or name as undefined)', function() {
        var queue1 = new PromiseQueue();
        var queue2 = new PromiseQueue();
        var queue3 = new PromiseQueue('QueueName');

        expect(queue1).to.be.an('object');
        expect(queue1.add).to.be.a('function');

        expect(queue2).to.be.an('object');
        expect(queue2.add).to.be.a('function');

        expect(queue3).to.be.an('object');
        expect(queue3.add).to.be.a('function');

        expect(queue1).not.equal(queue2);
        expect(queue2).not.equal(queue3);
        expect(queue3).not.equal(queue1);
    });

    it('should return the same queue when initialized with a specific queue name', function() {
        var queueA1 = new PromiseQueue('QueueNameA');
        var queueA2 = new PromiseQueue('QueueNameA');
        var queueB = new PromiseQueue('QueueNameB');

        expect(queueA1).to.equal(queueA2).but.not.equal(queueB);
    });

    it('should return the same queue when initialized with name as special values and their string version (null, NaN, true, false, -+Infinity, number)', function() {
        var queue_null_keyword = new PromiseQueue(null);
        var queue_null_string = new PromiseQueue('null');
        var queue_NaN_keyword = new PromiseQueue(NaN);
        var queue_NaN_string = new PromiseQueue('NaN');
        var queue_true_keyword = new PromiseQueue(true);
        var queue_true_string = new PromiseQueue('true');
        var queue_false_keyword = new PromiseQueue(false);
        var queue_false_string = new PromiseQueue('false');
        var queue_Infinity_keyword = new PromiseQueue(Infinity);
        var queue_Infinity_string = new PromiseQueue('Infinity');
        var queue_negative_Infinity_keyword = new PromiseQueue(-Infinity);
        var queue_negative_Infinity_string = new PromiseQueue('-Infinity');
        var queue_0_number = new PromiseQueue(0);
        var queue_0_string = new PromiseQueue('0');

        expect(queue_null_keyword).to.equal(queue_null_string);
        expect(queue_NaN_keyword).to.equal(queue_NaN_string);
        expect(queue_true_keyword).to.equal(queue_true_string);
        expect(queue_false_keyword).to.equal(queue_false_string);
        expect(queue_Infinity_keyword).to.equal(queue_Infinity_string);
        expect(queue_negative_Infinity_keyword).to.equal(queue_negative_Infinity_string);
        expect(queue_0_number).to.equal(queue_0_string);
    });

    it('should return the same queue when initialized with name as string: "undefined"', function() {
        var queue1 = new PromiseQueue('undefined');
        var queue2 = new PromiseQueue('undefined');
        var queue3 = new PromiseQueue(undefined);

        expect(queue1).to.equal(queue2);
        expect(queue1).to.not.equal(queue3);
    });

    it('should return different queues when initialized with name as special value: undefined', function() {
        var queue1 = new PromiseQueue(undefined);
        var queue2 = new PromiseQueue(undefined);

        expect(queue1).to.not.equal(queue2);
    });

});