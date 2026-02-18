
// Mock OPS
const OPS = {
    '+': { precedence: 1, assoc: 'Left' },
    '-': { precedence: 1, assoc: 'Left' },
    '×': { precedence: 2, assoc: 'Left' },
    '÷': { precedence: 2, assoc: 'Left' }
};

// Paste logic modules here for testing (would import in real env, but single file constraint)
const Tokenizer = {
    tokenize(expr) {
        const tokens = [];
        let buffer = '';
        const sanitized = expr.replace(/\s+/g, '');
        for (let i = 0; i < sanitized.length; i++) {
            const char = sanitized[i];
            if (OPS[char]) {
                if (buffer.length > 0) {
                    tokens.push(buffer);
                    buffer = '';
                } else if (char === '-' && (tokens.length === 0 || OPS[tokens[tokens.length - 1]])) {
                    buffer += char;
                    continue;
                }
                tokens.push(char);
            } else {
                buffer += char;
            }
        }
        if (buffer.length > 0) tokens.push(buffer);
        return tokens;
    }
};

const ShuntingYard = {
    toRPN(tokens) {
        const outputQueue = [];
        const operatorStack = [];
        for (const token of tokens) {
            const num = parseFloat(token);
            if (!isNaN(num)) {
                outputQueue.push(num);
            } else if (OPS[token]) {
                const o1 = token;
                let o2 = operatorStack[operatorStack.length - 1];
                while (
                    o2 && OPS[o2] &&
                    ((OPS[o1].assoc === 'Left' && OPS[o1].precedence <= OPS[o2].precedence) ||
                        (OPS[o1].assoc === 'Right' && OPS[o1].precedence < OPS[o2].precedence))
                ) {
                    outputQueue.push(operatorStack.pop());
                    o2 = operatorStack[operatorStack.length - 1];
                }
                operatorStack.push(o1);
            }
        }
        while (operatorStack.length > 0) outputQueue.push(operatorStack.pop());
        return outputQueue;
    }
};

const Evaluator = {
    evaluate(rpnQueue) {
        const stack = [];
        for (const token of rpnQueue) {
            if (typeof token === 'number') {
                stack.push(token);
            } else if (OPS[token]) {
                if (stack.length < 2) throw new Error("Invalid Expression");
                const b = stack.pop();
                const a = stack.pop();
                let result = 0;
                switch (token) {
                    case '+': result = a + b; break;
                    case '-': result = a - b; break;
                    case '×': result = a * b; break;
                    case '÷':
                        if (b === 0) throw new Error("Division by zero");
                        result = a / b;
                        break;
                }
                result = Math.round(result * 1000000000) / 1000000000;
                stack.push(result);
            }
        }
        if (stack.length !== 1) throw new Error("Invalid Expression");
        return stack[0];
    },
    calculate(expression) {
        try {
            const tokens = Tokenizer.tokenize(expression);
            const rpn = ShuntingYard.toRPN(tokens);
            return this.evaluate(rpn);
        } catch (e) {
            return e.message;
        }
    }
};

// Tests
const verify = (expr, expected) => {
    const result = Evaluator.calculate(expr);
    if (result === expected) {
        console.log(`PASS: ${expr} = ${result}`);
    } else {
        console.error(`FAIL: ${expr} = ${result} (Expected: ${expected})`);
    }
};

console.log("Running Calculator Logic Tests...");
verify("2+2", 4);
verify("10 ÷ 2", 5);
verify("2 + 3 × 4", 14); // Precedence
verify("(2+3)×4", "Invalid Expression"); // Parentheses not supported intentionally by UI but logic handles them? No, OPS missing parens.
verify("5 + 5 × 2", 15);
verify("10 - 2 × 3", 4);
verify("8 ÷ 0", "Division by zero");
verify("-5 + 3", -2); // Unary minus
verify("2 + -3", -1);
verify("0.1 + 0.2", 0.3); // Floating point
