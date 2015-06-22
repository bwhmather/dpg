importScripts('/assets/js/scrypt.js')

onmessage = function(event) {
    postMessage({type: 'completed', result: [1, 2, 3, 4]});
}
