Elm.Native.Dpg = Elm.Native.Dpg || {};

Elm.Native.Dpg.NoiseSource = {};
Elm.Native.Dpg.NoiseSource.make = function(elm) {
    elm.Native = elm.Native || {};
    elm.Native.Dpg = elm.Native.Dpg || {};
    elm.Native.Dpg.NoiseSource = elm.Native.Dpg.NoiseSource || {};

    if (elm.Native.Dpg.NoiseSource.values) {
        return elm.Native.Dpg.NoiseSource.values;
    }

    var Signal = Elm.Signal.make(elm);
    var NS = Elm.Native.Signal.make(elm);
    var List = Elm.Native.List.make(elm);

    function spawn(requests) {
        var responses = NS.input({ctor: 'NoOp'});

        if (!window.Worker) {
            elm.notify(responses.id, {ctor: 'NotifyError', _0: "webworkers not supported"});
            return responses;
        }

        var w;

        onmessage = function(event) {
            /* Ignore message from old workers */
            if (event.target !== w) {
                return;
            }

            switch (event.data['type']) {
              case 'progress':
                elm.notify(responses.id, {ctor: 'NotifyProgress', _0: event.data['progress']});
                break;
              case 'completed':
                w = undefined;
                elm.notify(response.id, {ctor: 'NotifyCompleted', _0: event.data['result']});
                break;
              case 'error':
              default:
                // TODO
            }
        };

        onerror = function(event) {
            elm.notify(responses.id, {ctor: 'NotifyError', _0: event.message});
        };

        function processRequest(req) {

            switch (req.ctor) {
              case 'Request':
                if (w) {
                    w.terminate();
                    w = undefined;
                }
                w = new Worker('worker.js');
                w.onmessage = onmessage;
                w.onerror = onerror;
                w.postMessage(req._0);
                break;
              case 'Nothing':
            }
        };

        function take1(x,y) { return x }

        return A3(
            Signal.map2, F2(take1),
            responses,
            A2(Signal.map, processRequest, requests)
        );
    }
    return elm.Native.Dpg.NoiseSource.values = { spawn: spawn };
};
