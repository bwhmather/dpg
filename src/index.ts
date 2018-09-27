import { h, render } from "./vdom";


export function run($root) {
  /*** State ***/
  let details = {
    hostname: null,
    username: null,
    password: null,
  };

  let settings = {
    outputLength: 16,
    enableLowercase: true,
    enableUppercase: true,
    enableNumbers: true,
    enableSymbols: true,
  };

  let output = {};

  function recalc() {

  }


  /*** Rendering ***/
  function input(label, attrs) {
      return h("label", {}, label + ": ", h("input", attrs));
  }

  function renderDetails() {
    return h(
      "fieldset", {},
      h("legend", {}, "Login Details"),

      input("Hostname", {
        "type": "text",
        "value": details.hostname || "",
        "onchange": (e) => {
          e.preventDefault();
          details.hostname = e.target.value;
          recalc(); redraw();
        },
        "autoFocus": true,
        "autoCorrect": "off",
        "autoCapitalize": "off",
      }),

      input("Username", {
        "type": "text",
        "value": details.username || "",
        "onchange": (e) => {
          e.preventDefault();
          details.username = e.target.value;
          recalc(); redraw();
        },
        "autoCorrect": "off",
        "autoCapitalize": "off",
      }),

      input("Password", {
        "type": "password",
        "value": details.password || "",
        "onchange": (e) => {
          e.preventDefault();
          details.password = e.target.value;
          recalc(); redraw();
        },
      }),
    );
  }

  function renderOutput() {
    return "output";
  }

  function renderSettings() {
    return h(
      "fieldset", {},
      h("legend", {}, "Login Details"),

      input("Password Length", {
        "type": "number",
        "value": settings.outputLength,
        "onchange": (e) => {
          e.preventDefault();
          settings.outputLength = e.target.value;
          recalc(); redraw();
        },
      }),

      input("Enable Lowercase", {
        "type": "checkbox",
        "checked": settings.enableLowercase,
        "onchange": (e) => {
          e.preventDefault();
          settings.enableLowercase = e.target.checked;
          recalc(); redraw();
        },
      }),

      input("Enable Uppercase", {
        "type": "checkbox",
        "checked": settings.enableUppercase,
        "onchange": (e) => {
          e.preventDefault();
          settings.enableUppercase = e.target.checked;
          recalc(); redraw();
        },
      }),
      input("Enable Numbers", {
        "type": "checkbox",
        "checked": settings.enableNumbers,
        "onchange": (e) => {
          e.preventDefault();
          settings.enableNumbers = e.target.checked;
          recalc(); redraw();
        },
      }),
      input("Enable Symbols", {
        "type": "checkbox",
        "checked": settings.enableSymbols,
        "onchange": (e) => {
          e.preventDefault();
          settings.enableSymbols = e.target.checked;
          recalc(); redraw();
        },
      }),
    );
  }

  function renderDpg() {
    return h("div", {},
      renderDetails(),
      renderOutput(),
      renderSettings(),
    );
  }

  let redrawQueued = false;
  function redraw() {
    if (!redrawQueued) {
      redrawQueued = true;
      window.requestAnimationFrame(() => {
        redrawQueued = false;
        console.log(details);
        console.log(settings);
        render($root, renderDpg())
      });
    }
  }

  redraw();
}
