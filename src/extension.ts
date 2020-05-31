/* 
The extension "InsertNums" is an adoption of a wonderful plugin for
Sublimecode from James Brooks.
https://github.com/jbrooksuk/InsertNums

All errors are in my own responsibility and are solely done by
myself.

If you want to contact me, send an E-Mail to 
insertnums.extension@volker-dobler.de

Volker Dobler
May 2020
 */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as d3 from 'd3-format';

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
    'extension.insertNums',
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
  showHistory.dispose();
  return;
}

const commandHistory: string[] = [];

let showHistory: vscode.OutputChannel = vscode.window.createOutputChannel(
  'Insertnums History'
);

function InsertNumsCommand(): void {
  interface IntAlphaFormat {
    padding: string | false;
    align: string | false;
    integer: number | false;
  }

  function intOrFloat(value: string): number {
    const num = parseInt(value);
    return Number.isInteger(num) ? parseInt(value) : parseFloat(value);
  }

  function numToAlpha(num: number, len = 0): string {
    let res = '';

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

  function numToHex(num: number, len: number = 0): string {
    let res = '';

    while (num > 0) {
      const divRest = num % 16;
      if (divRest >= 10) {
        res = String.fromCharCode(87 + divRest) + res;
      } else {
        res = String.fromCharCode(48 + divRest) + res;
      }
      num = Math.floor(num / 16);
    }

    while (res.length < len) {
      res = '0' + res;
    }

    return '0x' + res;
  }
  function hexToNum(hex: string): number | undefined {
    let res = 0;

    if (hex.substring(0, 2).toLocaleLowerCase() !== '0x') {
      return undefined;
    }

    for (let i = 2; i < hex.length; i++) {
      res *= 16;
      const curCharCode = hex.toLocaleLowerCase().charCodeAt(i);

      switch (true) {
        case curCharCode >= 48 && curCharCode <= 57:
          res += curCharCode - 48;
          break;
        case curCharCode >= 97 && curCharCode <= 102:
          res += curCharCode - 87;
          break;
        default:
          vscode.window.showErrorMessage('Wrong hex number: ${hey}');
      }
    }

    return res;
  }

  function formatString(format: IntAlphaFormat, text: string): string {
    // To-Do (String formatieren)
    let str: string = text;

    const padding =
      format.padding !== undefined && format.padding ? format.padding : ' ';
    const align =
      format.align !== undefined && format.align ? format.align : '<';
    const lenStr =
      format.integer !== undefined && format.integer ? format.integer : 0;

    while (str.length < lenStr) {
      if (align === '<') {
        str += padding;
      }
      if (align === '>') {
        str = padding + str;
      }
      if (align === '^') {
        if (str.length % 2 === 0) {
          str = padding + str + padding;
        } else {
          str += padding;
        }
      }
    }

    return lenStr === 0 ? text : str.substr(0, lenStr);
  }

  function getRandomNumber(from: number, to: number): number {
    return Math.round(Math.random() * (to - from) + from);
  }

  if (!Object.entries) {
    Object.entries = function (obj: any): any {
      const ownProps = Object.keys(obj);
      let i = ownProps.length;
      const resArray = new Array(i); // preallocate the Array
      while (i--) {
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
      }
      return resArray;
    };
  }

  function getRegexps(): any {
    function hasKey<O>(obj: O, key: keyof any): key is keyof O {
      return key in obj;
    }

    const ruleTemplate = {
      integer: '[1-9]\\d* | 0',
      hexdigits: '[1-9a-fA-F][0-9a-fA-F]*',
      signedint: '[+-]? {integer}',
      pointfloat: '({integer})? \\. \\d+ | {integer} \\.',
      exponentfloat: '(?:{integer} | {pointfloat}) [eE] [+-]? \\d+',
      float: '{pointfloat} | {exponentfloat}',
      hexNum: '0[xX]{hexdigits}',
      numeric: '{integer} | {float}',
      signedNum: '([+-]? {numeric})|{hexNum}',
      format:
        '((?<format_padding> [^}}])? (?<format_align> [<>=^]))? (?<format_sign> [-+ ])? #? (?<format_filled> 0)? (?<format_integer> {integer})? (\\.(?<format_precision> \\d+))? (?<format_type> [bcdeEfFgGnoxX%])?',
      alphastart: '[a-z]+ | [A-Z]+',
      alphaformat:
        '((?<alphaformat_padding>[^}}])? (?<alphaformat_align>[<>^]))? ((?<alphaformat_integer>{integer}))?',
      cast: '[ifsb]',
      expr: '.+?',
      stopExpr: '.+?',
      exprMode:
        '^(?<cast> {cast})?\\|(~(?<format> {format})::)? (?<expr> {expr}) (@(?<stopExpr> {stopExpr}))? (?<reverse> !)?$',
      insertNum:
        '^(?<start> {signedNum})? (:(?<step> {signedNum}))? (r(?<random> \\+?\\d+))? (\\*(?<frequency> {integer}))? (#(?<repeat> {integer}))? (~(?<format> {format}))? (::(?<expr> {expr}))? (@ (?<stopExpr> {stopExpr}))? (?<reverse> !)?$',
      insertAlpha:
        '^(?<start> {alphastart})(:(?<step> {signedint}))? (\\*(?<frequency> {integer}))? (#(?<repeat> {integer}))? (~(?<format> {alphaformat})(?<wrap> w)?)? (@(?<stopExpr> {stopExpr}) )?(?<reverse> !)?$',
    };

    const result = {
      exprMode: '',
      insertNum: '',
      insertAlpha: '',
    };

    for (let [key, value] of Object.entries(ruleTemplate)) {
      while (value.indexOf('{') > -1) {
        const start: number = value.indexOf('{');
        const ende: number = value.indexOf('}', start + 1) + 1;
        const replace: string = value.slice(start, ende);
        const rule: string = replace.slice(1, replace.length - 1);
        if (hasKey(ruleTemplate, rule)) {
          value = value.replace(replace, ruleTemplate[rule]); // works fine!
        }
      }
      if (hasKey(result, key)) {
        result[key] = value.replace(/\s/gi, '');
      }
    }

    return result;
  }

  const document = vscode.window;

  const maxDecimals = 20;

  if (
    vscode === undefined ||
    vscode.window === undefined ||
    vscode.window.activeTextEditor === undefined
  ) {
    vscode.window.showErrorMessage(
      'Extension only available with active Texteditor'
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
      placeHolder: '1:1',
    })
    .then((result: any) => {
      if (result === undefined) {
        return null;
      }

      let getHistory: boolean = false;

      if (result.length > 1 && result[0] === '!') {
        let rest = result.toString().substring(1);
        switch (rest) {
          case '!':
            if (commandHistory.length > 0) {
              result = commandHistory[0];
              getHistory = true;
              break;
            } else {
              vscode.window.showErrorMessage(
                '[History] History length too short!'
              );
              return null;
            }
          case 'p':
            if (commandHistory.length > 0) {
              showHistory.clear();
              for (let i = 0; i < commandHistory.length; i++) {
                showHistory.appendLine(
                  '!' + i + ' => "' + commandHistory[i] + '"'
                );
              }
              showHistory.show(true);
            } else {
              vscode.window.showErrorMessage('[History] Empty');
            }
            return null;
          case 'c':
            commandHistory.length = 0;
            vscode.window.showErrorMessage('[History] Cleared!');
            return null;
          default:
            let numRest = Math.abs(parseInt(rest));
            let nachNum = rest.replace(numRest, '');
            if (commandHistory.length >= numRest) {
              result =
                commandHistory[numRest] + (nachNum.length > 0 ? nachNum : '');
              if (nachNum.length === 0) {
                getHistory = true;
              }
            }
        }
      }

      const eingabe = result.length > 0 ? result : '1:1';

      if (!getHistory) {
        commandHistory.unshift(eingabe);
      }

      const { insertNum, insertAlpha, exprMode } = getRegexps();
      const numReg = new RegExp(insertNum, 'gi');
      const alphaReg = new RegExp(insertAlpha, 'gi');
      const exprReg = new RegExp(exprMode, 'gi');

      let matchNum = null;
      let matchAlpha = null;
      let matchExpr = null;

      try {
        matchNum = numReg.exec(eingabe);
        matchAlpha = alphaReg.exec(eingabe);
        matchExpr = exprReg.exec(eingabe);
      } catch (e) {
        vscode.window.showErrorMessage(
          'No valid regular expression:' + eingabe
        );
        return null;
      }

      let groups;

      if (!!matchNum) {
        groups = matchNum.groups;
      } else if (!!matchAlpha) {
        groups = matchAlpha.groups;
      } else if (!!matchExpr) {
        groups = matchExpr.groups;
      } else {
        vscode.window.showErrorMessage('Format string not valid ' + result);
        return null;
      }

      const EXPRMODE =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'cast');
      const ALPHA =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'wrap');
      const REVERSE =
        groups !== undefined && groups.reverse && groups.reverse === '!';
      const hexNumber =
        (groups !== undefined &&
          Object.prototype.hasOwnProperty.call(groups, 'start') &&
          groups.start &&
          groups.start.length > 2 &&
          groups.start.substring(0, 2).toLocaleLowerCase() === '0x') ||
        (selections &&
          vscode.window.activeTextEditor?.document
            .getText(selections[0])
            .trim()
            .substring(0, 2) === '0x');
      const numLength =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'format_integer')
          ? Number(groups.format_integer)
          : 0;
      const step =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'step') &&
        groups.step != undefined
          ? groups.step.substring(0, 2).toLocaleLowerCase() === '0x'
            ? hexToNum(groups.step) != undefined
              ? hexToNum(groups.step)
              : 1
            : intOrFloat(groups.step)
          : 1;
      const randomStart =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'start') &&
        groups.start !== undefined
          ? Number(groups.start)
          : 1;
      const randomTo =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'random') &&
        groups.random !== undefined
          ? groups.random[0] === '+'
            ? randomStart + Number(groups.random)
            : Number(groups.random)
          : 0;
      const repeat =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'repeat') &&
        groups.repeat != undefined &&
        Number.isInteger(parseInt(groups.repeat)) &&
        randomTo === 0
          ? parseInt(groups.repeat)
          : 0;
      const frequency =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'frequency') &&
        groups.frequency != undefined &&
        Number.isInteger(parseInt(groups.frequency)) &&
        randomTo === 0
          ? parseInt(groups.frequency)
          : 0;
      const expr = !ALPHA && groups !== undefined && groups.expr !== undefined;
      const stopExpr = groups !== undefined && groups.stopExpr;
      const cast: any =
        EXPRMODE && groups !== undefined && groups.cast !== undefined
          ? groups.cast
          : 's';
      const UPPER =
        ALPHA &&
        groups !== undefined &&
        groups.start &&
        groups.start.length > 0 &&
        groups.start[0] === groups.start[0].toUpperCase();
      const WRAP =
        ALPHA && groups !== undefined && groups.wrap && groups.wrap === 'w';
      const format =
        groups !== undefined && groups.format !== undefined
          ? groups.format
          : '';

      const alphaformat_padding =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'alphaformat_padding') &&
        groups.alphaformat_padding;
      const alphaformat_align =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'alphaformat_align') &&
        groups.alphaformat_align;
      const alphaformat_integer =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'alphaformat_integer') &&
        groups.alphaformat_integer;

      let decimals =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'step') &&
        groups.step &&
        groups.step.indexOf('.') > -1
          ? groups.step.length - groups.step.indexOf('.') - 1 <= maxDecimals
            ? groups.step.length - groups.step.indexOf('.') - 1
            : maxDecimals
          : 0;

      if (format.length > 0) {
        decimals =
          format.indexOf('.') > -1
            ? format.length - format.indexOf('.') - 1
            : decimals;
      }

      const values: any = [];
      let value: any = 1;
      let lenVal = 0;

      if (EXPRMODE) {
      } else if (!ALPHA) {
        value =
          groups !== undefined &&
          Object.prototype.hasOwnProperty.call(groups, 'start') &&
          groups.start !== undefined
            ? randomTo && randomTo > 0 && Number(groups.start)
              ? getRandomNumber(randomStart, randomTo)
              : hexNumber
              ? hexToNum(groups.start) != null
                ? hexToNum(groups.start)
                : 1
              : Number(groups.start)
            : 1;
      } else {
        value =
          groups !== undefined &&
          Object.prototype.hasOwnProperty.call(groups, 'start') &&
          groups.start !== undefined
            ? alphaToNum(String(groups.start).toLocaleLowerCase())
            : 1;
        lenVal =
          groups !== undefined &&
          WRAP &&
          Object.prototype.hasOwnProperty.call(groups, 'start')
            ? groups.start.toString().length
            : 0;
      }

      const startValue: any =
        groups !== undefined &&
        Object.prototype.hasOwnProperty.call(groups, 'start') &&
        groups.start !== undefined
          ? value
          : 1;

      if (randomTo > 0 && groups && randomTo <= startValue) {
        vscode.window.showErrorMessage(
          `[Start: ${startValue} > Step: ${randomTo}] For random numbers, step needs to be larger than start value!`
        );
        return null;
      }

      let evalValue: any = 0;
      let replace: any;
      let prevValue = 0;
      let repeatCounter = 1;
      let frequencyCounter = 1;

      let i = 0;
      let skip = false;
      let evalStr = '';

      const startTime = Date.now();
      const timeLimit = 1000; // max. 1 second in the while loop

      const castTable: any = {
        i: function (value: string): number {
          return value.toString().length > 0 &&
            Number(value) === (Number(value) | 0)
            ? Number.parseInt(value)
            : 0;
        },
        f: function (value: string): number {
          return value.toString().length > 0 &&
            Number(value) === (Number(value) | 0)
            ? Number.parseFloat(value)
            : 0;
        },
        s: function (value: string): string {
          return String(value);
        },
        b: function (value: string): boolean {
          return value.toString().length > 0 ? Boolean(value) : true;
        },
      };

      const WSP = new vscode.WorkspaceEdit();

      while (true) {
        if (
          /* EXPRMODE ||  */ stopExpr === undefined &&
          vscode.window.activeTextEditor !== undefined &&
          vscode.window.activeTextEditor.selections.length === i
        ) {
          break;
        }
        if (Date.now() > startTime + timeLimit) {
          vscode.window.showInformationMessage(
            `Time limit of ${timeLimit}ms exceeded`
          );
          return null;
          break;
        }

        if (EXPRMODE) {
          const rangeSel =
            selections !== null && i < selections.length
              ? !REVERSE
                ? selections[i]
                : selections[selections.length - 1 - i]
              : undefined;
          let original = '';
          if (vscode.window.activeTextEditor !== undefined) {
            original = vscode.window.activeTextEditor.document.getText(
              rangeSel
            );
          }
          try {
            value =
              original.length > 0
                ? castTable[cast](original)
                : castTable[cast](value);
          } catch (e) {
            vscode.window.showErrorMessage(
              // @ts-ignore
              `[${value}] could not be cast to ${castTable[cast]}`
            );
            skip = true;
            return null;
          }
        } else {
          const rangeSel =
            selections !== null && i < selections.length
              ? !REVERSE
                ? selections[i]
                : selections[selections.length - 1 - i]
              : null;
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
              groups.step = '';
            }
          }
          if (ALPHA) {
            evalValue = numToAlpha(value, lenVal);
            if (UPPER) {
              evalValue = String(evalValue).toLocaleUpperCase();
            }
          } else {
            if (groups !== undefined && expr) {
              value = value !== null ? value : 0;
              evalStr = groups.expr
                .replace(/\b_\b/g, value)
                .replace(/\bs\b/gi, step !== undefined ? step.toString() : '')
                .replace(/\bn\b/gi, selLen.toString())
                .replace(/\bp\b/gi, prevValue.toString())
                .replace(/\bc\b/gi, evalValue)
                .replace(/\ba\b/gi, startValue.toString())
                .replace(/\bi\b/gi, i.toString());
              try {
                evalValue = eval(evalStr);
              } catch (e) {
                vscode.window.showErrorMessage(
                  `[${groups.expr}] Invalid Expression. Exception is: ` + e
                );
                return null;
              }
            } else {
              evalValue = hexNumber ? numToHex(value, numLength) : value;
            }
          }

          if (stopExpr !== undefined && stopExpr) {
            evalStr = stopExpr
              .replace(/\b_\b/g, value)
              .replace(/\bs\b/gi, step !== undefined ? step.toString() : '')
              .replace(/\bn\b/gi, selLen.toString())
              .replace(/\bp\b/gi, prevValue.toString())
              .replace(/\bc\b/gi, evalValue)
              .replace(/\ba\b/gi, startValue.toString())
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
            replace = '';
            if (!ALPHA) {
              if (hexNumber) {
                replace = numToHex(evalValue, numLength);
              } else {
                replace = d3.format(format)(
                  decimals > 0 ? evalValue.toFixed(decimals) : evalValue
                );
              }
            } else {
              let alphaFormat: IntAlphaFormat = {
                padding: alphaformat_padding,
                align: alphaformat_align,
                integer: alphaformat_integer
                  ? Number.parseInt(alphaformat_integer)
                  : 0,
              };

              replace = formatString(alphaFormat, evalValue);
            }
          } else {
            if (hexNumber) {
              replace = String(numToHex(evalValue, numLength));
            } else {
              replace = String(
                decimals > 0 ? evalValue.toFixed(decimals) : evalValue
              );
            }
          }
        }

        values.push(!skip ? String(replace) : String(value));
        prevValue = !skip ? +replace : +value;

        if (!EXPRMODE) {
          if (frequency === 0 || frequencyCounter >= frequency) {
            if (randomTo > 0) {
              value = getRandomNumber(randomStart, randomTo);
            } else {
              value += step !== undefined ? +step : 1;
            }
            repeatCounter++;
            frequencyCounter = 1;
          } else {
            frequencyCounter++;
          }
          if (repeat > 0 && repeatCounter > repeat) {
            value = startValue;
            repeatCounter = 1;
          }
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
        let text = '';

        if (selections !== null) {
          selections.forEach(function (element: vscode.Range, index: number) {
            if (index >= values.length) {
              text = '';
            } else if (index + 1 === selLen && values.length > selLen) {
              const other = !REVERSE
                ? values.slice(index, values.length)
                : values.slice(0, -index - 1);
              text = other.join('\n');
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
