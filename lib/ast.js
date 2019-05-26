
class AST {
  constructor() {
    this.nodes = [];
  }
}


const nodeTypes = {
  PARENT: 'parent',
  LEAF: 'leaf',
}

class Node {
  constructor(nodeType) {
    this._nodeType = nodeType;
  }
}


class ParentNode extends Node {
  constructor() {
    super(nodeTypes.PARENT);
    this._children = [];
  }

  get children() {
    return this._children;
  }

  add(node) {
    this.children.push(node);
  }
}


class LeafNode extends Node {
  constructor() {
    super(nodeTypes.LEAF);
    this._value = null;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
  }
}
