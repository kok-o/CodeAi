/**
 * Transpiles simple Python code to JavaScript for local execution
 */
function transpilePythonToJs(pythonCode) {
  const lines = pythonCode.split('\n');
  let jsCode = '';
  let indentStack = [0];

  const transpileExpression = (expr) => {
    let res = expr.trim();
    // Replace boolean values
    res = res.replace(/\bTrue\b/g, 'true');
    res = res.replace(/\bFalse\b/g, 'false');
    // Replace logical operators
    res = res.replace(/\band\b/g, ' && ');
    res = res.replace(/\bor\b/g, ' || ');
    res = res.replace(/\bnot\b/g, ' ! ');
    
    // Transpile f-strings: f"Hello {name}" -> `Hello ${name}`
    if (res.startsWith('f"') && res.endsWith('"')) {
      let content = res.substring(2, res.length - 1);
      content = content.replace(/\{([^}]+)\}/g, '${$1}');
      res = '`' + content + '`';
    } else if (res.startsWith("f'") && res.endsWith("'")) {
      let content = res.substring(2, res.length - 1);
      content = content.replace(/\{([^}]+)\}/g, '${$1}');
      res = '`' + content + '`';
    }
    
    return res;
  };

  for (let line of lines) {
    const trimmed = line.trim();
    
    // Handle empty lines or pure comments
    if (trimmed === '') {
      jsCode += '\n';
      continue;
    }
    if (trimmed.startsWith('#')) {
      jsCode += '// ' + trimmed.substring(1) + '\n';
      continue;
    }

    // Find current indentation level
    const indent = line.search(/\S/);

    // If indentation decreased, close the blocks
    while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsCode += '}\n';
    }

    let jsLine = trimmed;

    // 1. Function declaration: def func(arg):
    if (trimmed.startsWith('def ') && trimmed.endsWith(':')) {
      const match = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/);
      if (match) {
        const funcName = match[1];
        const args = match[2];
        jsLine = `function ${funcName}(${args}) {`;
        indentStack.push(indent + 4);
      } else {
        throw new SyntaxError("Invalid python function definition style.");
      }
    }
    // 2. For loop: for x in y:
    else if (trimmed.startsWith('for ') && trimmed.endsWith(':')) {
      const match = trimmed.match(/^for\s+(\w+)\s+in\s+([^:]+):/);
      if (match) {
        const item = match[1];
        const list = match[2];
        jsLine = `for (let ${item} of ${list}) {`;
        indentStack.push(indent + 4);
      } else {
        throw new SyntaxError("Invalid python for-loop syntax.");
      }
    }
    // 3. Conditional: if condition:
    else if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
      const cond = trimmed.substring(3, trimmed.length - 1);
      jsLine = `if (${transpileExpression(cond)}) {`;
      indentStack.push(indent + 4);
    }
    // 4. Elif: elif condition:
    else if (trimmed.startsWith('elif ') && trimmed.endsWith(':')) {
      const cond = trimmed.substring(5, trimmed.length - 1);
      jsLine = `else if (${transpileExpression(cond)}) {`;
      indentStack.push(indent + 4);
    }
    // 5. Else: else:
    else if (trimmed === 'else:') {
      jsLine = `else {`;
      indentStack.push(indent + 4);
    }
    // 6. Print statement: print(val)
    else if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
      const inner = trimmed.substring(6, trimmed.length - 1);
      jsLine = `console.log(${transpileExpression(inner)});`;
    }
    // 7. Pass statement
    else if (trimmed === 'pass') {
      jsLine = '';
    }
    // 8. Return statement
    else if (trimmed.startsWith('return ')) {
      const expr = trimmed.substring(7);
      jsLine = `return ${transpileExpression(expr)};`;
    }
    // 9. List append: list.append(val)
    else if (trimmed.includes('.append(')) {
      const parts = trimmed.split('.append(');
      const listName = parts[0].trim();
      const value = parts[1].slice(0, -1);
      jsLine = `${listName}.push(${transpileExpression(value)});`;
    }
    // 10. Local variable assignments
    else if (trimmed.includes(' = ')) {
      const parts = trimmed.split(' = ');
      const left = parts[0].trim();
      const right = parts.slice(1).join(' = ').trim();
      
      // If variable doesn't have let/const declaration in this transpile scope
      // We declare it as local let variable
      jsLine = `let ${left} = ${transpileExpression(right)};`;
    }
    // 11. Simple invocation at top-level
    else {
      jsLine = transpileExpression(trimmed) + ';';
    }

    jsCode += ' '.repeat(indent) + jsLine + '\n';
  }

  // Close any remaining blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    jsCode += '}\n';
  }

  return jsCode;
}

/**
 * Executes JS or Python code against a set of test cases
 * @param {string} code - The source code to run
 * @param {string} language - 'javascript' or 'python'
 * @param {Array} testCases - Array of test case objects
 */
export function runCode(code, language, testCases = []) {
  let logs = [];
  let executionError = null;
  let targetFunctions = {};
  let rawJs = '';

  // Intercept console.log
  const originalLog = console.log;
  const mockConsole = {
    log: (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg);
        }
        return String(arg);
      }).join(' ');
      logs.push(message);
    },
    error: (...args) => {
      const message = args.join(' ');
      logs.push('[ERROR] ' + message);
    }
  };

  try {
    if (language === 'python') {
      rawJs = transpilePythonToJs(code);
    } else {
      rawJs = code;
    }

    // Evaluate code inside an isolated function environment
    // We bind local variables and expose declared functions by returning them
    const functionExposeCode = `
      const console = arguments[0];
      ${rawJs}
      return {
        welcome_user: typeof welcome_user !== 'undefined' ? welcome_user : null,
        circle_area: typeof circle_area !== 'undefined' ? circle_area : null,
        get_evens: typeof get_evens !== 'undefined' ? get_evens : null,
        filterNumbers: typeof filterNumbers !== 'undefined' ? filterNumbers : null,
        formatUser: typeof formatUser !== 'undefined' ? formatUser : null,
        buildQueryString: typeof buildQueryString !== 'undefined' ? buildQueryString : null
      };
    `;

    const runner = new Function(functionExposeCode);
    targetFunctions = runner(mockConsole);

  } catch (err) {
    executionError = err.message || String(err);
    logs.push(`RuntimeError: ${executionError}`);
    return {
      success: false,
      logs,
      error: executionError,
      results: []
    };
  }

  // Run Test cases
  const results = [];
  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const func = targetFunctions[tc.functionName];

    if (!func) {
      allPassed = false;
      results.push({
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: null,
        error: `Function '${tc.functionName}' is not defined.`
      });
      continue;
    }

    // Setup stdout test case checks
    if (tc.type === 'stdout') {
      // Clear logs before calling
      const preLength = logs.length;
      try {
        func(...tc.input);
        const postLogs = logs.slice(preLength);
        const actualOutput = postLogs.join('\n').trim();
        const passed = actualOutput === String(tc.expected).trim();
        if (!passed) allPassed = false;

        results.push({
          passed,
          input: tc.input,
          expected: tc.expected,
          actual: actualOutput
        });
      } catch (err) {
        allPassed = false;
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: null,
          error: err.message
        });
      }
    } 
    // Setup return value checks
    else if (tc.type === 'return') {
      try {
        const actualValue = func(...tc.input);
        
        // Deep equality check for arrays or objects
        const passed = JSON.stringify(actualValue) === JSON.stringify(tc.expected);
        if (!passed) allPassed = false;

        results.push({
          passed,
          input: tc.input,
          expected: tc.expected,
          actual: actualValue
        });
      } catch (err) {
        allPassed = false;
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: null,
          error: err.message
        });
      }
    }
  }

  return {
    success: allPassed && results.length > 0,
    logs,
    error: null,
    results
  };
}
