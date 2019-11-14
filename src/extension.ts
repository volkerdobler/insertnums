/* 
The extension "InsertNums" is an adoption of a wonderful plugin for
Sublimecode from James Brooks.
https://github.com/jbrooksuk/InsertNums

All errors are in my own responsibility and are solley done by
myself.

If you want to contact me, send an E-Mail to 
insertnums.extension@volker-dobler.de

Volker Dobler
November 2019
 */



// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import * as d3 from 'd3-format';

var d3 = require('d3-format');

var sprintf = require('sprintf-js').sprintf;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "insertnums" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.insertNums', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
    // vscode.window.showInformationMessage("Hello World");
		InsertNumsCommand();
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function intOrFloat(value: any): number {
  return Number.isInteger(value) ? parseInt(value) : parseFloat(value);
}

function numToAlpha(num : number, len : number = 0) : string {
  let res: string = "";
  
  if (len > 0) {
    num = (num - 1) % Math.pow(26, len) + 1;
  }
  
  while (num > 0) {
    --num;
    res = String.fromCharCode(97 + (num % 26)) + res;
    num = Math.floor(num/26);
  }
  
  return res;
}

function alphaToNum(alpha: string) : number {
  
  let res: number = 0;
  
  for (let i = 0; i < alpha.length; i++) {
    res *= 26;
    res += alpha.charCodeAt(i) - 96;
  }
  
  return res;
}

function formatString(format: object, text: string) : string {
  // To-Do (String formatieren)
  let str: string = text;
  
//@ts-ignore
  let padding = (format.padding !== undefined) ? format.padding : " ";
//@ts-ignore
  let align = (format.align !== undefined) ? format.align : "<";
//@ts-ignore
  let lenStr = (format.integer !== undefined) ? format.integer : 0;
  
  while (str.length < lenStr) {
    if (align === "<") { str += padding; }
    if (align === ">") { str = padding + str; }
    if (align === "^") { 
      if (str.length % 2 === 0) {
        str = padding + str + padding; 
      } else {
        str += padding;
      }
    }
  }
  
  return lenStr === 0 ? text : str.substr(0,lenStr);
  
}

function getRegexps() {
  let ruleTemplate = {
    integer: "[1-9]\\d* | 0",
    signedint: "[+-]? {integer}",
    pointfloat: "({integer})? \\. \\d+ | {integer} \\.",
    exponentfloat: "(?:{integer} | {pointfloat}) [eE] [+-]? \\d+",
    float: "{pointfloat} | {exponentfloat}",
    numeric: "{integer} | {float}",
    signednum: "[+-]? {numeric}",
    format: "((?<format_padding> [^}}])?(?<format_align> [<>=^]))?(?<format_sign> [-+ ])?\#?(?<format_filled> 0)?(?<format_integer> {integer})?(\\.(?<format_precision> \\d+))?(?<format_type> [bcdeEfFgGnoxX%])?",
    alphastart: "[a-z]+ | [A-Z]+",
    alphaformat: "((?<alphaformat_padding>[^}}])?(?<alphaformat_align>[<>^]))?((?<alphaformat_integer>{integer}))?",
    cast: "[ifsb]",
    expr: ".+?",
    stopexpr: ".+?",
    exprmode: "^(?<cast> {cast})?\\|(~ (?<format> {format}) ::)? (?<expr> {expr}) (@(?<stopexpr> {stopexpr}))?(?<reverse> !)?$",
    insertnum: "^(?<start> {signednum})? (:(?<step> {signednum}))? (~(?<format> {format}))?(::(?<expr> {expr}))? (@ (?<stopexpr> {stopexpr}) )? (?<reverse> !)? $",
    insertalpha: "^(?<start> {alphastart})(: (?<step> {signedint}) )? (~ (?<format> {alphaformat})(?<wrap> w)?)?(@(?<stopexpr> {stopexpr}) )?(?<reverse> !)?$"
  };
  
  let result = {
    exprmode: "",
    insertnum: "",
    insertalpha: ""
  };
  
  for ( let [key,value] of Object.entries(ruleTemplate) ) {
    while (value.indexOf("{") > -1) {
      let start:number = value.indexOf("{");
      let ende:number = value.indexOf("}",start+1)+1;
      let replace:string = value.slice(start,ende);
      let rule:string = replace.slice(1,replace.length-1);
      value = value.replace(replace,(ruleTemplate as any)[rule]);
    }
    (result as any)[key] = value.replace(/\s/gi,"");
  }
  
  return result;
}

function InsertNumsCommand() {
  let document = vscode.window;
  
  const maxDecimals:number = 20;
  
  if (vscode === undefined || vscode.window === undefined || vscode.window.activeTextEditor === undefined) {
    vscode.window.showErrorMessage("Extension only available with active Texteditor");
    return null;
  }

  let selections = vscode.window.activeTextEditor !== undefined ? vscode.window.activeTextEditor.selections : null;

  if (selections === null) { return null; }

  let selLen = selections.length;
  
  document.showInputBox({ prompt: "Enter format string (default: '1:1')", placeHolder: "1:1"})
    .then((result:any) => {
      
      if (result === undefined) { return null; }
      
      let eingabe = (result.length > 0) ? result : "1:1";
      
      let {insertnum, insertalpha, exprmode} = getRegexps();
      const numreg = new RegExp(insertnum,"gi");
      const alphareg = new RegExp(insertalpha,"gi");
      const exprreg = new RegExp(exprmode,"gi");

      let matchNum = numreg.exec(eingabe);
      let matchAlpha = alphareg.exec(eingabe);
      let matchExpr = exprreg.exec(eingabe);
      
      let groups;
      
      if (matchNum) {
// @ts-ignore
        groups = matchNum.groups;
      } else if (matchAlpha) {
// @ts-ignore
        groups = matchAlpha.groups;
      } else if (matchExpr) {
// @ts-ignore
        groups = matchExpr.groups;
      } else {
        vscode.window.showErrorMessage("Format string not valid" + result);
        return null;
      }
      
      const EXPRMODE = groups !== undefined && (Object.prototype.hasOwnProperty.call(groups,'cast'));
      const ALPHA = groups !== undefined && Object.prototype.hasOwnProperty.call(groups,'wrap');
      const REVERSE = (groups as any).reverse === "!";
      const step = groups !== undefined && Object.prototype.hasOwnProperty.call(groups,'step') && (groups as any).step !== undefined ? intOrFloat((groups as any).step) : 1;
      const expr = (! ALPHA) && (groups as any).expr !== undefined;
      const stop_expr = (groups as any).stopexpr;
      const cast = EXPRMODE && (groups as any).cast !== undefined ? (groups as any).cast : "s";
      const UPPER = ALPHA && (groups as any).start[0] === (groups as any).start[0].toUpperCase();
      const WRAP = ALPHA && (groups as any).wrap === "w";
      const format = (groups as any).format !== undefined ? (groups as any).format : "";
      
      const format_padding = (groups as any).format_padding;
      const format_align = (groups as any).format_align;
      const format_sign = (groups as any).format_sign;
      const format_filled = (groups as any).format_filled;
      const format_integer = (groups as any).format_integer;
      const format_precision = (groups as any).format_precision;
      const format_type = (groups as any).format_type;
      
      const alphaformat_padding = (groups as any).alphaformat_padding;
      const alphaformat_align = (groups as any).alphaformat_align;
      const alphaformat_integer = (groups as any).alphaformat_integer;
      
      let decimals = ((groups as any).step && (groups as any).step.indexOf(".") > -1) ? (((groups as any).step.length - (groups as any).step.indexOf(".") - 1) <= maxDecimals ? (groups as any).step.length - (groups as any).step.indexOf(".") - 1 : maxDecimals) : 0;
      
      if (format.length > 0) {
        decimals = (format.indexOf('.') > -1) ? (format.length - format.indexOf('.') - 1) : decimals;
      }
      
      let values:any = [];
      let value:any = 1;
      let lenVal:number = 0;
      
      if (EXPRMODE) {
      } else if (! ALPHA) {
        value = ((groups as any).start !== undefined) ? Number((groups as any).start) : 1;
      } else {
        value = ((groups as any).start !== undefined) ? alphaToNum(String((groups as any).start).toLocaleLowerCase()) : 1;
        lenVal = WRAP ? (groups as any).start.toString().length : 0;
      }
      
      let evalValue:any = 0;
      let replace:any;
      let prevValue:number = 0;
      
      let i:number = 0;
      let skip:boolean = false;
      let evalStr:string = "";
      
      let startTime = Date.now();
      let timeLimit = 1000;  // max. 1 second in the while loop
      
      let castTable = {
        i: function(value:any):any { return (Number(value) === (Number(value)|0)) ? Number(value) : null; },
        f: function(value:any):any { return (Number(value) !== (Number(value)|0)) ? Number(value) : null; },
        s: function(value:any):string { let x = String(value); return x; },
        b: function(value:any):boolean { return Boolean(value); }
      };
      
      let WSP = new vscode.WorkspaceEdit();

      while (true) {
        if ((EXPRMODE || (stop_expr === undefined)) && (vscode.window.activeTextEditor !== undefined && vscode.window.activeTextEditor.selections.length === i)) {
          break;
        }
        if (Date.now() > startTime + timeLimit) {
          // vscode.window.showInformationMessage(`Time limit of ${timeLimit}s exceeded`);
          // break;
        }
        if (EXPRMODE) {
          let range = ((selections !== null) ? ((! REVERSE) ? selections[i] : selections[selections.length -1 - i]) : null) as vscode.Range;
          let original:string = "";
          if (vscode.window.activeTextEditor !== undefined) {
            original = vscode.window.activeTextEditor.document.getText(range);
          }
          try {
// @ts-ignore
            value = castTable[cast](original);
          }
          catch(e) {
// @ts-ignore
            vscode.window.showErrorMessage(`[${value}] could not be cast to ${castTable[cast]}`);
            return null;
          }
        } else {
          let range = ((selections !== null) && (i < selections.length) ? ((! REVERSE) ? selections[i] : selections[selections.length-1-i]) : null) as vscode.Range;
          if (range !== null && ! range.isEmpty && vscode.window.activeTextEditor !== undefined) {
            let original = vscode.window.activeTextEditor.document.getText(range);
            value = Number.isNaN(+original) ? value : +original;
          }
        }
        if (! skip) {
          if (expr || (stop_expr !== undefined)) {
            if (EXPRMODE) {
              (groups as any).step = "";
            }
          }
          if (ALPHA) {
            evalValue = numToAlpha(value, lenVal);
            if (UPPER) {
              String(evalValue).toLocaleUpperCase();
            }
          } else {
            if (expr) {
              value = (value !== null) ? value : 0;
              evalStr = (groups as any).expr.replace(/\b_\b/g,value).replace(/\bs\b/gi,step).replace(/\bn\b/gi,selLen).replace(/\bp\b/gi,prevValue).replace(/\bc\b/gi,evalValue).replace(/\bi\b/gi,i);
              try {
                evalValue = eval(evalStr);
              }
              catch(e) {
                vscode.window.showErrorMessage(`[${(groups as any).expr}] Invalid Expression. Exception is: ` + e);
                return null;
              }
            } else {
              evalValue = value;
            }
          }
          
          if (stop_expr !== undefined) {
            evalStr = stop_expr.replace(/\b_\b/g,value).replace(/\bs\b/gi,step).replace(/\bn\b/gi,selLen).replace(/\bp\b/gi,prevValue).replace(/\bc\b/gi,evalValue).replace(/\bi\b/gi,i);
            try {
              if (eval(evalStr)) { break; }
            }
            catch(e) {
              vscode.window.showErrorMessage(`[${stop_expr}] Invalid Stop Expression. Exception is: ` + e);
              return null;
            }
          }
          if (format !== undefined && format.length > 0) {
            let preFormat = "%";
            replace = "";
            if (! ALPHA) {
/* 
              if (format_sign !== undefined) { preFormat += format_sign; }
              if (format_padding !== undefined) { preFormat += "'" + format_padding; }
              if (format_align !== undefined) { if (format_align === "<") { preFormat += "-"; } }
              if (format_filled !== undefined) { preFormat += format_filled; }
              if (format_integer !== undefined) { preFormat += format_integer; }
 */
              if (format_precision !== undefined) { 
                preFormat += "." + format_precision; 
                decimals = format_precision; 
              }
/* 
              if (format_type !== undefined) { 
                preFormat += format_type; 
              } else { 
                if ((format_precision !== undefined) || decimals > 0) {
                  preFormat += "g";
                } else {
                  preFormat += "d"; 
                }
              }
 */           
              replace = d3.format(format)((decimals > 0) ? evalValue.toFixed(decimals) : evalValue);
            } else {
              let alphaFormat:object = {};
// @ts-ignore
              alphaFormat.padding = alphaformat_padding;
// @ts-ignore
              alphaFormat.align = alphaformat_align;
// @ts-ignore
              alphaFormat.integer = alphaformat_integer;
              replace = formatString(alphaFormat, evalValue); 
            }

          } else {
            replace = String(decimals > 0 ? evalValue.toFixed(decimals) : evalValue);
          }
        }
        
        values.push((! skip) ? String(replace) : String(value));
        prevValue = (! skip) ? +replace : +value;
        
        if (! EXPRMODE) {
          value += +step;
          value.toFixed(decimals);
        }
        i += 1;
        skip = false;
      }
      
      if (values.length === 0) { return null; }
      
      if (EXPRMODE) {
        if (selections !== null) {
          if (REVERSE) {
            selections.reverse();
          }
          selections.forEach(function(element, index) {
            if (index === values.length) {
              return;
            }
             if (vscode.window.activeTextEditor !== undefined) {
              WSP.replace(vscode.window.activeTextEditor.document.uri,element,values[index]);
            }
          });
          vscode.workspace.applyEdit(WSP);
        }
      } else {
        let text:string = "";
        
        if (selections !== null) {
          selections.forEach(function (element:vscode.Range, index:number) {
            if (index >= values.length) {
              text = "";
            } else if ((index + 1 === selLen) && (values.length > selLen)) {
              let other = (! REVERSE) ? values.slice(index,values.length) : values.slice(0,-index-1);
              text = other.join("\n");
            } else {
              text = REVERSE ? values[values.length-index-1].toString() : values[index].toString();
            }
            if (vscode.window.activeTextEditor !== undefined) {
              WSP.replace(vscode.window.activeTextEditor.document.uri,element,text);
            }
          });
          vscode.workspace.applyEdit(WSP);
        }
      }
      
      // vscode.window.showInformationMessage("Eingegeben: " + eingabe);
    });

}