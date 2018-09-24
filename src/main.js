"use strict";

function updateTarget(targetState, action) {
  switch (action.kind) {
    case 'SET_HOSTNAME':
      return { ...targetState, hostname: action.text };
    case 'SET_USERNAME':
      return { ...targetState, username: action.text };
    case 'SET_PASSWORD':
      return { ...tergetState, password: action.text };
    default:
      return targetState
  }
}

function updateSettings(settingsState, action) {
  switch (action.kind) {
    case 'SET_OUTPUT_LENGTH':
      return { ...settingsState, outputLength: action.value };
    case 'SET_ENABLE_LOWERCASE':
      return { ...settingsState, enableLowercase: action.enabled };
    case 'SET_ENABLE_UPPERCASE':
      return { ...settingsState, enableUppercase: action.enabled };
    case 'SET_ENABLE_NUMBERS':
      return { ...settingsState, enableNumbers: action.enabled };
    case 'SET_ENABLE_SYMBOLS':
      return { ...settingsState, enableSymbols: action.enabled };
  }

}

function updateDpg(state, action) {
  return {
    target: updateTarget(state.target, action),
    settings: updateSettings(state.settings, action),
  }
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
      "value": settingsState.enableLowercase,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_LOWERCASE", value: e.target.value});
      },
    }),

    input("Enable Uppercase", {
      "type": "checkbox",
      "value": settingsState.enableUppercase,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_UPPERCASE", value: e.target.value});
      },
    }),
    input("Enable Lowercase", {
      "type": "checkbox",
      "value": settingsState.enableNumbers,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_NUMBERS", value: e.target.value});
      },
    }),
    input("Enable Lowercase", {
      "type": "checkbox",
      "value": settingsState.enableSymbols,
      "onchange": (e) => {
        e.preventDefault();
        dispatch({kind: "SET_ENABLE_SYMBOLS", value: e.target.value});
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

let state = {
  target: {
    hostname: null,
    username: null,
    password: null,
  },
  settings: {
    outputLength: 16,
    enableLowercase: true,
    enableUppercase: true,
    enableNumbers: true,
    enableSymbols: true,
  },
  output: null,
};

function dispatch(action) {
  state = updateDpg(state, action);
  render(document.getElementById("root"), renderDpg(state, dispatch));
}

render(document.getElementById("root"), renderDpg(state, dispatch));
