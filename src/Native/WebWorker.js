// TODO belongs in bwhmather/elm-webworker package

Elm.Native.WebWorker = {};
Elm.Native.WebWorker.make = function(elm) {
    elm.Native = elm.Native || {};
    elm.Native.WebWorker = elm.Native.WebWorker || {};
    if (elm.Native.WebWorker.values) {
        return elm.Native.WebWorker.values;
    }

    var Signal = Elm.Signal.make(elm);
    var NS = Elm.Native.Signal.make(elm);
    var List = Elm.Native.List.make(elm);

    function spawn(url, requests) {
        var responses = NS.input({ctor: 'Waiting'});

        if (!window.Worker) {
            elm.notify(responses.id, {ctor: 'Error', _0: "webworkers not supported"});
            return responses;
        }

        var w = new Worker(url);

        w.onmessage = function(event) {
            elm.notify(responses.id, {ctor: 'Message', _0: event.data});
        };

        w.onerror = function(event) {
            elm.notify(responses.id, {ctor: 'Error', _0: event.message});
        };

        function processRequest(req) {
            if (req.ctor === 'SendMessage') {
                w.postMessage(req._0);
            }
        };

        function take1(x,y) { return x }

        elm.notify(responses.id, {ctor: 'Waiting'});

        return A3(
            Signal.map2, F2(take1),
            responses,
            A2(Signal.map, processRequest, requests)
        );
    }
    return elm.Native.WebWorker.values = { spawn: F2(spawn) };
};
