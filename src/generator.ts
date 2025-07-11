
var newline, space;

const Syntax = {
  Statement: 'statement',
  Assignment: 'assignment',
  Operation: 'operation',
  Identifier: 'identifier',
  Boolean: 'boolean',
  Functioncall: 'functioncall',
  Integer: 'integer',
};

const MACROS_OVERRIDE = new Map([
  ['\\infty', 'inf'],

  ['\\cdot', '*'],
  ['\\times', '*'],
  ['\\ast', '*'],

  ['\\div', '/'],
  ['\\mod', '%'],
  ['\\pm', '+-'], // The sign ± dosn't work with Maxia.
]);

function convertMacro(str) {
  if (MACROS_OVERRIDE.has(str)) {
    return MACROS_OVERRIDE.get(str);
  }
  return str;
};

function getDefaultOptions() {
  // default options
  return {
    indent: null,
    base: null,
    parse: null,
    comment: false,
    format: {
      indent: {
        style: '    ',
        base: 0,
        adjustMultilineComment: false
      },
      newline: '\n',
      space: ' ',
    }
  }
}

function join(left, right) {

  if (left.length === 0) {
    return [right];
  }

  if (right.length === 0) {
    return [left];
  }

  return [left, space, right];
}


/**
 * flatten an array to a string, where the array can contain
 * either strings or nested arrays
 */
function flattenToString(arr) {
  var i, iz, elem, result = '';
  for (i = 0, iz = arr.length; i < iz; ++i) {
    elem = arr[i];
    result += Array.isArray(elem) ? flattenToString(elem) : elem;
  }
  return result;
}

function parenthesize(text) {
  return ['(', text, ')'];
}

class CodeGenerator {
  options: {};

  constructor(options = {}) {
    this.options = options;
  }
  generate(node) {
    //console.log("Type: " + typeof node + " " + node.type);
    return this[node.type](node);
  }

  root(node) {
    //console.log("root");
    var result = [];
    for (let i = 0; i < node.items.length; i++) {
      let item = this.generate(node.items[i]);
      result.push(item);
    }
    return result;
  }

  statement(node) {
    var result = [];
    //console.log("statement");
    result.push(this.generate(node.statement));
    for (let i = 0; i < node.flags.length; i++) {
      result.push(', ');
      result.push(this.generate(node.flags[i]));
    }
    return result;
  }

  operation(node) {
    //console.log("operation");
    return [
      this.generate(node.lhs),
      convertMacro(node.op),
      this.generate(node.rhs)
    ];
  }

  prefixop(node) {
    //console.log("prefix operation");
    return [
      convertMacro(node.op),
      this.generate(node.rhs)
    ];
  }

  postfixop(node) {
    //console.log("postfixop operation");
    return [
      this.generate(node.lhs),
      convertMacro(node.op)
    ];
  }

  group(node) {
    //console.log("group");
    var result = [];
    for (let i = 0; i < node.items.length; i++) {
      let item = this.generate(node.items[i]);
      result.push(item);
    }
    return parenthesize(result);
  }

  identifier(node) {
    //console.log("identifier");
    return node.value;
  }

  integer(node) {
    //console.log("integer");
    return node.value;
  }

  float(node) {
    //console.log("float");
    return node.value;
  }

  trigonometric(node) {
    var result;
    //console.log("trigonometric");
    result = [
      node.name,
      parenthesize(this.generate(node.argument))
    ];

    return result;
  }

  limit(node) {
    //console.log("limit");
    // TODO: handle + or - sided limits -> also in parser....
    // TODO rename from to something,,, identifyer etc..
    let content = [
      this.generate(node.value),
      ',',
      this.generate(node.from),
      ',',
      this.generate(node.to)
    ];
    return ['limit', parenthesize(content)];
  }

  integral(node) {
    //console.log("integral");
    let content = [
      this.generate(node.integrand),
      ',',
      this.generate(node.differential)
    ];
    if (node.definite === true) {
      content.push(',');
      content.push(this.generate(node.upperBound));
      content.push(',');
      content.push(this.generate(node.lowerBound));
    }
    return ['integrate', parenthesize(content)];
  }

  differential(node) {
    //console.log("differential");
    return node.variable;
  }

  assignment(node) {
    var result = [];
    //console.log("assignment");

    result.push(this.generate(node.lhs));
    if (node.lhs === Syntax.Functioncall) {
      result.push(':=');
    } else {
      result.push(':');
    }
    result.push(this.generate(node.rhs));

    return [
      this.generate(node.lhs),
      ':=',
      this.generate(node.rhs)
    ];

  }

  functioncall(node) {
    //console.log("functioncall");
    let content = [];
    for (let i = 0; i < node.arguments.length; i++) {
      let item = this.generate(node.arguments[i]);
      i > 0 ? content.push(',') : null;
      content.push(item);
    }
    return [this.generate(node.name), parenthesize(content)];
  }

  fraction(node) {
    console.log("fraction");
    let content = [
      this.generate(node.numerator),
      '/',
      this.generate(node.denominator)
    ];
    return [parenthesize(content)];
  }

  matrix(node) {
    //console.log("matrix");
    let content = [];

    let matrixRowSize = node.items[0].length;
    for (let i = 0; i < node.items.length; i++) {
      let row = node.items[i];
      if (row.length !== matrixRowSize) {
        throw new Error('All rows in matrix must be the same length');
      }
      content.push('[');
      for (let j = 0; j < row.length; j++) {
        content.push(this.generate(row[j]));
        if (j < row.length - 1) {
          content.push(',');
        }
      }
      content.push(']');
      if (i < node.items.length - 1) {
        content.push(',');
      }
    }
    return ['matrix', parenthesize(content)];
  }

  nthroot(node) {
    //console.log("nthroot");
    return ['nthroot', parenthesize(this.generate(node.argument))];
  }

  boolean(node) {
    //console.log("boolean");
    return node.value;
  }

  flag(node) {
    //console.log("flag");
    var result = [
      this.generate(node.name),
      node.value.type === Syntax.Boolean ? '=' : ':',
      this.generate(node.value)
    ];
    return result;
  }
}

export interface IGenerateOptions {
  parse?: any, // TODO
  comment?: boolean,
  format?: {
    indent?: {
      style?: string,
      base?: number,
      adjustMultilineComment?: boolean
    },
    newline?: string,
    space?: string,
  }
  [key: string]: any;
}

export type GenerateFunction = (input: string, options?: IGenerateOptions) => any;

export const generate: GenerateFunction = function generate(ast: Object, options?: IGenerateOptions) {
  //options = options !== undefined ? options : {};

  var defaultOptions = getDefaultOptions();
  if (options != null) {

  } else {
    options = defaultOptions;
  }

  newline = options.format.newline;
  space = options.format.space;

  let codegen = new CodeGenerator();
  let result = flattenToString(codegen.generate(ast));
  return result;
}
