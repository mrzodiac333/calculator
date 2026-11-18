const display = document.getElementById("display");
const history = document.getElementById("history");
const keypad = document.querySelector(".keypad");

const operations = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "*": (a, b) => a * b,
  "/": (a, b) => (b === 0 ? null : a / b),
};

const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

let current = "0";
let previous = null;
let operator = null;
let overwrite = true;
let error = false;
let lastOperator = null;
let lastOperand = null;

function normalize(value) {
  if (!Number.isFinite(value)) return null;
  return Number.parseFloat(value.toPrecision(12));
}

function format(value) {
  return String(value);
}

function render() {
  display.textContent = error ? "Error" : current;
  history.textContent =
    previous !== null && operator ? `${format(previous)} ${symbols[operator]}` : "\u00a0";
}

function clearAll() {
  current = "0";
  previous = null;
  operator = null;
  overwrite = true;
  error = false;
  lastOperator = null;
  lastOperand = null;
  render();
}

function setError() {
  error = true;
  previous = null;
  operator = null;
  overwrite = true;
  render();
}

function resetRepeat() {
  lastOperator = null;
  lastOperand = null;
}

function inputDigit(digit) {
  if (error) clearAll();
  resetRepeat();
  if (overwrite) {
    current = digit;
    overwrite = false;
  } else if (current === "0") {
    current = digit;
  } else if (current.replace(/[-.]/g, "").length < 12) {
    current += digit;
  }
  render();
}

function inputDecimal() {
  if (error) clearAll();
  resetRepeat();
  if (overwrite) {
    current = "0.";
    overwrite = false;
  } else if (!current.includes(".")) {
    current += ".";
  }
  render();
}

function chooseOperator(nextOperator) {
  if (error) return;
  resetRepeat();

  if (operator !== null && !overwrite) {
    const result = operations[operator](previous, Number(current));
    if (result === null) {
      setError();
      return;
    }
    previous = normalize(result);
    current = format(previous);
  } else if (previous === null) {
    previous = Number(current);
  }

  operator = nextOperator;
  overwrite = true;
  render();
}

function equals() {
  if (error) return;

  if (operator === null) {
    if (lastOperator !== null && lastOperand !== null) {
      const result = operations[lastOperator](Number(current), lastOperand);
      if (result === null) {
        setError();
        return;
      }
      history.textContent = `${format(current)} ${symbols[lastOperator]} ${format(lastOperand)} =`;
      current = format(normalize(result));
      overwrite = true;
      display.textContent = current;
      return;
    }
    overwrite = true;
    return;
  }

  const operand = overwrite ? previous : Number(current);
  const result = operations[operator](previous, operand);
  if (result === null) {
    setError();
    return;
  }

  history.textContent = `${format(previous)} ${symbols[operator]} ${format(operand)} =`;
  current = format(normalize(result));
  lastOperator = operator;
  lastOperand = operand;
  previous = null;
  operator = null;
  overwrite = true;
  display.textContent = current;
}

function percent() {
  if (error) return;
  resetRepeat();
  const value = normalize(Number(current) / 100);
  if (value === null) {
    setError();
    return;
  }
  current = format(value);
  overwrite = false;
  render();
}

function toggleSign() {
  if (error) return;
  resetRepeat();
  if (Number(current) === 0) return;
  current = current.startsWith("-") ? current.slice(1) : `-${current}`;
  render();
}

function backspace() {
  if (error) {
    clearAll();
    return;
  }
  if (overwrite) return;
  current = current.length > 1 ? current.slice(0, -1) : "0";
  if (current === "-" || current === "") {
    current = "0";
    overwrite = true;
  }
  render();
}

function handleAction(action, value) {
  switch (action) {
    case "digit":
      inputDigit(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "operator":
      chooseOperator(value);
      break;
    case "equals":
      equals();
      break;
    case "clear":
      clearAll();
      break;
    case "sign":
      toggleSign();
      break;
    case "percent":
      percent();
      break;
  }
}

keypad.addEventListener("click", (event) => {
  const key = event.target.closest(".key");
  if (!key) return;
  handleAction(key.dataset.action, key.dataset.value);
});

function pressKey(selector) {
  const key = document.querySelector(selector);
  if (!key) return;
  key.classList.add("pressed");
  setTimeout(() => key.classList.remove("pressed"), 100);
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    inputDigit(key);
    pressKey(`[data-action="digit"][data-value="${key}"]`);
  } else if (key === ".") {
    inputDecimal();
    pressKey('[data-action="decimal"]');
  } else if (key === "+" || key === "-" || key === "*" || key === "/") {
    chooseOperator(key);
    pressKey(`[data-action="operator"][data-value="${key}"]`);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    equals();
    pressKey('[data-action="equals"]');
  } else if (key === "Escape" || key.toLowerCase() === "c") {
    clearAll();
    pressKey('[data-action="clear"]');
  } else if (key === "%") {
    percent();
    pressKey('[data-action="percent"]');
  } else if (key === "Backspace") {
    event.preventDefault();
    backspace();
  }
});

render();
