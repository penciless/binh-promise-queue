!function n(t,e,r){function a(c,u){if(!e[c]){if(!t[c]){var i="function"==typeof require&&require;if(!u&&i)return i(c,!0);if(o)return o(c,!0);var f=new Error("Cannot find module '"+c+"'");throw f.code="MODULE_NOT_FOUND",f}var l=e[c]={exports:{}};t[c][0].call(l.exports,(function(n){return a(t[c][1][n]||n)}),l,l.exports,n,t,e,r)}return e[c].exports}for(var o="function"==typeof require&&require,c=0;c<r.length;c++)a(r[c]);return a}({1:[function(n,t,e){const r={},a={};function o(n){if(void 0!==n&&r[n])return r[n];void 0!==n&&(r[n]=this);var t=this,e=!1,o=null,c=[],u={},i={},f=5e3,l=!0,s=!0,v=null;function d(n,e){var r=e instanceof Function?e:"string"==typeof e&&null!=n?n[e]:null,a=e&&e.name||"string"==typeof e&&e||"anonymous";return r instanceof Function?{name:a,func:r}:{invalid:t.promise((function(n,t){t(new Error(`Inspected that "${a}" is not a funtion`))}))}}function m(n){c.push(n);var t=u.callback;delete u.callback;var e=u.exception;delete u.exception;var r=new Promise((function(r,a){n.resolve=function(n){r(n)},n.reject=function(t){if(!n.catchable)return n.resolve(void 0);a(t)},t&&(t.task=n),e&&(e.task=n)}));return function n(t,e){var r=t.then;t.then=function(a,o){t.next=!0;var c=o instanceof Function?function(n){return t.state=u.state="rejected",t.value=n,u.value=o(n),u.next||p(),u.value}:e.catchable&&!e.throwable&&function(n){return t.state=u.state="rejected",t.value=u.value=n,u.next||p(),u.next?Promise.reject(n):n}||function(n){return t.state=u.state="rejected",t.value=u.value=n,t.uncaugtht=u.uncaugtht=!0,u.next||p(),Promise.reject(n)},u=r.call(t,(function(n){return t.state=u.state="fulfilled",t.value=n,u.value=a instanceof Function?a(n):n,u.next||p(),u.value}),c);return u.index=1+("number"==typeof t.index?t.index:t.index=0),n(u,e),u}}(r,n),h(r)}function h(n){if(e)return n;var t,r=c.shift();if(!r)return n;e=!0,v=r;try{var a=r.argsCallback instanceof Function?r.argsCallback():[];a=a instanceof Array&&a||[],t=r.process.bind.apply(r.process,r.args.concat(a))()}catch(u){return r.reject(u),n}return o=setTimeout((function(){r.reject(new Error(`Function "${r.name}" was timeout (${r.timeout}ms) waiting resolved`))}),r.timeout),t instanceof Promise&&t.then(r.resolve,r.reject),n}function p(){clearTimeout(o),v=null,e=!1,h()}t.timeout=function(n){return f="number"==typeof n?Math.max(0,n):5e3},t.catchable=function(n=!0){return l=!!n},t.throwable=function(n=!0){return s=!!n},t.defaults=function(){return{timeout:f=5e3,catchable:l=!0,throwable:s=!0}},t.interface=function(){var n,e;if(arguments.length>1)e=arguments[0],n=arguments[1];else{if(1!==arguments.length)return{};if("string"==typeof(n=arguments[0]))return i[n]||a[n]||{}}var r=n instanceof Function?function(){return t.add.apply(t,[null,n].concat(Array.from(arguments)))}:{};return Object.keys(n).forEach((function(e){n[e]instanceof Function&&(r[e]=function(){return t.add.apply(t,[n,e].concat(Array.from(arguments)))})})),"string"==typeof e&&(i[e]=r,a[e]=r),r},t.add=function(n,t){var e=d(n,t);if(e.invalid)return e.invalid;var r=[n].concat(Array.from(arguments).slice(2));return m({name:e.name,process:e.func,catchable:l,throwable:s,timeout:f,args:r})},t.addAsync=function(n,t,e){var r=d(n,t);return r.invalid?r.invalid:m({name:r.name,process:r.func,catchable:l,throwable:s,timeout:f,args:[n],argsCallback:e})},t.status=function(){return{busy:e,tasks:c.length,timeout:f,catchable:l,throwable:s}},t.callback=function(){var n={};return u.callback=n,function(){n.task&&n.task.resolve(arguments)}},t.exception=function(){var n={};return u.exception=n,function(){n.task&&n.task.reject(arguments)}},t.resolve=function(n){v&&v.resolve&&v.resolve(n)},t.reject=function(n){v&&v.reject&&v.reject(n)},t.promise=function(n){return t.add(null,(function(){return new Promise(n instanceof Function?n:function(t){t(n)})}))},t.call=function(n){return t.promise((function(t,e){try{t(n instanceof Function?n():n)}catch(r){e(r)}}))}}t.exports={PromiseQueue:o,DEFAULT_TIMEOUT_MS:5e3,DEFAULT_CATCHABLE_FLAG:!0,DEFAULT_THROWABLE_FLAG:!0};try{window.PromiseQueue=o}catch(c){}},{}]},{},[1]);