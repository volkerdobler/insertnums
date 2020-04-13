/* 
The extension "InsertNums" is an adoption of a wonderful plugin for
Sublimecode from James Brooks.
https://github.com/jbrooksuk/InsertNums

All errors are in my own responsibility and are solely done by
myself.

If you want to contact me, send an E-Mail to 
insertnums.extension@volker-dobler.de

Volker Dobler
November 2019
 */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// var d3 = require('d3-format');
import * as d3 from "d3-format";

// var sprintf = require('sprintf-js').sprintf;
// import sprintf from 'sprintf-js';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "insertnums" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "extension.insertNums",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      // vscode.window.showInformationMessage("Hello World");
      InsertNumsCommand();
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  return;
}

function intOrFloat(value: string): number {
  const num = parseInt(value);
  return Number.isInteger(num) ? parseInt(value) : parseFloat(value);
}

function numToAlpha(num: number, len = 0): string {
  let res = "";

  if (len > 0) {
    num = ((num - 1) % Math.pow(26, len)) + 1;
  }

  while (num > 0) {
    --num;
    res = String.fromCharCode(97 + (num % 26)) + res;
    num = Math.floor(num / 26);
  }

  return res;
}

function alphaToNum(alpha: string): number {
  let res = 0;

  for (let i = 0; i < alpha.length; i++) {
    res *= 26;
    res += alpha.charCodeAt(i) - 96;
  }

  return res;
}

function formatString(format: object, text: string): string {
  // To-Do (String formatieren)
  let str: string = text;

  //@ts-ignore
  const padding = format.padding !== undefined ? format.padding : " ";
  //@ts-ignore
  const align = format.align !== undefined ? format.align : "<";
  //@ts-ignore
  const lenStr = format.integer !== undefined ? format.integer : 0;

  while (str.length < lenStr) {
    if (align === "<") {
      str += padding;
    }
    if (align === ">") {
      str = padding + str;
    }
    if (align === "^") {
      if (str.length % 2 === 0) {
        str = padding + str + padding;
      } else {
        str += padding;
      }
    }
  }

  return lenStr === 0 ? text : str.substr(0, lenStr);
}

if (!Object.entries) {
  Object.entries = function( obj: any ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    
    return resArray;
  };
}

function getRegexps(): any {
  
  function hasKey<O>(obj: O, key: keyof any): key is keyof O {
    return key in obj
  }

  const ruleTemplate = {
    integer: "[1-9]\\d* | 0",
    signedint: "[+-]? {integer}",
    pointfloat: "({integer})? \\. \\d+ | {integer} \\.",
    exponentfloat: "(?:{integer} | {pointfloat}) [eE] [+-]? \\d+",
    float: "{pointfloat} | {exponentfloat}",
    numeric: "{integer} | {float}",
    signedNum: "[+-]? {numeric}",
    format:
      "((?<format_padding> [^}}])?(?<format_align> [<>=^]))?(?<format_sign> [-+ ])?#?(?<format_filled> 0)?(?<format_integer> {integer})?(\\.(?<format_precision> \\d+))?(?<format_type> [bcdeEfFgGnoxX%])?",
    alphastart: "[a-z]+ | [A-Z]+",
    alphaformat:
      "((?<alphaformat_padding>[^}}])?(?<alphaformat_align>[<>^]))?((?<alphaformat_integer>{integer}))?",
    cast: "[ifsb]",
    expr: ".+?",
    stopExpr: ".+?",
    exprMode:
      "^(?<cast> {cast})?\\|(~ (?<format> {format}) ::)? (?<expr> {expr}) (@(?<stopExpr> {stopExpr}))?(?<reverse> !)?$",
    insertNum:
      "^(?<start> {signedNum})? (:(?<step> {signedNum}))? (~(?<format> {format}))?(::(?<expr> {expr}))? (@ (?<stopExpr> {stopExpr}) )? (?<reverse> !)? $",
    insertAlpha:
      "^(?<start> {alphastart})(: (?<step> {signedint}) )? (~ (?<format> {alphaformat})(?<wrap> w)?)?(@(?<stopExpr> {stopExpr}) )?(?<reverse> !)?$",
  };

  const result = {
    exprMode: "",
    insertNum: "",
    insertAlpha: "",
  };

  for (let [key, value] of Object.entries(ruleTemplate)) {
    while (value.indexOf("{") > -1) {
      const start: number = value.indexOf("{");
      const ende: number = value.indexOf("}", start + 1) + 1;
      const replace: string = value.slice(start, ende);
      const rule: string = replace.slice(1, replace.length - 1);
      if (hasKey(ruleTemplate, rule)) {
        value = value.replace(replace, ruleTemplate[rule]); // works fine!
      }
    }
    if (hasKey(result,key)) {
      result[key] = value.replace(/\s/gi, "");
    }
  }

  return result;
}

function InsertNumsCommand(): void {
  const document = vscode.window;

  const maxDecimals = 20;

  if (
    vscode === undefined ||
    vscode.window === undefined ||
    vscode.window.activeTextEditor === undefined
  ) {
    vscode.window.showErrorMessage(
      "Extension only available with active Texteditor"
    );
  }

  const selections =
    vscode.window.activeTextEditor !== undefined
      ? vscode.window.activeTextEditor.selections
      : null;

  if (selections === null) {
    return;
  }

  const selLen = selections.length;

  document
    .showInputBox({
      prompt: "Enter format string (default: '1:1')",
      placeHolder: "1:1",
    })
    .then((result: any) => {
      if (result === undefined) {
        return null;
      }

      const eingabe = result.length > 0 ? result : "1:1";

      const { insertNum, insertAlpha, exprMode } = getRegexps();
      const numReg = new RegExp(insertNum, "gi");
      const alphaReg = new RegExp(insertAlpha, "gi");
      const exprReg = new RegExp(exprMode, "gi");

      const matchNum = numReg.exec(eingabe);
      const matchAlpha = alphaReg.exec(eingabe);
      const matchExpr = exprReg.exec(eingabe);

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

      const EXPRMODE =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, "cast");
      const ALPHA =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, "wrap");
      const REVERSE = groups !== undefined && groups.reverse === "!";
      const step =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, "step") &&
        groups.step != undefined
          ? intOrFloat(groups.step)
          : 1;
      const expr = !ALPHA && groups !== undefined && groups.expr !== undefined;
      const stopExpr = groups !== undefined && groups.stopExpr;
      const cast =
        EXPRMODE && groups !== undefined && groups.cast !== undefined
          ? groups.cast
          : "s";
      const UPPER =
        ALPHA &&
        groups !== undefined && groups.start[0] === groups.start[0].toUpperCase();
      const WRAP = ALPHA && groups !== undefined && groups.wrap === "w";
      const format =
        groups !== undefined && groups.format !== undefined ? groups.format : "";

      const format_padding = groups !== undefined && groups.format_padding;
      const format_align = groups !== undefined && groups.format_align;
      const format_sign = groups !== undefined && groups.format_sign;
      const format_filled = groups !== undefined && groups.format_filled;
      const format_integer = groups !== undefined && groups.format_integer;
      const format_precision = groups !== undefined && groups.format_precision;
      const format_type = groups !== undefined && groups.format_type;

      const alphaformat_padding = groups !== undefined && groups.alphaformat_padding;
      const alphaformat_align = groups !== undefined && groups.alphaformat_align;
      const alphaformat_integer = groups !== undefined && groups.alphaformat_integer;

      let decimals =
        groups !== undefined && groups.step && groups.step.indexOf(".") > -1
          ? groups.step.length -
              groups.step.indexOf(".") -
              1 <=
            maxDecimals
            ? groups.step.length -
              groups.step.indexOf(".") -
              1
            : maxDecimals
          : 0;

      if (format.length > 0) {
        decimals =
          format.indexOf(".") > -1
            ? format.length - format.indexOf(".") - 1
            : decimals;
      }

      const values: any = [];
      let value: any = 1;
      let lenVal = 0;

      if (EXPRMODE) {
      } else if (!ALPHA) {
        value =
          groups !== undefined && groups.start !== undefined
            ? Number(groups.start)
            : 1;
      } else {
        value =
          groups !== undefined && groups.start !== undefined
            ? alphaToNum(String(groups.start).toLocaleLowerCase())
            : 1;
        lenVal = groups !== undefined && WRAP ? groups.start.toString().length : 0;
      }

      let evalValue: any = 0;
      let replace: any;
      let prevValue = 0;

      let i = 0;
      let skip = false;
      let evalStr = "";

      const startTime = Date.now();
      const timeLimit = 1000; // max. 1 second in the while loop

      const castTable = {
        i: function (value: any): number {
          return Number(value) === (Number(value) | 0) ? Number(value) : 0;
        },
        f: function (value: any): number {
          return Number(value) !== (Number(value) | 0) ? Number(value) : 0;
        },
        s: function (value: any): string {
          return String(value);
        },
        b: function (value: any): boolean {
          return Boolean(value);
        },
      };

      const WSP = new vscode.WorkspaceEdit();

      while (true) {
        if (
          (EXPRMODE || stopExpr === undefined) &&
          vscode.window.activeTextEditor !== undefined &&
          vscode.window.activeTextEditor.selections.length === i
        ) {
          break;
        }
        if (Date.now() > startTime + timeLimit) {
          vscode.window.showInformationMessage(
            `Time limit of ${timeLimit}s exceeded`
          );
          break;
        }
        if (EXPRMODE) {
          const rangeSel = (selections !== null
            ? !REVERSE
              ? selections[i]
              : selections[selections.length - 1 - i]
            : undefined);
          let original = "";
          if (vscode.window.activeTextEditor !== undefined) {
            original = vscode.window.activeTextEditor.document.getText(rangeSel);
          }
          try {
            // @ts-ignore
            value = castTable[cast](original);
          } catch (e) {
            vscode.window.showErrorMessage(
              // @ts-ignore
              `[${value}] could not be cast to ${castTable[cast]}`
            );
            return null;
          }
        } else {
          const rangeSel = (selections !== null && i < selections.length
            ? !REVERSE
              ? selections[i]
              : selections[selections.length - 1 - i]
            : null);
          if (
            rangeSel !== null &&
            !rangeSel.isEmpty &&
            vscode.window.activeTextEditor !== undefined
          ) {
            const original = vscode.window.activeTextEditor.document.getText(
              rangeSel
            );
            value = Number.isNaN(+original) ? value : +original;
          }
        }
        if (!skip) {
          if (expr || stopExpr !== undefined) {
            if (groups !== undefined && EXPRMODE) {
              groups.step = "";
            }
          }
          if (ALPHA) {
            evalValue = numToAlpha(value, lenVal);
            if (UPPER) {
              String(evalValue).toLocaleUpperCase();
            }
          } else {
            if (groups !== undefined && expr) {
              value = value !== null ? value : 0;
              evalStr = groups.expr
                .replace(/\b_\b/g, value)
                .replace(/\bs\b/gi, step.toString())
                .replace(/\bn\b/gi, selLen.toString())
                .replace(/\bp\b/gi, prevValue.toString())
                .replace(/\bc\b/gi, evalValue)
                .replace(/\bi\b/gi, i.toString());
              try {
                evalValue = eval(evalStr);
              } catch (e) {
                vscode.window.showErrorMessage(
                  `[${
                    groups.expr
                  }] Invalid Expression. Exception is: ` + e
                );
                return null;
              }
            } else {
              evalValue = value;
            }
          }

          if (stopExpr !== undefined && stopExpr) {
            evalStr = stopExpr
              .replace(/\b_\b/g, value)
              .replace(/\bs\b/gi, step.toString())
              .replace(/\bn\b/gi, selLen.toString())
              .replace(/\bp\b/gi, prevValue.toString())
              .replace(/\bc\b/gi, evalValue)
              .replace(/\bi\b/gi, i.toString());
            try {
              if (eval(evalStr)) {
                break;
              }
            } catch (e) {
              vscode.window.showErrorMessage(
                `[${stopExpr}] Invalid Stop Expression. Exception is: ` + e
              );
              return null;
            }
          }
          if (format !== undefined && format.length > 0) {
            let preFormat = "%";
            replace = "";
            if (!ALPHA) {
              /* 
              if (format_sign !== undefined) { preFormat += format_sign; }
              if (format_padding !== undefined) { preFormat += "'" + format_padding; }
              if (format_align !== undefined) { if (format_align === "<") { preFormat += "-"; } }
              if (format_filled !== undefined) { preFormat += format_filled; }
              if (format_integer !== undefined) { preFormat += format_integer; }
 */
              if (format_precision !== undefined) {
                preFormat += "." + format_precision;
                decimals = format_precision ? parseInt(format_precision) : 0;
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

              replace = d3.format(format)(
                decimals > 0 ? evalValue.toFixed(decimals) : evalValue
              );
            } else {
              const alphaFormat: object = {};
              // @ts-ignore
              alphaFormat.padding = alphaformat_padding;
              // @ts-ignore
              alphaFormat.align = alphaformat_align;
              // @ts-ignore
              alphaFormat.integer = alphaformat_integer;
              replace = formatString(alphaFormat, evalValue);
            }
          } else {
            replace = String(
              decimals > 0 ? evalValue.toFixed(decimals) : evalValue
            );
          }
        }

        values.push(!skip ? String(replace) : String(value));
        prevValue = !skip ? +replace : +value;

        if (!EXPRMODE) {
          value += +step;
          value.toFixed(decimals);
        }
        i += 1;
        skip = false;
      }

      if (values.length === 0) {
        return null;
      }

      if (EXPRMODE) {
        if (selections !== null) {
          if (REVERSE) {
            selections.reverse();
          }
          selections.forEach(function (element: any, index: any) {
            if (index === values.length) {
              return;
            }
            if (vscode.window.activeTextEditor !== undefined) {
              WSP.replace(
                vscode.window.activeTextEditor.document.uri,
                element,
                values[index]
              );
            }
          });
          vscode.workspace.applyEdit(WSP);
        }
      } else {
        let text = "";

        if (selections !== null) {
          selections.forEach(function (element: vscode.Range, index: number) {
            if (index >= values.length) {
              text = "";
            } else if (index + 1 === selLen && values.length > selLen) {
              const other = !REVERSE
                ? values.slice(index, values.length)
                : values.slice(0, -index - 1);
              text = other.join("\n");
            } else {
              text = REVERSE
                ? values[values.length - index - 1].toString()
                : values[index].toString();
            }
            if (vscode.window.activeTextEditor !== undefined) {
              WSP.replace(
                vscode.window.activeTextEditor.document.uri,
                element,
                text
              );
            }
          });
          vscode.workspace.applyEdit(WSP);
        }
      }

      // vscode.window.showInformationMessage("Eingegeben: " + eingabe);
    });
}
