var { PromiseQueue } = require('./lib/promise-queue');
const { add, callback, exception, promise, call, interface, catchable, throwable, resolve, reject, timeout, defaults, next } = new PromiseQueue();

throwable(false);
timeout(9999999);

var is_rejected = false;

// var p1 = promise(function(resolve, reject) {
//     setTimeout(function() {
//         is_rejected = true;
//         reject(99);
//     });
// });

// var p2 = p1.then(function() {
//     done(ERROR_EXPECTING_REJECTED_PROMISE);
// });

catchable(false);

var p1 = promise(function(resolve) {
    setTimeout(function() {
        complete = true;
        resolve(99);
    });
});

var p2 = p1.then(function(res) {
    console.log('p1', res);
    return Promise.resolve(88);
});

var p3 = p2.then(function(res) {
    console.log('p2', res);
    // return Promise.reject(77);
});

var p4 = p3.then(function(res) {
    console.log('p3', res);
    // return Promise.reject(66);
});

// var p3 = p2.then(function() {
//     return Promise.reject(88);
// });

setTimeout(function() {
    console.log(p1,p2,p3,p4);
});

// var p3 = p2.then(function() {
//     done(ERROR_EXPECTING_REJECTED_PROMISE);
// });

// var p4, p5;

// var interval_id = setInterval(function() {
//     if (is_rejected) {
//         clearInterval(interval_id);
//         // console.log(p1,p2,p3);

//         p4 = p3.then(function(result) {
//             console.log('p4 - then', result);
//             return Promise.reject('bbb');
//         })
//         // .catch(function(err) {
//         //     console.log('p4 - catch', err);
//         //     p4_rejected = true;
//         //     // return 444;
//         //     // return Promise.reject('abc');
//         //     return Promise.resolve('abc');
//         // });

//         setTimeout(function() {
//             console.log('================');
//             console.log(p3, p4);
//             p5 = p4.then(function(result) {
//                 console.log('p5 - then', result);
//             })
//             .catch(function(err) {
//                 console.log('p5 - catch', err);
//             });
//         });
//     }
// });

var p4_rejected = false;

// var interval_id2 = setInterval(function() {
//     if (p4_rejected) {
//         clearInterval(interval_id2);
//         console.log(p4);

//         p5 = p4.then(function(result) {
//             console.log('p5 - then', result);
//         })
//         .catch(function(err) {
//             console.log('p5 - catch', err);
//         });
//     }
// });

setTimeout(function() {
    console.log('1.5sec passed');
}, 1500);
