!function n(t,e,r){function a(u,c){if(!e[u]){if(!t[u]){var i="function"==typeof require&&require;if(!c&&i)return i(u,!0);if(o)return o(u,!0);var l=new Error("Cannot find module '"+u+"'");throw l.code="MODULE_NOT_FOUND",l}var f=e[u]={exports:{}};t[u][0].call(f.exports,(function(n){return a(t[u][1][n]||n)}),f,f.exports,n,t,e,r)}return e[u].exports}for(var o="function"==typeof require&&require,u=0;u<r.length;u++)a(r[u]);return a}({1:[function(n,t,e){const r={},a={};function o(n){if(void 0!==n&&r[n])return r[n];void 0!==n&&(r[n]=this);var t=this,e=!1,o=null,u=[],c={},i={},l=5e3,f=!0,s=!0,v=null,d=null;function m(n,e){var r=e instanceof Function?e:"string"==typeof e&&null!=n?n[e]:null,a=e&&e.name||"string"==typeof e&&e||"anonymous";return r instanceof Function?{name:a,func:r}:{invalid:t.promise((function(n,t){t(new Error(`Inspected that "${a}" is not a funtion`))}))}}function p(n){u.push(n),d=n;var t=c.callback;delete c.callback;var e=c.exception;delete c.exception;var r=new Promise((function(r,a){n.resolve=function(n){r(n)},n.reject=function(t){if(!n.catchable)return n.resolve(void 0);a(t)},t&&(t.task=n),e&&(e.task=n)}));return function n(t,e){var r=t.then;t.then=function(a,o){t.next=!0;var u=o instanceof Function?function(n){return t.state=c.state="rejected",t.value=n,c.value=o(n),c.next||b(),c.value}:e.catchable&&!e.throwable&&function(n){return t.state=c.state="rejected",t.value=c.value=n,c.next||b(),c.next?Promise.reject(n):n}||function(n){return t.state=c.state="rejected",t.value=c.value=n,t.uncaugtht=c.uncaugtht=!0,c.next||b(),Promise.reject(n)},c=r.call(t,(function(n){return t.state=c.state="fulfilled",t.value=n,c.value=a instanceof Function?a(n):n,c.next||b(),c.value}),u);return c.index=1+("number"==typeof t.index?t.index:t.index=0),n(c,e),c}}(r,n),h(r)}function h(n){if(e)return n;var t,r=u.shift();if(!r)return n;e=!0,d===(v=r)&&(d=null);try{var a=r.argsCallback instanceof Function?r.argsCallback():[];a=a instanceof Array&&a||[],t=r.process.bind.apply(r.process,r.args.concat(a))()}catch(c){return r.reject(c),n}return o=setTimeout((function(){r.reject(new Error(`Function "${r.name}" was timeout (${r.timeout}ms) waiting resolved`))}),r.timeout),t instanceof Promise&&t.then(r.resolve,r.reject),n}function b(){clearTimeout(o),v=null,e=!1,h()}t.timeout=function(n){return l="number"==typeof n?Math.max(0,n):5e3},t.catchable=function(n=!0){return f=!!n},t.throwable=function(n=!0){return s=!!n},t.defaults=function(){return{timeout:l=5e3,catchable:f=!0,throwable:s=!0}},t.interface=function(){var n,e;if(arguments.length>1)e=arguments[0],n=arguments[1];else{if(1!==arguments.length)return{};if("string"==typeof(n=arguments[0]))return i[n]||a[n]||{}}var r=n instanceof Function?function(){return t.add.apply(t,[null,n].concat(Array.from(arguments)))}:{};return Object.keys(n).forEach((function(e){n[e]instanceof Function&&(r[e]=function(){return t.add.apply(t,[n,e].concat(Array.from(arguments)))},r[e].args=function(r){return t.addAsync.apply(t,[n,e,r])})})),"string"==typeof e&&(i[e]=r,a[e]=r),r},t.add=function(n,t){var e=m(n,t);if(e.invalid)return e.invalid;var r=[n].concat(Array.from(arguments).slice(2));return p({name:e.name,process:e.func,catchable:f,throwable:s,timeout:l,args:r})},t.addAsync=function(n,t,e){var r=m(n,t);return r.invalid?r.invalid:p({name:r.name,process:r.func,catchable:f,throwable:s,timeout:l,args:[n],argsCallback:e})},t.takeover=function(){d&&(u.pop(),u=[d].concat(u),d=null)},t.status=function(){return{busy:e,tasks:u.length,timeout:l,catchable:f,throwable:s}},t.callback=function(){var n={};return c.callback=n,function(){n.task&&n.task.resolve(arguments)}},t.exception=function(){var n={};return c.exception=n,function(){n.task&&n.task.reject(arguments)}},t.resolve=function(n){v&&v.resolve&&v.resolve(n)},t.reject=function(n){v&&v.reject&&v.reject(n)},t.promise=function(n){return t.add(null,(function(){return new Promise(n instanceof Function?n:function(t){t(n)})}))},t.call=function(n){return t.promise((function(t,e){try{t(n instanceof Function?n():n)}catch(r){e(r)}}))}}t.exports={PromiseQueue:o,DEFAULT_TIMEOUT_MS:5e3,DEFAULT_CATCHABLE_FLAG:!0,DEFAULT_THROWABLE_FLAG:!0};try{window.PromiseQueue=o}catch(u){}},{}]},{},[1]);