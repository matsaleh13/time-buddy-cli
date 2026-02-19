
class AST {
  constructor() {
    this.nodes = [];
  }
}


const TYPES = {
  TimePoint: 'TimePoint',
  DatePart: 'DatePart',
  TimePart: 'TimePart',
  MergeDateAndTime: 'MergeDateAndTime',
  Duration: 'Duration',
  Number: 'Number',
  Exponent: 'Exponent',
  Multiply: 'Multiply',
  Divide: 'Divide',
  Add: 'Add',
  Subtract: 'Subtract',
}

class Node {
  constructor(nodeType) {
    this._nodeType = nodeType;
  }

  get nodeType() {
    return this._nodeType;
  }
}


class ParentNode extends Node {
  constructor() {
    super(TYPES.PARENT);
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
    super(TYPES.LEAF);
    this._value = null;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
  }
}
