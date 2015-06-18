importScripts('/assets/js/scrypt.js')

onmessage = function(event) {
    postMessage({type: 'completed', result: 'hello'});
}
