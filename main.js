const OPS = {
  '+': { precedence: 1, assoc: 'Left' },
  '-': { precedence: 1, assoc: 'Left' },
  '×': { precedence: 2, assoc: 'Left' },
  '÷': { precedence: 2, assoc: 'Left' }
};
const DEBOUNCE_DELAY = 150;
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
                // Handle negative numbers (unary minus) at start or after operator
                buffer += char;
                continue;
            }
            tokens.push(char);
        } else {
            buffer += char;
        }
    }
    if (buffer.length > 0) {
        tokens.push(buffer);
    }
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
                o2 &&
                OPS[o2] &&
                ((OPS[o1].assoc === 'Left' && OPS[o1].precedence <= OPS[o2].precedence) ||
                 (OPS[o1].assoc === 'Right' && OPS[o1].precedence < OPS[o2].precedence))
            ) {
                outputQueue.push(operatorStack.pop());
                o2 = operatorStack[operatorStack.length - 1];
            }
            operatorStack.push(o1);
        }
    }
    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }
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
            switch(token) {
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
        if (tokens.length === 0) return '';
        const rpn = ShuntingYard.toRPN(tokens);
        const result = this.evaluate(rpn);
        return result;
    } catch (e) {
        if (e.message === "Division by zero") return "Error: Div by 0";
        throw e;
    }
  }
};
class CalculatorApp {
    constructor() {
        this.expression = '';
        this.result = '0';
        this.expressionEl = document.querySelector('.expression-line');
        this.resultEl = document.querySelector('.result-line');
        this.keys = document.querySelectorAll('.keypad button');
        this.previewTimer = null;
        this.init();
    }
    init() {
        this.keys.forEach(key => {
            key.addEventListener('click', () => this.handleInput(key));
        });
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        this.updateDisplay();
    }
    handleInput(element) {
        const action = element.dataset.action;
        const value = element.dataset.value;
        this.animateButton(element);
        if (!action) {
            this.appendNumber(value);
        } else if (action === 'operator') {
            this.appendOperator(value);
        } else if (action === 'decimal') {
            this.appendDecimal();
        } else if (action === 'clear') {
            this.clearEntry();
        } else if (action === 'all-clear') {
            this.allClear();
        } else if (action === 'backspace') {
            this.backspace();
        } else if (action === 'calculate') {
            this.finalizeCalculation();
        }
    }
    handleKeyboard(e) {
        const key = e.key;
        
        // Map keys to actions
        if (key >= '0' && key <= '9') this.appendNumber(key);
        if (key === '.') this.appendDecimal();
        if (key === '+' || key === '-') this.appendOperator(key);
        if (key === '*' || key.toLowerCase() === 'x') this.appendOperator('×');
        if (key === '/') this.appendOperator('÷');
        if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.finalizeCalculation();
        }
        if (key === 'Backspace') this.backspace();
        if (key === 'Escape') this.allClear();
        if (key === 'Delete') this.clearEntry();
    }

    animateButton(element) {
        // Remove focus from button after click to prevent lingering focus styles on mouse users
        // checking if it was a mouse click vs keyboard navigation is tricky, 
        // strictly focused management is better handled via CSS :focus-visible
        // But we can add a quick active class for JS animations if desire
    }

    appendNumber(number) {
        if (this.expression === '0' || this.result === 'Error: Div by 0') {
            this.expression = number;
        } else {
             // Prevent entering numbers after calculation is finalized IF we want to reset. 
             // But requirement says "Chained operations: Allow continued calculations".
             // We'll treat numbers as starting new if previous op was '=', 
             // BUT we can't easily track that without a 'justCalculated' flag.
             // We'll reset explicitly if the last action was evaluate.
             
             // Simplest Approach: Just append. user can press AC if they want new.
             this.expression += number;
        }
        this.triggerPreview();
        this.updateDisplay();
    }
    
    appendOperator(operator) {
        if (this.result === 'Error: Div by 0') this.allClear();
        
        const lastChar = this.expression.slice(-1);
        if (OPS[lastChar]) {
            // Replace operator if consecutive
            this.expression = this.expression.slice(0, -1) + operator;
        } else {
            this.expression += operator;
        }
        this.updateDisplay();
    }
    
    appendDecimal() {
        // Prevent multiple decimals in current number segment
        // Tokenize vaguely to check last number
        const parts = this.expression.split(/[\+\-\×\÷]/);
        const lastNum = parts[parts.length - 1];
        
        if (!lastNum.includes('.')) {
            this.expression += '.';
            this.updateDisplay();
        }
    }
    
    clearEntry() {
        // Requirement: Clears current entry (last number)
        // Implementation: Remove digits until operator
        // This is complex for simple strings. Simplification: acts like Backspace for now? 
        // Or remove the whole last Token.
        // Let's implement: Remove last token.
        
        const tokens = Tokenizer.tokenize(this.expression);
        if(tokens.length > 0) {
            tokens.pop();
            this.expression = tokens.join('');
            if (this.expression === '') this.expression = ''; // Empty
            this.triggerPreview();
            this.updateDisplay();
        }
    }
    
    allClear() {
        this.expression = '';
        this.result = '0';
        this.updateDisplay();
    }
    
    backspace() {
        if (this.expression.length > 0) {
            this.expression = this.expression.slice(0, -1);
            if (this.expression === '') {
                 this.result = '0';
            } else {
                this.triggerPreview();
            }
            this.updateDisplay();
        }
    }
    
    triggerPreview() {
        if (this.previewTimer) clearTimeout(this.previewTimer);
        
        this.previewTimer = setTimeout(() => {
            // Only preview if expression ends with a digit? Or always?
            // "12 +" -> preview remains last valid OR blank.
            // Try to evaluate. If error, keep old result or blank.
            
            try {
                // Remove trailing operators for preview evaluation
                let tempExpr = this.expression;
                if (OPS[tempExpr.slice(-1)]) {
                    tempExpr = tempExpr.slice(0, -1);
                }
                
                if (tempExpr) {
                    const res = Evaluator.calculate(tempExpr);
                    if (res !== undefined && !isNaN(res)) {
                        this.result = res.toString();
                        this.updateDisplay(true); // isPreview
                    }
                }
            } catch (e) {
                // Ignore errors during preview
            }
        }, DEBOUNCE_DELAY);
    }
    
    finalizeCalculation() {
        try {
            const res = Evaluator.calculate(this.expression);
            this.result = res.toString();
            // Update expression to be the result? Or keep "eq = res" style?
            // Requirement: "Real-time result preview" vs "Final evaluation".
            // Typically calculators replace expression with result OR move expression up.
            // Let's replace expression with result to allow chaining.
            
            // However, UI shows: Top Line (Expression), Bottom Line (Result).
            // "5+5=" -> Top: "5+5=", Bottom: "10"
            // Then typing next?
            // Let's set Expression = Result so user can chain.
            
            this.expression = res.toString(); 
            this.updateDisplay();
            
        } catch (e) {
            this.result = "Error";
            this.updateDisplay();
        }
    }
    
    updateDisplay(isPreview = false) {
        this.expressionEl.textContent = this.expression;
        this.resultEl.textContent = this.result;
        
        if (isPreview) {
            this.resultEl.style.color = 'var(--display-text-secondary)'; 
        } else {
            this.resultEl.style.color = 'var(--display-text-primary)';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new CalculatorApp();
});
