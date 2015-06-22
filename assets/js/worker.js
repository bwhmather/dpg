importScripts('/assets/js/scrypt.js')
var scrypt = scrypt_module_factory(67108864);

var N = 32768;
var r = 8;
var p = 1;

onmessage = function(event) {
    var password = scrypt.encode_utf8(event.data['password']);
    var salt = scrypt.encode_utf8(event.data['salt']);
    var bytes = event.data['bytes']

    var result = scrypt.crypto_scrypt(password, salt, N, r, p, bytes);

    postMessage({type: 'completed', result: result});

    close();
}
