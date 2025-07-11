# maxima-codegen

> Maxima code generator from [latex-math-parser](https://github.com/andstor/latex-math-parser) AST.


This code generator takes LaTeX math expressions and converts them into Maxima syntax through an abstract syntax tree (AST) representation. It works with [@andstor/latex-math-parser](https://github.com/andstor/latex-math-parser) to provide seamless conversion from LaTeX to Maxima code.

Maxima is a computer algebra system (CAS) that can manipulate symbolic and numerical expressions.


## Installation
```bash
npm install @andstor/maxima-codegen
```

To create the AST, you will also need to install the LaTeX math parser:
```bash
npm install @andstor/latex-math-parser
```

## Usage

```js
const { parse } = require('@andstor/latex-math-parser');
const { generate } = require('@andstor/maxima-codegen');

const latex = '\\frac{a}{b} + \\sqrt{x}';
const ast = parse(latex);
const maximaCode = generate(ast);

console.log(maximaCode); // Output: a/b + sqrt(x)
```
