import { h, render } from "./vdom";

function initTarget() {
  return {
    hostname: null,
    username: null,
    password: null,
  };
}

function initSettings() {
  return {
    outputLength: 16,
    enableLowercase: true,
    enableUppercase: true,
    enableNumbers: true,
    enableSymbols: true,
  };
}

function initOutput() {
  return {}
}

function initDpg() {
  return {
    state: {
      target: initTarget(),
      settings: initSettings(),
      output: initOutput(),
    },
    commands: [
      redraw((dispatch) => renderDpg(state, dispatch)),
    ]
  }
}

function updateTarget(targetState, message) {
  switch (message.kind) {
    case 'SET_HOSTNAME':
      return { ...targetState, hostname: message.text };
    case 'SET_USERNAME':
      return { ...targetState, username: message.text };
    case 'SET_PASSWORD':
      return { ...targetState, password: message.text };
    default:
      return targetState
  }
}

function updateSettings(settingsState, message) {
  switch (message.kind) {
    case 'SET_OUTPUT_LENGTH':
      return { ...settingsState, outputLength: message.value };
    case 'SET_ENABLE_LOWERCASE':
      return { ...settingsState, enableLowercase: message.enabled };
    case 'SET_ENABLE_UPPERCASE':
      return { ...settingsState, enableUppercase: message.enabled };
    case 'SET_ENABLE_NUMBERS':
      return { ...settingsState, enableNumbers: message.enabled };
    case 'SET_ENABLE_SYMBOLS':
      return { ...settingsState, enableSymbols: message.enabled };
    default:
      return settingsState;
  }
}

function updateOutput(outputState, message) {
  return outputState;
}

function updateDpg(oldState, message) {
  let state = {
    target: updateTarget(state.target, message),
    settings: updateSettings(state.settings, message),
    output: updateOutput(state.output, message),
  }

  let commands = [];
  if (seed(state) != seed(oldState)) {
    commands.push({ kind: "RECALC", data: seed(state)})
  }
  commands.push({ kind: "REDRAW", data: state });

  commands.push(redraw((dispatch) => renderDpg(state, dispatch))),

  return {state, commands}
}

function input(label, attrs) {
    return h("label", {}, label + ": ", h("input", attrs));
}

function renderTarget(targetState, dispatch) {
  return h(
    "fieldset", {}, 
    h("legend", {}, "Login Details"),

    input("Hostname", {
      "type": "text",
      "value": targetState.hostname || "",
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_HOSTNAME", text: e.target.value});
      },
      "autoFocus": true,
      "autoCorrect": "off",
      "autoCapitalize": "off",
    }),

    input("Username", {
      "type": "text",
      "value": targetState.username || "",
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_USERNAME", text: e.target.value});
      },
      "autoCorrect": "off",
      "autoCapitalize": "off",
    }),

    input("Password", {
      "type": "password",
      "value": targetState.password || "",
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_PASSWORD", text: e.target.value});
      },
    }),
  );
}

function renderSettings(settingsState, dispatch) {
  return h(
    "fieldset", {}, 
    h("legend", {}, "Login Details"),
  
    input("Password Length", {
      "type": "number",
      "value": settingsState.outputLength,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_OUTPUT_LENGTH", value: e.target.value});
      },
    }),

    input("Enable Lowercase", {
      "type": "checkbox",
      "checked": settingsState.enableLowercase,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_LOWERCASE", enabled: e.target.checked});
      },
    }),

    input("Enable Uppercase", {
      "type": "checkbox",
      "checked": settingsState.enableUppercase,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_UPPERCASE", enabled: e.target.checked});
      },
    }),
    input("Enable Numbers", {
      "type": "checkbox",
      "checked": settingsState.enableNumbers,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_NUMBERS", enabled: e.target.checked});
      },
    }),
    input("Enable Symbols", {
      "type": "checkbox",
      "checked": settingsState.enableSymbols,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_SYMBOLS", enabled: e.target.checked});
      },
    }),
  );
}

function renderDpg(state, dispatch) {
  return h("div", {},
    renderTarget(state.target, dispatch),
    renderSettings(state.settings, dispatch),
  );
}

export function loop(updater, executor) {
  function dispatch(message?) {
    let {newState, commands} = updater(state, message);

    for (command of commands) {
      executor(command, dispatch);
    }
  }

  dispatch({kind: 'INIT'});
}

export function run($root) {
  let loop = new Loop(updateDpg, initDpg, [redraw, recalculate]);

  function execute(command, dispatch) {
    switch (command.kind) {
      case 'RECALC':
        recalc(command.data, dispatch);
        break;
      case 'REDRAW':
        redraw(command.data, dispatch);
        break;
    }
  }

  loop.subscribe("render", (getState, dispatch) => {
    render($root, renderDpg(getState(), dispatch))
  });




}



