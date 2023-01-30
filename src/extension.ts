/*
The extension "InsertSeq" (previous InsertNums) is an adoption of a wonderful plugin for sublimecode from James Brooks.
https://github.com/jbrooksuk/InsertNums

All errors are in my own responsibility and are solely done by
myself.

If you want to contact me, send an E-Mail to
insertseq.extension@dobler-online.com

Volker Dobler
original from May 2020
rewritten February 2023
 */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as path from 'path';

// nicht updaten!!! With version 3 it will not work
import * as d3 from 'd3-format';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "insertseq" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const insertSeq = vscode.commands.registerCommand(
    'extension.insertSeq',
    (value: string = '') => {
      InsertSequenceCommand({ context, value });
    }
  );

  const insertNums = vscode.commands.registerCommand(
    'extension.insertNums',
    (value: string = '') => {
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'The command has changed to insertSeq. insertNums is depreciated but currently still possible. Please change your keymap (CTRL-K CTRL-K)'
      );

      InsertSequenceCommand({ context, value, version: 'insertnums' });
    }
  );

  context.subscriptions.push(insertSeq);
  context.subscriptions.push(insertNums);

  const showSeqHistoryCommand = vscode.commands.registerCommand(
    'extension.insertSeq.showHistory',
    () => {
      insertSequenceHistory({ context });
    }
  );

  const showNumHistoryCommand = vscode.commands.registerCommand(
    'extension.insertNums.showHistory',
    () => {
      vscode.window.showInformationMessage(
        'The command has changed to insertSeq.showHistory. insertNums.showHistory is depreciated but currently still possible. Please change your keymap (CTRL-K CTRL-K)'
      );

      insertSequenceHistory({ context, version: 'insertnums' });
    }
  );

  context.subscriptions.push(showSeqHistoryCommand);
  context.subscriptions.push(showNumHistoryCommand);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  return;
}

function InsertSequenceCommand({
  context,
  value,
  version,
}: {
  context: vscode.ExtensionContext;
  value: string;
  version?: string;
}): void {
  interface IntAlphaFormat {
    padding: string | false;
    align: string | false;
    integer: number | false;
  }

  type valueType = {
    value: string;
  };

  function addHistory({ value }: valueType) {
    let histories: string[] = context.globalState.get('histories', []);

    const itemIndex: number = histories.indexOf(value);
    if (itemIndex !== -1) {
      histories.splice(itemIndex, 1);
    }
    histories.unshift(value);

    const historyLimit: number | undefined = vscode.workspace
      .getConfiguration('insertnums')
      .get('historyLimit');
    if (historyLimit && historyLimit !== 0 && histories.length > historyLimit) {
      histories.splice(historyLimit - 1, histories.length); // Remove excess records
    }

    context.globalState.update('histories', histories);
  }

  function numToAlpha(num: number, len = 0): string {
    let res = '';
    while (num > 0) {
      --num;
      res = String.fromCharCode(97 + (num % 26)) + res;
      num = Math.floor(num / 26);
    }

    if (res.length > len) {
      res = res.slice(-len);
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
          curWindow.showErrorMessage('Wrong hex number: ${hey}');
      }
    }

    return res;
  }

  function formatString(format: IntAlphaFormat, text: string): string {
    // TODO (String formatieren)
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

    return lenStr === 0 ? text : str.substring(0, lenStr);
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

  type LexReturn = {
    [key: string]: RegExp;
  };

  function getValidInputRegExp(): { [key: string]: any } {
    type RuleTemplate = {
      [key: string]: string;
    };

    function hasKey(obj: RuleTemplate, key: string): boolean {
      return key in obj;
    }

    const ruleTemplate: RuleTemplate = {
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
        '((?<format_padding> [^}}])? (?<format_align> [<>^=]))? (?<format_sign> [-+ ])? #? (?<format_filled> 0)? (?<format_integer> {integer})? (\\.(?<format_precision> \\d+))? (?<format_type> [bcdeEfFgGnoxX%])?',
      alphastart: '[a-z]+ | [A-Z]+',
      alphaformat:
        '((?<alphaformat_padding>[^}}])? (?<alphaformat_align>[<>^]))? ((?<alphaformat_integer>{integer}))?',
      cast: '[ifsb]',
      expr: '.+?',
      stopExpr: '.+?',
      exprMode:
        '^(?<cast> {cast})?\\|(~(?<format> {format})::)? (?<expr> {expr}) (@(?<stopExpr> {stopExpr}))? (?<sort_selections> \\$)? (?<reverse> !)?$',
      insertNum:
        '^(?<start> {signedNum})? (:(?<step> {signedNum}))? (\\?(?<random> \\+?[1-9]\\d*))? (\\*(?<frequency> {integer}))? (#(?<repeat> {integer}))? (~(?<format> {format}))? (::(?<expr> {expr}))? (@(?<stopExpr> {stopExpr}))? (?<sort_selections> \\$)? (?<reverse> !)?$',
      insertAlpha:
        '^(?<start> {alphastart})(:(?<step> {signedint}))? (\\*(?<frequency> {integer}))? (#(?<repeat> {integer}))? (~(?<format> {alphaformat})(?<wrap> w)?)? (@(?<stopExpr> {stopExpr}))? (?<sort_selections> \\$)? (?<reverse> !)?$',
    };

    const result: RuleTemplate = {
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

    return { result };
  }

  // check if vscode is available (should be ;-) )
  const curWindow = vscode?.window;
  if (!curWindow) {
    return;
  }

  // check if TextEditor is available/open
  const curTextEditor = curWindow.activeTextEditor;
  if (!curTextEditor) {
    curWindow.showErrorMessage(
      'Extension only available with an active Texteditor'
    );
    return;
  }

  // check if selection is available (should be ;-) )
  const selections = curTextEditor.selections;
  if (!selections) {
    curWindow.showErrorMessage('No selection available! Is Texteditor active?');
    return;
  }

  // default values (can be change via configuration)
  const defaultStart: string = '1';
  const defaultStep: string = '1';
  const defaultCast: string = 's';
  const defaultDecimals: string = '0';

  const maxDecimals = 20;
  const selLen = selections.length;

  // read configuration
  const config_editHistory: boolean =
    vscode.workspace.getConfiguration('insertseq').get('editHistory') ||
    vscode.workspace.getConfiguration('insertnums').get('editHistory') ||
    false;

  const config_start: string =
    vscode.workspace.getConfiguration('insertseq').get('start') ||
    vscode.workspace.getConfiguration('insertnums').get('start') ||
    defaultStart;

  const config_step: string =
    vscode.workspace.getConfiguration('insertseq').get('step') ||
    vscode.workspace.getConfiguration('insertnums').get('step') ||
    defaultStep;

  const config_cast: string =
    vscode.workspace.getConfiguration('insertseq').get('cast') ||
    vscode.workspace.getConfiguration('insertnums').get('cast') ||
    defaultCast;

  const config_decimals: string =
    vscode.workspace.getConfiguration('insertseq').get('decimals') ||
    vscode.workspace.getConfiguration('insertnums').get('decimals') ||
    defaultDecimals;

  // Direct start of command is without value, so the inputbox is shown.
  if (value.length === 0 || config_editHistory) {
    curWindow
      .showInputBox({
        prompt: `Enter format string (default: '${config_start}:${config_step}')`,
        value: value,
        placeHolder: `${config_start}:${config_step}`,
      })
      .then((value) => {
        if (value === '') {
          value = `${config_start}:${config_step}`;
        }
        if (value) {
          renderResult({ result: value });
        }
      });
  } else {
    // called from History with a value
    renderResult({ result: value });
  }

  // the working horse
  function renderResult({ result }: { result: string }): void {
    // historic history functionality (string starts with !)
    if (result.length > 1 && result[0] === '!') {
      let rest = result.substring(1);
      // get saved history of last commands
      let histories = context.globalState.get('histories', []);
      switch (rest) {
        // get previous command
        case '!':
          if (histories.length > 0) {
            result = histories[0];
          } else {
            curWindow.showErrorMessage('[History] No previous command');
            return;
          }
          break;
        // show all previous commands in a Pick-Input
        case 'p':
          if (histories.length > 0) {
            vscode.commands.executeCommand('extension.insertSeq.showHistory');
          } else {
            curWindow.showErrorMessage('[History] Empty');
          }
          return;
        // clear history
        case 'c':
          context.globalState.update('histories', []);
          curWindow.showErrorMessage('[History] Cleared!');
          return;
        default:
          let numRest = Math.abs(parseInt(rest));
          let nachNum = rest.replace(String(numRest), '');
          if (histories.length >= numRest) {
            result = histories[numRest] + (nachNum.length > 0 ? nachNum : '');
            if (nachNum.length > 0) {
              addHistory({ value: result });
            }
          }
      }
    } else {
      addHistory({ value: result });
    }

    const eingabe = result.length > 0 ? result : '1:1';

    // get the valid input regexps for numbers, alpha and substitution mode
    const regResult = getValidInputRegExp();

    let matchNum: RegExpExecArray | null = null;
    let matchAlpha: RegExpExecArray | null = null;
    let matchExpr: RegExpExecArray | null = null;

    matchNum = new RegExp(regResult.result.insertNum).exec(eingabe);
    matchAlpha = new RegExp(regResult.result.insertAlpha).exec(eingabe);
    matchExpr = new RegExp(regResult.result.exprMode).exec(eingabe);

    let groups = matchNum?.groups ||
      matchAlpha?.groups ||
      matchExpr?.groups || { start: config_start, step: config_step };

    if (!matchNum && !matchAlpha && !matchExpr) {
      let errorMsg = 'No valid regular expression: >' + eingabe + '<. ';
      errorMsg += `DEFAULT: ${config_start}:${config_step} `;
      errorMsg +=
        'Options: NUMBERS:  [<start>][:<step>][~<format>][r[<from>,<to>]|[+?<to>]][*<frequency>][#repetitions][::<expr>][@<stopexpr>][$][!] or ';
      errorMsg +=
        'ALPHA:  <start>[:<step>][~<format>][*<frequency>][#repetitions][@<stopexpr>][w][$][!] or ';
      errorMsg +=
        'SUBSTITUTION: [<cast>]|[~<format>::]<expr>[@<stopexpr>][$][!] ';
      errorMsg +=
        'or (deprecated) HISTORY: !(!|pd+|c|d+ with !! = prev. command, !c = clear history ';
      /*       
         (?<start> {signedNum})? (:(?<step> {signedNum}))? (?(?<random> (:(?<rrange> \\d+,d+)|(?<rstop> \\+?\\d+))))? (\\*(?<frequency> {integer}))? (#(?<repeat> {integer}))? (~(?<format> {format}))? (::(?<expr> {expr}))? (@(?<stopExpr> {stopExpr}))? (?<sort_selections> \\$)? (?<reverse> !)?
         
         (?<start> {alphastart})(:(?<step> {signedint}))? (\\*(?<frequency> {integer}))? (#(?<repeat> {integer}))? (~(?<format> {alphaformat})(?<wrap> w)?)? (@(?<stopExpr> {stopExpr}))? (?<sort_selections> \\$)? (?<reverse> !)?
         
         (?<cast> {cast})?\\|(~(?<format> {format})::)? (?<expr> {expr}) (@(?<stopExpr> {stopExpr}))? (?<sort_selections> \\$)? (?<reverse> !)?
      */
      curWindow.showErrorMessage(errorMsg);
      return;
    }

    // check if substitution
    const EXPRMODE = !!matchExpr;
    // check if alpha
    const ALPHA = !!matchAlpha;
    // check if reverse is on
    const REVERSE = groups.reverse === '!';
    // check, if selections/multilines needs to be sorted before insertation
    const SORTSEL = groups.sort_selections === '$';
    // check, if a hex number is inserted or the first selection is
    const HEXNUMBER =
      (groups.start &&
        groups.start.substring(0, 2).toLocaleLowerCase() === '0x') ||
      (selections.length > 0 &&
        curTextEditor?.document
          .getText(selections[0])
          .trim()
          .substring(0, 2) === '0x');
    // the length of the total formated number or 0, if no formating is needed
    const numLength = Number(groups.format_integer) || 0;
    // start value (also re-start for frequency)
    const start = groups.start || config_start;
    const startValue = parseFloat(start);
    // the incrementation
    const step =
      groups.step && groups.step.length > 0
        ? groups.step.substring(0, 2).toLocaleLowerCase() === '0x'
          ? hexToNum(groups.step)
            ? groups.step
            : hexToNum(config_step)
            ? config_step
            : defaultStep
          : groups.step
        : config_step;
    // check, if random number is used
    const ISRANDOM = groups.random != undefined;
    // upper bound of random number range
    const randomTo =
      groups.random && groups.random[0] === '+'
        ? startValue + (parseInt(groups.random) || 0)
        : parseInt(groups.random) || 0;
    // how often should each "insertation" be repeated
    const repeat = parseInt(groups.repeat) || 0;
    // what is the max. number of insertation, before starting from beginning?
    const frequency = parseInt(groups.frequency) || 0;
    // is there any "expression" in the input
    const expr = !ALPHA && groups.expr;
    // when to stop the insertation?
    const stopExpr = groups.stopExpr || '';
    // when replacing anything, what cast (typenumber) should be used
    const cast = EXPRMODE && groups.cast ? groups.cast : config_cast;
    // does the alpha input starts with a uppercase letter?
    const UPPER = ALPHA && start && start[0] === start[0].toUpperCase();
    // wrap alpha input
    const WRAP = ALPHA && groups.wrap === 'w';
    // which format should be used
    const format = groups.format || '';

    // check if RandomTo larger than RandomFrom (startValue) - if not, stop
    if (randomTo > 0 && randomTo <= startValue) {
      curWindow.showErrorMessage(
        `[Random sequence]: From ${startValue} is larger then To: ${randomTo}]!`
      );
      return;
    }

    // TODO: ???
    const alphaformat_padding = groups.alphaformat_padding;
    const alphaformat_align = groups.alphaformat_align;
    const alphaformat_integer = groups.alphaformat_integer;

    // how many decimals are wished? (either because, the step has decimals or the format has decimals)
    const decimals =
      format.length > 0
        ? format.indexOf('.') > -1
          ? format.length - format.indexOf('.') - 1
          : step.indexOf('.') > -1
          ? step.length - step.indexOf('.') - 1
          : parseInt(config_decimals)
        : step.indexOf('.') > -1
        ? step.length - step.indexOf('.') - 1
        : parseInt(config_decimals);

    // all insertations/replacements
    const values: string[] = [];
    // current value as number
    let valCounter: number = 1;

    const sortSelections: vscode.Selection[] = SORTSEL
      ? quicksort({ arr: selections, low: 0, high: selections.length })
      : selections.slice();

    // set current to start sequence as number ("value")
    switch (true) {
      // substitution input - value is not relevant at the moment
      case EXPRMODE:
        break;
      // alpha input
      case ALPHA:
        valCounter = start
          ? alphaToNum(start.toLocaleLowerCase())
          : parseFloat(config_start);
        break;
      // nummeric input
      default:
        let hx = hexToNum(start);
        if (ISRANDOM) {
          if (randomTo && +randomTo > 0) {
            valCounter = getRandomNumber(startValue, randomTo);
          } else {
            if (HEXNUMBER && hx) {
              valCounter = hx;
            }
          }
        } else {
          valCounter = parseFloat(start);
        }
    }

    // TODO ????
    let prevValue = 0;
    let repeatCounter = 1;
    let frequencyCounter = 1;
    // collect all selected ranges to replace them with new values
    let selectedRegions: vscode.Selection[] = [];

    const castTable: { [key: string]: Function } = {
      i: function (value: string): string {
        return value.length > 0 ? parseInt(value).toString() : '0';
      },
      f: function (value: string): string {
        return value.length > 0 ? parseFloat(value).toString() : '0';
      },
      s: function (value: string): string {
        return value;
      },
      b: function (value: string): string {
        return Boolean(value).toString();
      },
    };

    const WSPedit = new vscode.WorkspaceEdit();

    // internal counter to break the infinit loop
    let i = 0;

    let curValueStr: string = value.toString();

    // max. time in the infinit loop (while-loop below)
    const startTime = Date.now();
    const timeLimit = 1000; // max. 1 second in the while loop

    let loopContinue = true;

    while (loopContinue) {
      // no stop expression available and we already have reached the final selection/cursor position => break
      if (stopExpr.length === 0 && selections.length <= i) {
        loopContinue = false;
        break;
      }
      // if (Date.now() > startTime + timeLimit) {
      // curWindow.showInformationMessage(
      // `Time limit of ${timeLimit}ms exceeded`
      // );
      // return;
      // }

      const rangeSel = !REVERSE
        ? sortSelections[i]
        : sortSelections[sortSelections.length - 1 - i];

      const selectedText =
        cast.length === 1
          ? castTable[cast] &&
            castTable[cast](curTextEditor?.document.getText(rangeSel))
          : curTextEditor?.document.getText(rangeSel) || '';

      let exprValue: string = '';

      // if expression is available, calculate the expression
      if (expr) {
        // an expressions is available
        let underscoreValue = EXPRMODE
          ? parseFloat(selectedText) || 0
          : valCounter;
        // tmp Variables not to crash valCounter
        let tmpString = expr
          .replace(/\b_\b/gi, underscoreValue.toLocaleString())
          .replace(/\bs\b/gi, step.toLocaleString())
          .replace(/\bn\b/gi, selLen.toLocaleString())
          .replace(/\bp\b/gi, prevValue.toLocaleString())
          .replace(/\ba\b/gi, startValue.toLocaleString())
          .replace(/\bi\b/gi, i.toLocaleString());
        try {
          let evalResult = eval(tmpString);
          if (parseFloat(evalResult)) {
            exprValue = evalResult.toString();
          } else {
            exprValue = '';
          }
        } catch (e) {
          curWindow.showErrorMessage(
            `[${expr}] Invalid Expression. Exception is: ` + e
          );
          return;
        }
      }

      // if stop expression is available, calculate it
      if (stopExpr) {
        let stopResult: boolean | string;

        let tmpString = stopExpr
          .replace(/\b_\b/g, valCounter.toLocaleString())
          .replace(/\bs\b/gi, step.toLocaleString())
          .replace(/\bn\b/gi, selLen.toLocaleString())
          .replace(/\bp\b/gi, prevValue.toLocaleString())
          .replace(/\bc\b/gi, exprValue.toLocaleString())
          .replace(/\ba\b/gi, startValue.toLocaleString())
          .replace(/\bi\b/gi, i.toLocaleString());
        try {
          stopResult = eval(tmpString);
          if (stopResult && stopResult != '') {
            loopContinue = false;
            break;
          }
        } catch (e) {
          curWindow.showErrorMessage(
            `[${stopExpr}] Invalid Stop Expression. Exception is: ` + e
          );
          return;
        }
      }

      // if there has been an expression, substitute valCounter with this expression
      if (exprValue.length > 0) {
        valCounter = parseFloat(exprValue);
      }

      // now convert valCounter to curValueStr
      if (ALPHA) {
        // Alpha Mode - get current Step as Alpha-String
        curValueStr = numToAlpha(valCounter, WRAP ? 1 : 0);
        if (UPPER) {
          curValueStr = curValueStr.toLocaleUpperCase();
        }
      } else {
        if (EXPRMODE) {
          valCounter += parseInt(selectedText) || 0;
        }
        // numberic or substitution mode
        if (format?.length > 0) {
          curValueStr = d3.format(format)(valCounter);
        } else {
          if (HEXNUMBER) {
            curValueStr = numToHex(valCounter, numLength);
          } else {
            curValueStr =
              decimals > 0
                ? valCounter.toFixed(decimals).toString()
                : valCounter.toString();
          }
        }
      }

      values.push(curValueStr.toLocaleString());
      selectedRegions.push(rangeSel);
      prevValue = valCounter;

      if (!expr) {
        if (frequency === 0 || frequencyCounter >= frequency) {
          if (randomTo > 0) {
            valCounter = getRandomNumber(startValue, randomTo);
          } else {
            valCounter += step ? +step : config_step ? +config_step : 1;
          }
          repeatCounter++;
          frequencyCounter = 1;
        } else {
          frequencyCounter++;
        }
        if (repeat > 0 && repeatCounter > repeat) {
          valCounter = startValue;
          repeatCounter = 1;
        }
        valCounter.toFixed(decimals);
      }

      i += 1;
    }

    if (EXPRMODE) {
      // substitution mode
      if (REVERSE) {
        sortSelections.reverse();
      }
      sortSelections.forEach(function (
        element: vscode.Selection,
        index: number
      ) {
        if (curTextEditor) {
          WSPedit.replace(
            curTextEditor.document.uri,
            new vscode.Range(
              selectedRegions[index].start,
              selectedRegions[index].end
            ),
            values[index]
          );
        }
      });
    } else {
      // insert mode (numberic or alpha)
      let lastPosition: vscode.Position;
      values.forEach(function (element: string, index: number) {
        if (curTextEditor !== undefined) {
          if (selectedRegions && selectedRegions[index]) {
            lastPosition = selectedRegions[index].active;
            WSPedit.replace(
              curTextEditor.document.uri,
              new vscode.Range(
                selectedRegions[index].active,
                selectedRegions[index].active
              ),
              element
            );
          } else {
            lastPosition = new vscode.Position(lastPosition.line + 1, 0);
            WSPedit.insert(curTextEditor.document.uri, lastPosition, element);
          }
        }
      });
    }
    vscode.workspace.applyEdit(WSPedit);
  }
}

function insertSequenceHistory({
  context,
  version,
}: {
  context: vscode.ExtensionContext;
  version?: string;
}) {
  interface QuickPickItem extends vscode.QuickPickItem {
    commandParam: string;
  }

  const histories: QuickPickItem[] = context.globalState
    .get('histories', [])
    .map((item, index) => {
      return {
        label: `[${index + 1}] ${item}`,
        commandParam: `${item}`,
      };
    });

  const newItem: QuickPickItem = {
    label: '[0] new item',
    commandParam: '',
  };
  histories.unshift(newItem);

  const options = {
    placeHolder:
      histories.length > 0
        ? 'InsertSeq History:'
        : 'InsertSeq History: [Empty]',
    onDidSelectItem: (selection: QuickPickItem | string) => {
      let x = 1;
      let y = selection;
    },
  };

  // check if vscode is available (should be ;-) )
  const curWindow = vscode?.window;
  if (!curWindow) {
    return;
  }

  if (histories.length > 0) {
    curWindow.showQuickPick(histories, options).then((item) => {
      vscode.commands.executeCommand(
        'extension.insertSeq',
        item ? item.commandParam : ''
      );
    });
  }
}

function quicksort({
  arr,
  low,
  high,
}: {
  arr: readonly vscode.Selection[];
  low: number;
  high: number;
}): vscode.Selection[] {
  function compare(a: vscode.Selection, b: vscode.Selection): number {
    return a.anchor.line === b.anchor.line
      ? a.anchor.character - b.anchor.character
      : a.anchor.line - b.anchor.line;
  }

  function swap(arr: vscode.Selection[], x: number, y: number) {
    [arr[x], arr[y]] = [arr[y], arr[x]];
  }

  function partition(arr: vscode.Selection[], low: number, high: number) {
    let pivot: vscode.Selection = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (compare(arr[j], pivot) < 0) {
        i++;
        swap(arr, i, j);
      }
    }
    swap(arr, i + 1, high);
    return i + 1;
  }

  let arrreturn: vscode.Selection[] = arr.slice(); // Object.assign([], arr);
  if (low >= high || low < 0) return arrreturn;
  let pIndex = partition(arrreturn, low, high);
  quicksort({ arr: arrreturn, low, high: pIndex - 1 });
  quicksort({ arr: arrreturn, low: pIndex + 1, high });
  return arrreturn;
}
