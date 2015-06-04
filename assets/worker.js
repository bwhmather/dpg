importScripts('/assets/scrypt.js')

onmessage = function(event) {
    postMessage({type: 'completed', result: 'hello'});
}
