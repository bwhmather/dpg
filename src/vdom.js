function h(type, props, ...children) {
  return { type, props, children };
}

// Renders a node to an element and returns it.
function update(node, $parent, $elem) {
  let $original = $elem;

  if (typeof node == 'string') {
    if ($elem == null || $elem.nodeType != Node.TEXT_NODE) {
      $elem = document.createTextNode(node);
    } else {
      $elem.nodeValue = node;
    }
  } else {
    if ($elem == null || $elem.localName !== node.type) {
      $elem = document.createElement(node.type);
    }

    // === Update attributes ===
    for (let i = 0; i < $elem.attributes.length; i++) {
      let attr = $elem.attributes[i];

      if (!node.props.hasOwnProperty(attr.name)) {
        $elem.removeAttribute(attr.name);
      }
    }

    for (prop in node.props) {
      if (node.props.hasOwnProperty(prop)) {
        $elem.setAttribute(prop, node.props[prop]);
      }
    }

    // === Update children ===
    for (let i = 0; i < node.children.length; i++) {
      let $childElem = $elem.childNodes[i];
      let childNode = node.children[i];

      update(childNode, $elem, $childElem);
    }

    while ($elem.childNodes.length > node.children.length) {
      $elem.removeChild($elem.lastChild);
    }
  }

  if ($original == null) {
    $parent.appendChild($elem);
  } else if ($elem !== $original) {
    $parent.replaceChild($elem, $original);
  }
}


function render($root, node) {
  update(node, $root, $root.lastChild);
}


let vdoms = [
    h("div", {}, "Hello", h("h1", {}, "world")),
    h("div", {}, "world", h("h1", {}, "world")),
    h("div", {}, h("h1", {}, "world"), "!"),
    h("div", {}, h("h1", {"style": "color: red"}, "world"), "!"),
    h("div", {}, h("h1", {}, "world"), "!"),
    h("div", {}, "Hello", h("h1", {}, "world")),
];

let i = 0;

function loop() {
  i += 1;
  i %= vdoms.length;

  render(document.getElementById("root"), vdoms[i]);

  window.setTimeout(loop, 3000);
}

loop();



