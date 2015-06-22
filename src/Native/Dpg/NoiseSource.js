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
    var Generator = Elm.Native.Dpg.Generator.make(elm)

    function spawn(requests) {
        var responses = NS.input({ctor: 'NoOp'});

        if (!window.Worker) {
            elm.notify(responses.id, {ctor: 'NotifyError', _0: "webworkers not supported"});
            return responses;
        }

        var w;

        function kill_worker() {
            if (w) {
                w.terminate();
                w = undefined;
                return true;
            } else {
                return false;
            }
        }

        function onmessage(event) {
            /* Ignore message from old workers */
            /* TODO old workers should have been killed.  Kill them again? */
            if (event.target !== w) {
                return;
            }

            switch (event.data['type']) {
              case 'progress':
                elm.notify(responses.id, {ctor: 'NotifyProgress', _0: event.data['progress']});
                break;
              case 'completed':
                w = undefined;
                var generator = Generator.fromInts(event.data['result']);
                elm.notify(responses.id, {ctor: 'NotifyCompleted', _0: generator});
                break;
              case 'error':
                elm.notify(responses.id, {ctor: 'NotifyError', _0: event.data['message']});
                kill_worker();
                break;
              default:
                elm.notify(responses.id, {ctor: 'NotifyError', _0: 'unknown message from worker'});
                kill_worker();
            }
        };

        function onerror(event) {
            elm.notify(responses.id, {ctor: 'NotifyError', _0: event.message});
        };

        function processRequest(req) {

            switch (req.ctor) {
              case 'Request':
                kill_worker();
                w = new Worker('/assets/js/worker.js');
                w.onmessage = onmessage;
                w.onerror = onerror;
                w.postMessage(req._0);
                break;
              case 'Nothing':
                kill_worker();
                break;
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
