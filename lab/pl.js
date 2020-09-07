class _Slot {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
  toByteCodeWithContext(context) {
    context.slots = context.slots || {};
    if (this.value != undefined) {
      context.slots[this.name] = ++context.offset;
      return `<V_${this.value}>`;
    }
    for (const [name, lineRef] of Object.entries(context.slots))
      if (name === this.name) return `<B_${lineRef}>`;
  }
}

const Slot = (name, value) => {
  return new _Slot(name, value);
};

class _If {
  constructor(condition, code) {
    this.condition = condition;
    this.code = code;
  }
  toByteCodeWithContext(context) {
    const cond = this.condition.toByteCodeWithContext(context);
    return (
      cond +
      "<IF>" +
      `<B_${context.offset++}>` +
      this.code.toByteCodeWithContext(context)
    );
  }
}

const If = (cond, code) => {
  return new _If(cond, code);
};

class _IsBigger {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }
  toByteCodeWithContext(context) {
    context.offset++;
    return (
      "<IS_BIGGER>" +
      this.lhs.toByteCodeWithContext(context) +
      this.rhs.toByteCodeWithContext(context)
    );
  }
}

const IsBigger = (lhs, rhs) => {
  return new _IsBigger(lhs, rhs);
};

class _Jump {
  constructor(line) {
    this.line = line;
  }
  toByteCodeWithContext(context) {
    context.offset++;
    return "<JMP>" + this.line.toByteCodeWithContext(context);
  }
}

const Jump = (line) => new _Jump(line);

class _Line {
  constructor(n) {
    this.n = n;
  }
  toByteCodeWithContext(context) {
    return this.n == "last" ? "<LAST>" : `<B_${this.n + context.offset}>`;
  }
}

const Line = (n) => new _Line(n);

class _Exit {
  toByteCodeWithContext(context) {
    context.offset++;
    return "<EXIT>";
  }
}

const Exit = (n) => new _Exit(n);

class _AddTo {
  constructor(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }
  toByteCodeWithContext(context) {
    context.offset++;
    return (
      "<ADD_TO>" +
      this.lhs.toByteCodeWithContext(context) +
      this.rhs.toByteCodeWithContext(context)
    );
  }
}

const AddTo = (...args) => new _AddTo(...args);

class _Push {
  constructor(slot) {
    this.slot = slot;
  }
  toByteCodeWithContext(context) {
    context.offset++;
    return "<PUSH>" + this.slot.toByteCodeWithContext(context);
  }
}

const Push = (slot) => new _Push(slot);

class _SiaArray {
  constructor(...items) {
    this.items = items;
  }
  toByteCodeWithContext(context) {
    context.offset++;
    const start = "<START_ARR>";
    const end = "<END_ARR>";
    const inner = this.items
      .map((item, i) => item.toByteCodeWithContext(context))
      .join("");
    context.offset++;
    return start + inner + end;
  }
}

const SiaArray = (...args) => new _SiaArray(...args);

const value = SiaArray(
  Slot("curr", 0),
  Slot("step", 3),
  Slot("end", 100),
  If(IsBigger(Slot("curr"), Slot("end")), Exit()),
  AddTo(Slot("curr"), Slot("step")),
  Push(Slot("curr"))
);

console.log(value.toByteCodeWithContext({ offset: 22 }));
