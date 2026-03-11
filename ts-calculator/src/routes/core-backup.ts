export let expr: string = "0";
  export let exprNums: number[] = [];
  export let exprOperators: string[] = [];
  export let exprLength: number = 0;
  export let exprLegacy: string = "";
  export let unclosedBrackets: number = 0;

  const date = new Date();
  const year: number = date.getFullYear();
  const month: number = date.getMonth()+1;
  const day: number = date.getDate();

  let display: HTMLElement | null = null;
  let displayLegacyNum: HTMLElement | null = null;
  let displayNum: HTMLElement | null = null;
  let unclosedBracketsCounter: HTMLElement | null = null;

  onMount(() => {
    display = document.getElementById("display")!;
    displayLegacyNum = document.getElementById("expr-legacy")!;
    displayNum = document.getElementById("expr")!;
    unclosedBracketsCounter = document.getElementById("unclosed-brackets")!;

    document.getElementsByClassName("numpad")[0].addEventListener("click", (e) => {
        const target = e.target as HTMLElement
        if (target.className === "btn") {
            processInput(target.dataset.type!, target.dataset.value!);
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.code.startsWith("Digit") && !e.shiftKey) {
            const num = e.code.replace("Digit", "");
            processInput("num", num);
        }
        if (e.code.startsWith("Numpad") && e.getModifierState("NumLock")) {
            const num = e.code.replace("Numpad", "");
            processInput("num", num);
        }
        if (e.code.startsWith("Arrow")) {
            // ?
        }
        if (e.code.startsWith("Backspace")) {
            processInput("ctrl", "backspace");
        }
        const symbols = ["+", "-", "*", "/", "=", ".", ",",
                        "(", ")", "{", "}", "[", "]", "^",
                        ];
        if (symbols.includes(e.key)) {
            if (e.key == "=") 
                calculate();
            else
                processInput("sym", e.key);
        }
    });
  });


  function processInput(type: string, value: string) {
      updateExpr();
      switch(type) {
          case "num":
              if (expr != "0")
                  expr += value;
              else if (expr == "0")
                  expr = value;
              break;
          case "sym":
              if (value === ".") {
                  if (/[\.,]/.test(exprNums[exprNums.length-1].toString()))
                      break;
                  else if(/^[+\-\*\/×÷\%]$/.test(expr[exprLength-1]))
                      break;
                  else
                      expr += value;
              }
              else if (value === "(" || value === ")") {
                  if (value == "(") {
                      if (expr == "0") expr = value;
                      else expr += value;
                      unclosedBrackets++;
                  }
                  else if (value == ")") {
                      if (!/\(/.test(expr)) {
                          break;
                      }
                      else {
                          const leftBracketCount = expr.match(/\(/g) ? expr.match(/\(/g)!.length : 0;
                          const rightBracketCount = expr.match(/\)/g) ? expr.match(/\)/g)!.length : 0;
                          if (leftBracketCount > rightBracketCount) {
                              expr += value;
                              unclosedBrackets--;
                          }
                      }
                  }
              }
              else {
                  if(exprNums[exprNums.length-1].toString() === "" && /^[+\-\*\/×÷\%]$/.test(expr[exprLength-1]))
                      break;
                  else
                      expr += value;
              }
              break;
          case "ctrl":
              switch(value) {
                  case "c":
                      expr = "0";
                      break;
                  case "ce":
                      expr = "0";
                      break;
                  case "backspace":
                      if (exprLength > 1)
                          expr = expr.slice(0, -1);
                      else if (/^[1-9]/.test(expr))
                          expr = "0";
                      break;
                  default:
                      break;
              }
              break;
          case "eql":
              calculate();
              break;
          default:
              break;
      }

      expr = expr.replace(/\s+/g, '');

      if (displayNum) displayNum.innerHTML = formatExprForDisplay(expr);
      if (unclosedBracketsCounter) unclosedBracketsCounter.innerText = unclosedBrackets.toString();
  }

  function calculate() {
      let result: number = 0;

      if (expr === "0÷0" || expr == "0/0") {
          expr = "0";
          if (displayNum) displayNum.innerHTML = "ERROR";
          return;
      }

      let superstack: string[] = [];
      let postfix: string[] = [];
      let superExpr: string[] = [exprNums[0].toString()];
      for(let [idx, operator] of exprOperators.entries()) {
          superExpr.push(operator);
          superExpr.push(exprNums[idx + 1].toString());
      }

      let lettre: string = "";
      for(lettre of superExpr) {
          switch(lettre) {
              case "(":
                  superstack.push(lettre);
                  break;
              case ")":
                  break;
              default:
                  if (/^[+\-\*\/×÷\%]$/.test(lettre)) {
                      if (superstack.length === 0) {
                          superstack.push(lettre);
                      }
                      else {
                          if (/^[+\-]$/.test(lettre)) {
                              if (/^[\*\/×÷\%]$/.test(superstack[superstack.length-1])) {
                                  postfix.push(superstack.pop()!);
                              }
                              superstack.push(lettre);
                          }
                          else if (/^[\*\/×÷\%]$/.test(lettre)) {
                              superstack.push(lettre);
                          }
                      }
                  }
                  else {
                      postfix.push(lettre);
                  }
                  break;
          }
      }

      for (let i = superstack.length; i > 0; i--) {
          postfix.push(superstack.pop()!);
      }

      superstack = [];

      let temp: number = 0;
      for (let lettre of postfix) {
          if (/^[+\-\*\/×÷\%]$/.test(lettre) && superstack.length >= 2) {
              switch(lettre) {
                  case "+":
                      temp = parseFloat(superstack[superstack.length-1]) + parseFloat(superstack[superstack.length-2]);
                      superstack.splice(-2, 2);
                      superstack.push(temp.toString());
                      break;
                  case "-":
                      temp = parseFloat(superstack[superstack.length-2]) - parseFloat(superstack[superstack.length-1]);
                      superstack.splice(-2, 2);
                      superstack.push(temp.toString());
                      break;
                  case "*": case "×":
                      temp = parseFloat(superstack[superstack.length-1]) * parseFloat(superstack[superstack.length-2]);
                      superstack.splice(-2, 2);
                      superstack.push(temp.toString());
                      break;
                  case "/": case "÷":
                      temp = parseFloat(superstack[superstack.length-1]) / parseFloat(superstack[superstack.length-2]);
                      superstack.splice(-2, 2);
                      superstack.push(temp.toString());
                      break;	
                  case "%":
                      //result += parseFloat(exprNums[idx]) % parseFloat(exprNums[idx+1]);
                      break;
                  default:
                      break;
              }
          }
          else if (!isNaN(parseFloat(lettre))) {
              superstack.push(lettre);
          }
      }

      result = parseFloat(superstack.join(""));
      expr = result.toString();
  }

  function updateExpr() {
      if (expr[0] == "-") {
          const temp = expr.slice(1);

          exprNums = temp.split(/[+\-\*\/×÷\%]/g).map(parseFloat);
          exprOperators = temp.match(/[+\-\*\/×÷\%]/g) ?? [];

          exprNums[0] = parseFloat("-" + exprNums[0].toString());
      }
      else {
          exprNums = expr.split(/[+\-\*\/×÷\%]/g).map(parseFloat);
          exprOperators = expr.match(/[+\-\*\/×÷\%]/g) ?? [];
      }
      exprLength = Array.from(expr).length;
  }


  function formatExprForDisplay(str: string) {
      return str
          .replace(/[*]/g, "×")
          .replace(/[/]/g, "÷")
          .replace(/[－–—]/g, "-")
          .replace(/[＋]/g, "+");
  }
