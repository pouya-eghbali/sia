const SIA_TYPES = require("./types.js");

class SiaNode {}

class _Var extends SiaNode {
  constructor(name, value) {
    super();
    this.name = name;
    this.value = value;
  }
  compile(sia, context) {
    context.slots = context.slots || {};
    context.slotCount = context.slotCount || 0;
    if (this.value != undefined) {
      if (this.value instanceof SiaNode) {
        this.valueRef = this.value.compile(sia, context);
      } else {
        this.valueRef = sia.serializeItem(this.value);
      }
      context.slots[this.name] = this.valueRef;
    } else {
      this.valueRef = context.slots[this.name];
    }
    return this.valueRef;
  }
}

const Var = (name, value) => {
  return new _Var(name, value);
};

class _If extends SiaNode {
  constructor(condition, code) {
    super();
    this.condition = condition;
    this.code = code;
  }
  compile(sia, context) {
    const condRef = this.condition.compile(sia, context);
    // TODO add condition block index
    sia.writeUInt8(SIA_TYPES.if);
    sia.writeUIntAS(condRef);
    sia.addBlock();
    this.code.compile(sia, context);
  }
}

const If = (cond, code) => {
  return new _If(cond, code);
};

class _IsBigger extends SiaNode {
  constructor(lhs, rhs) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }
  compile(sia, context) {
    sia.writeUInt8(SIA_TYPES.false);
    this.valueRef = sia.addBlock(true);
    const lhsRef = this.lhs.compile(sia, context);
    const rhsRef = this.rhs.compile(sia, context);
    sia.writeUInt8(SIA_TYPES.is_bigger);
    sia.writeUIntAS(this.valueRef);
    sia.writeUIntAS(lhsRef);
    sia.writeUIntAS(rhsRef);
    sia.addBlock();
    return this.valueRef;
  }
}

const IsBigger = (lhs, rhs) => {
  return new _IsBigger(lhs, rhs);
};

class _Sin extends SiaNode {
  constructor(slot) {
    super();
    this.slot = slot;
  }
  compile(sia, context) {
    const slotRef = this.slot.compile(sia, context);
    this.valueRef = sia.addNumber(0, false);
    sia.writeUInt8(SIA_TYPES.sin);
    sia.writeUIntAS(this.valueRef);
    sia.writeUIntAS(slotRef);
    sia.addBlock();
    return this.valueRef;
  }
}

const Sin = (slot) => {
  return new _Sin(slot);
};

class _Mul extends SiaNode {
  constructor(lhs, rhs) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }
  compile(sia, context) {
    const lhsRef = this.lhs.compile(sia, context);
    const rhsRef = this.rhs.compile(sia, context);
    this.valueRef = sia.addNumber(0, false);
    sia.writeUInt8(SIA_TYPES.mul);
    sia.writeUIntAS(this.valueRef);
    sia.writeUIntAS(lhsRef);
    sia.writeUIntAS(rhsRef);
    sia.addBlock();
    return this.valueRef;
  }
}

const Mul = (lhs, rhs) => {
  return new _Mul(lhs, rhs);
};

class _Jump extends SiaNode {
  constructor(line) {
    super();
    this.line = line;
  }
  compile(sia, context) {
    const lineRef = this.line.compile(sia, context);
    sia.writeUInt8(SIA_TYPES.jump);
    sia.writeUIntAS(lineRef);
    sia.addBlock();
  }
}

const Jump = (line) => new _Jump(line);

class _Line extends SiaNode {
  constructor(name, line) {
    super();
    this.name = name;
    this.line = line;
  }
  compile(sia, context) {
    context.lines = context.lines || {};
    context.lineCount = context.lineCount || 0;
    if (this.line != undefined) {
      const lineRef = sia.addNumber(context.lineCount++, false);
      context.lines[this.name] = lineRef;
      this.line.compile(sia, context);
      return lineRef;
    }
    return context.lines[this.name];
  }
}

const Line = (name, line) => new _Line(name, line);

class _Exit extends SiaNode {
  compile(sia, context) {
    sia.writeUInt8(SIA_TYPES.exit);
    sia.addBlock();
  }
}

const Exit = (n) => new _Exit(n);

class _AddTo extends SiaNode {
  constructor(lhs, rhs) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }
  compile(sia, context) {
    const lhsRef = this.lhs.compile(sia, context);
    const rhsRef = this.rhs.compile(sia, context);
    sia.writeUInt8(SIA_TYPES.add_to);
    sia.writeUIntAS(lhsRef);
    sia.writeUIntAS(rhsRef);
    sia.addBlock();
  }
}

const AddTo = (...args) => new _AddTo(...args);

class _Push extends SiaNode {
  constructor(slot) {
    super();
    this.slot = slot;
  }
  compile(sia, context) {
    const ref = this.slot.compile(sia, context);
    sia.writeUInt8(SIA_TYPES.arr_push);
    sia.writeUIntAS(ref);
    sia.addBlock();
  }
}

const Push = (slot) => new _Push(slot);

class _SiaArray extends SiaNode {
  constructor(...items) {
    super();
    this.items = items;
  }
  compile(sia, context) {
    sia.writeUInt8(SIA_TYPES.arr_start);
    sia.writeUIntAS(0);
    for (const item of this.items) item.compile(sia, context);
    sia.writeUInt8(SIA_TYPES.arr_end);
    sia.addBlock();
  }
}

const SiaArray = (...args) => new _SiaArray(...args);

class _Program extends SiaNode {
  constructor(...items) {
    super();
    this.items = items;
  }
  compile(sia, context) {
    sia.writeUInt8(SIA_TYPES.program_start);
    for (const item of this.items) item.compile(sia, context);
    sia.writeUInt8(SIA_TYPES.program_end);
    sia.addBlock();
  }
}

const Program = (...args) => new _Program(...args);

const asm = SiaArray(
  Program(
    Var("curr", 0),
    Var("step", 3),
    Var("end", 100),
    Line("start", AddTo(Var("curr"), Var("step"))),
    If(IsBigger(Var("curr"), Var("end")), Exit()),
    Var("sin", Sin(Var("curr"))),
    Var("mul", Mul(Var("curr"), Var("sin"))),
    Push(Var("mul")),
    Jump(Line("start"))
  )
);

module.exports = {
  Program,
  SiaArray,
  Var,
  AddTo,
  If,
  IsBigger,
  Exit,
  Jump,
  Line,
  Push,
  Sin,
  Mul,
  asm,
};

// AddTo should be alias for Add -> Put

/* Functions:

1. bit manipulation (<<, >>, OR, AND, XOR)
2. basic math (+, -, *, /)
3. extra math (log, pow, sqrt, sin?, cos?, tan?, atan?, floor?, abs?)
4. comparison (>, >=, ==, <, <=)
5. logical (and, or, not)
6. assignment (set)
*/

/* r_shift
l_shift
bit_or
bit_and
xor
add
sub
div
mul
---
abs
acos
acosh
asin
asinh
atan
atan2
atanh
ceil
cos
cosh
exp
floor
log
log2
log10
max
min
pow
sign
sin
sinh
sqrt
tan
tanh
--
gt
gte
ee
lt
lte
and
or
not
put */
