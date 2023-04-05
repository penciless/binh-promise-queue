
var expect = require('chai').expect;

var { PromiseQueue } = require('../lib/promise-queue');

describe('PromiseQueue - Verify ordering-related behaviors', function() {

    const { promise } = new PromiseQueue();

    it('Promise chains - each promise owns customized properties: state, value, index and next (next = true if have a next promise)', function(done) {
        var is_resolved = false;

        var p1 = promise(function(resolve, reject) {
            setTimeout(function() {
                is_resolved = true;
                resolve('a');
            });
        });
        
        var p2 = p1.then(function(result) {
            return result + 'a';
        });
        
        var p3 = p2.then(function(result) {
            return result + 'a';
        });

        var interval_id = setInterval(function() {
            if (is_resolved) {
                clearInterval(interval_id);

                expect(p1.index).to.equal(0);
                expect(p1.state).to.equal('fulfilled');
                expect(p1.value).to.equal('a');
                expect(p1.next).to.be.true;

                expect(p2.index).to.equal(1);
                expect(p2.state).to.equal('fulfilled');
                expect(p2.value).to.equal('aa');
                expect(p2.next).to.be.true;

                expect(p3.index).to.equal(2);
                expect(p3.state).to.equal('fulfilled');
                expect(p3.value).to.equal('aaa');
                expect(p3.next).to.be.undefined; // last one

                done();
            }
        });
    });
    
});
