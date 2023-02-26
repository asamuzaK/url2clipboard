/**
 * serialize-dom.js
 */

/* shared */
import nsURI from './ns-uri.js';
import { getType, isString, logErr } from './common.js';
import { MIME_HTML } from './constant.js';

/**
 * get namespace of node from ancestor
 *
 * @param {object} node - element node
 * @returns {object} - namespace data
 */
export const getNodeNS = node => {
  const ns = { node: null, localName: null, namespaceURI: null };
  if (node.namespaceURI) {
    ns.node = node;
    ns.localName = node.localName;
    ns.namespaceURI = node.namespaceURI;
  } else {
    const root = document.documentElement;
    while (node && node !== root && !ns.node) {
      const { localName, parentNode, namespaceURI } = node;
      if (namespaceURI) {
        ns.node = node;
        ns.localName = localName;
        ns.namespaceURI = namespaceURI;
      } else {
        node = parentNode;
      }
    }
    if (!ns.node) {
      ns.node = root;
      ns.localName = root.localName;
      ns.namespaceURI =
        root.getAttribute('xmlns') || nsURI[root.localName] || '';
    }
  }
  return ns;
};

/**
 * set namespaced attribute
 *
 * @param {object} elm - element to append attributes
 * @param {object} node - element node to get attributes from
 * @returns {void}
 */
export const setAttributeNS = (elm, node = {}) => {
  const { attributes } = node;
  if (elm && attributes && attributes.length) {
    for (const attr of attributes) {
      const { localName, name, namespaceURI, prefix, value } = attr;
      if (typeof node[name] !== 'function' && !localName.startsWith('on')) {
        const attrName = prefix ? `${prefix}:${localName}` : localName;
        const ns = namespaceURI || (prefix && nsURI[prefix]) || null;
        const { origin } = document.location;
        switch (localName) {
          case 'data':
          case 'href':
          case 'poster':
          case 'src': {
            const { protocol } = new URL(value, origin);
            if (/https?/.test(protocol)) {
              elm.setAttributeNS(ns, attrName, value);
            }
            break;
          }
          case 'ping': {
            const urls = value.split(/\s+/);
            let bool = true;
            for (const url of urls) {
              const { protocol } = new URL(url, origin);
              if (!/https?/.test(protocol)) {
                bool = false;
                break;
              }
            }
            if (bool) {
              elm.setAttributeNS(ns, attrName, value);
            }
            break;
          }
          case 'value': {
            elm.setAttributeNS(ns, attrName, '');
            break;
          }
          default:
            elm.setAttributeNS(ns, attrName, value);
        }
      }
    }
  }
};

/**
 * create namespaced element
 *
 * @param {object} node - element node to create element from
 * @returns {object} - namespaced element
 */
export const createElement = node => {
  let elm;
  if (node?.nodeType === Node.ELEMENT_NODE) {
    const { attributes, localName, namespaceURI, prefix } = node;
    const ns = namespaceURI || (prefix && nsURI[prefix]) ||
               getNodeNS(node).namespaceURI || nsURI.html;
    const name = prefix ? `${prefix}:${localName}` : localName;
    if (localName === 'script') {
      elm = null;
    } else {
      elm = document.createElementNS(ns, name);
      if (attributes && !(node instanceof HTMLUnknownElement)) {
        setAttributeNS(elm, node);
      }
    }
  }
  return elm || null;
};

/**
 * create document fragment from nodes array
 *
 * @param {Array} nodes - nodes array
 * @returns {object} - document fragment
 */
export const createFragment = nodes => {
  const frag = document.createDocumentFragment();
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (node?.nodeType === Node.ELEMENT_NODE ||
          node?.nodeType === Node.TEXT_NODE) {
        frag.appendChild(node);
      }
    }
  }
  return frag;
};

/**
 * append child nodes
 *
 * @param {object} elm - container element
 * @param {object} node - node containing child nodes to append
 * @returns {object} - element
 */
export const appendChildNodes = (elm, node) => {
  const parent = createElement(elm);
  if (parent?.nodeType === Node.ELEMENT_NODE && node?.hasChildNodes()) {
    const arr = [];
    const nodes = node.childNodes;
    for (const child of nodes) {
      const { nodeType, nodeValue, parentNode } = child;
      if (nodeType === Node.ELEMENT_NODE) {
        if (child === parentNode.firstChild) {
          arr.push(document.createTextNode('\n'));
        }
        arr.push(appendChildNodes(child, child.cloneNode(true)));
        if (child === parentNode.lastChild) {
          arr.push(document.createTextNode('\n'));
        }
      } else if (nodeType === Node.TEXT_NODE) {
        arr.push(document.createTextNode(nodeValue));
      }
    }
    if (arr.length) {
      const frag = createFragment(arr);
      parent.appendChild(frag);
    }
  }
  return parent;
};

/**
 *
 * serialize DOM string
 *
 * @param {string} domstr - DOM string
 * @param {string} mime - mime type
 * @param {boolean} reqElm - require first element child
 * @returns {?string} - serialized DOM string
 */
export const serializeDomString = (domstr, mime, reqElm = false) => {
  if (!isString(domstr)) {
    throw new TypeError(`Expected String but got ${getType(domstr)}.`);
  }
  if (!isString(mime)) {
    throw new TypeError(`Expected String but got ${getType(mime)}.`);
  }
  if (!/text\/(?:ht|x)ml|application\/(?:xhtml\+)?xml|image\/svg\+xml/.test(mime)) {
    throw new TypeError(`Unsupported MIME type ${mime}.`);
  }
  const dom = new DOMParser().parseFromString(domstr, mime);
  if (dom.querySelector('parsererror')) {
    throw new Error('Error while parsing DOM string.');
  }
  const { body, documentElement: root } = dom;
  let frag;
  try {
    if (mime === MIME_HTML) {
      const { childNodes, firstElementChild } = body;
      if (body.hasChildNodes() && (!reqElm || firstElementChild)) {
        frag = document.createDocumentFragment();
        for (const child of childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const elm = appendChildNodes(child, child.cloneNode(true));
            if (elm?.nodeType === Node.ELEMENT_NODE) {
              frag.appendChild(elm);
            }
          } else if (child.nodeType === Node.TEXT_NODE && child.nodeValue) {
            frag.appendChild(document.createTextNode(child.nodeValue));
          }
        }
      }
    } else {
      const elm = appendChildNodes(root, root.cloneNode(true));
      frag = document.createDocumentFragment();
      frag.appendChild(elm);
    }
  } catch (e) {
    frag = null;
    logErr(e);
  }
  return frag ? new XMLSerializer().serializeToString(frag) : null;
};
