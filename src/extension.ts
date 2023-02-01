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

// don't update this module!!! Starting with version 3, it will currently not work anymore!
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
      InsertSequenceCommand({ context, value, version: 'insertseq' });
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

    const historyLimit: number | undefined =
      vscode.workspace.getConfiguration('insertseq').get('historyLimit') ||
      vscode.workspace.getConfiguration('insertnums').get('historyLimit') ||
      0;
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

    alpha = alpha.toLocaleLowerCase();

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

  function isHex(hex: string): boolean {
    return hex.substring(0, 2).toLocaleLowerCase() === '0x';
  }

  function hexToNum(hex: string): number {
    let res = 0;

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

  function formatString(
    format: { fill: string; align: string; length: number; adjust: boolean },
    text: string
  ): string {
    let str: string = text;

    while (str.length < format.length) {
      if (format.align === '<') {
        str += format.fill;
      }
      if (format.align === '>') {
        str = format.fill + str;
      }
      if (format.align === '^') {
        if (str.length % 2 === 0) {
          str = format.fill + str + format.fill;
        } else {
          str = format.adjust ? str + format.fill : format.fill + str;
        }
      }
    }

    return format.length === 0
      ? text
      : // : str.substring(str.length > format.length ? 1 : 0);
        str.substring(0, format.length);
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
        '((?<alphaformat_padding>[^}}])? (?<alphaformat_align>[<>^])(?<alphaformat_correct> [lr])?)? ((?<alphaformat_integer>{integer}))?',
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
      '[insertseq] Extension only available with an active Texteditor'
    );
    return;
  }

  // check if selection is available (should be ;-) )
  const selections = curTextEditor.selections;
  if (!selections) {
    curWindow.showErrorMessage(
      '[insertseq] No selection available! Is Texteditor active?'
    );
    return;
  }

  // default values (can be change via configuration)
  // where to start
  const defaultStart: string = '1';
  // what steps are default
  const defaultStep: string = '1';
  // what type of insertation? (string)
  const defaultCast: string = 's';
  // when a string is centered, but is not perfectly possible, move one character to the left (true) or right (false) - e.g. true => | a  |; false => |  a |
  const defaultCenterString: string = 'l';
  // how many selections do we have?
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

  const config_centerString: string =
    vscode.workspace.getConfiguration('insertseq').get('centerString') ||
    vscode.workspace.getConfiguration('insertnums').get('centerString') ||
    defaultCenterString;

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

    const eingabe =
      result.length > 0 ? result : `${config_start}:${config_step}`;

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
      let errorMsg =
        '[insertseq] No valid regular expression: >' + eingabe + '<. ';
      errorMsg += `DEFAULT: ${config_start}:${config_step} `;
      errorMsg +=
        'Options: NUMBERS:  [<start>][:<step>][~<format>][r[<from>,<to>]|[+?<to>]][*<frequency>][#repetitions][::<expr>][@<stopexpr>][$][!] or ';
      errorMsg +=
        'ALPHA:  <start>[:<step>][~<format>][*<frequency>][#repetitions][@<stopexpr>][w][$][!] or ';
      errorMsg +=
        'SUBSTITUTION: [<cast>]|[~<format>::]<expr>[@<stopexpr>][$][!] ';
      errorMsg +=
        'or (deprecated) HISTORY: !(!|pd+|c|d+ with !! = prev. command, !c = clear history ';
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

    // start value (also re-start for frequency)
    const start = isHex(groups.start)
      ? hexToNum(groups.start).toString()
      : groups.start || config_start;
    const startValue = parseFloat(start);
    // the incrementation
    const step =
      groups.step && groups.step.length > 0
        ? isHex(groups.step)
          ? hexToNum(groups.step).toString()
          : groups.step
        : isHex(config_step)
        ? hexToNum(config_step).toString()
        : config_step || defaultStep;

    // convert all values later to hex number, because we found a hex in the input
    const ISHEXMODE = isHex(groups.start) || isHex(groups.step) || false;
    // check, if random number is used
    const ISRANDOM = groups.random != undefined;
    // upper bound of random number range
    const randomTo =
      groups.random && groups.random[0] === '+'
        ? startValue + (parseFloat(groups.random) || 0)
        : parseFloat(groups.random) || 0;
    // how often should each "insertation" be repeated
    const repeatValue =
      groups.repeat && parseInt(groups.repeat) > 0
        ? parseInt(groups.repeat)
        : Number.MAX_SAFE_INTEGER;
    // what is the max. number of insertation, before starting from beginning?
    const frequencyValue =
      groups.frequency && parseInt(groups.frequency) > 0
        ? parseInt(groups.frequency)
        : 1;
    // is there any "expression" in the input
    const expr = !ALPHA && groups.expr;
    // when to stop the insertation?
    const stopExpr = groups.stopExpr || '';
    // when replacing anything, what cast (typenumber) should be used
    const cast = EXPRMODE && groups.cast ? groups.cast : config_cast;
    // does the alpha input starts with a uppercase letter?
    const UPPER =
      (ALPHA && start && start[0] === start[0].toUpperCase()) || false;
    // wrap alpha input
    const WRAP = ALPHA && groups.wrap === 'w';
    // which format should be used
    const format = groups.format || '';

    // string formatting
    const alphaFormat = {
      fill:
        groups.alphaformat_padding && groups.alphaformat_padding.length === 1
          ? groups.alphaformat_padding
          : ' ',
      align:
        groups.alphaformat_align && groups.alphaformat_align.match(/^[<>^]$/)
          ? groups.alphaformat_align
          : '<',
      length: parseInt(groups.alphaformat_integer) || 0,
      // default: TRUE (l) => | a  |; FALSE (r) => |  a |
      adjust: groups.alphaformat_correct
        ? groups.alphaformat_correct === 'l'
        : config_centerString === 'l',
    };

    // check if RandomTo larger than RandomFrom (startValue) - if not, stop
    if (randomTo > 0 && randomTo <= startValue) {
      curWindow.showErrorMessage(
        `[Random sequence]: From ${startValue} is larger then To: ${randomTo}]!`
      );
      return;
    }

    // all insertations/replacements
    const values: string[] = [];

    const sortSelections: vscode.Selection[] = SORTSEL
      ? quicksort({ arr: selections, low: 0, high: selections.length })
      : selections.slice();

    // stores prev value for expression calculation (of next value)
    let prevValue: number = 0;

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

    // curIteration as number
    let curIterationVal = 0;

    // current new value as string
    let curValueStr: string = value.toString();

    // max. time in the infinit loop (while-loop below)
    const startTime = Date.now();
    const timeLimit = 1000; // max. 1 second in the while loop

    let loopContinue = true;

    while (loopContinue) {
      // no stop expression available and we already have reached the final selection/cursor position => break
      if (stopExpr.length === 0 && selections.length <= curIterationVal) {
        loopContinue = false;
        break;
      }
      if (Date.now() > startTime + timeLimit) {
        curWindow.showInformationMessage(
          `Time limit of ${timeLimit}ms exceeded`
        );
        return;
      }

      let curIterationIndex =
        Math.trunc(curIterationVal / frequencyValue) % repeatValue;

      let selectedText: string = '';
      if (curIterationVal < sortSelections.length) {
        const rangeSel = !REVERSE
          ? sortSelections[curIterationVal]
          : sortSelections[sortSelections.length - 1 - curIterationVal];

        selectedText =
          cast.length === 1
            ? castTable[cast] &&
              castTable[cast](curTextEditor?.document.getText(rangeSel))
            : curTextEditor?.document.getText(rangeSel) || '';
      }

      let exprValueStr: string = '';

      // if expression is available, calculate the expression
      if (expr) {
        // unserscoreValue depends on mode: expremode => selected text as number; else => (start + i * step)
        let underscoreValue = EXPRMODE
          ? parseFloat(selectedText) || 0
          : parseFloat(start) + curIterationIndex * parseFloat(step);

        // tmp Variables, replace internal variables in the expression
        let tmpString = expr
          .replace(/\b_\b/g, underscoreValue.toString())
          .replace(/\bs\b/gi, step.toString())
          .replace(/\bn\b/gi, selLen.toString())
          .replace(/\bp\b/gi, prevValue.toString())
          .replace(/\ba\b/gi, startValue.toString())
          .replace(/\bi\b/gi, curIterationVal.toString());
        try {
          let evalResult = eval(tmpString);
          exprValueStr = evalResult.toString();
        } catch (e) {
          curWindow.showErrorMessage(
            `[${expr}] Invalid Expression. Exception is: ` + e
          );
          return;
        }
      }

      // if stop expression is available, calculate it
      if (stopExpr) {
        // calculate the current value
        let underscoreValue =
          parseFloat(start) + curIterationIndex * parseFloat(step);

        let tmpString = stopExpr
          .replace(/\b_\b/g, underscoreValue.toString())
          .replace(/\bs\b/gi, step.toString())
          .replace(/\bn\b/gi, selLen.toString())
          .replace(/\bp\b/gi, prevValue.toString())
          .replace(/\bc\b/gi, exprValueStr.toString())
          .replace(/\ba\b/gi, startValue.toString())
          .replace(/\bi\b/gi, curIterationVal.toString());
        try {
          let stopResult = eval(tmpString);
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

      let curValueStr: string = '';
      let curValueIsNumber: boolean;

      // get curValue as string
      if (ALPHA) {
        // alpha mode

        let value = alphaToNum(start) + curIterationIndex * parseInt(step);

        // Alpha Mode - get current Step as Alpha-String
        curValueStr = numToAlpha(value, WRAP ? 1 : 0);
        if (UPPER) {
          curValueStr = curValueStr.toLocaleUpperCase();
        }
        curValueIsNumber = false;
      } else {
        // numeric mode or substitution mode

        // if expression is available, calculat value based on expression result
        if (exprValueStr.length > 0) {
          curValueStr = exprValueStr;
          curValueIsNumber = Number.isFinite(+exprValueStr);
        } else {
          // if random option is choosen, value is a random number
          let value: number;
          if (ISRANDOM) {
            value = getRandomNumber(parseFloat(start), randomTo);
          } else {
            value = parseFloat(start) + curIterationIndex * parseFloat(step);
          }

          // when substitution, try to add the current value to the new value
          value += EXPRMODE ? parseFloat(selectedText) || 0 : 0;

          curValueStr = value.toString();
          curValueIsNumber = true;
        }
      }

      // get current value as previous value for next expression
      prevValue = parseFloat(curValueStr) || 0;

      // format string available format curValueStr
      if (format?.length > 0) {
        // if the curValue is a
        if (curValueIsNumber) {
          curValueStr = d3.format(format)(+curValueStr);
        } else {
          curValueStr = formatString(alphaFormat, curValueStr);
        }
      }

      if (ISHEXMODE && Number.isFinite(+curValueStr)) {
        curValueStr = numToHex(+curValueStr);
      }
      values.push(curValueStr.toString());

      curIterationVal += 1;
    }

    if (curTextEditor) {
      if (REVERSE) {
        sortSelections.reverse();
      }
      if (EXPRMODE) {
        // substitution mode
        let curPosition: vscode.Selection = sortSelections[0];
        sortSelections.forEach(function (
          element: vscode.Selection,
          index: number
        ) {
          WSPedit.replace(
            curTextEditor.document.uri,
            new vscode.Range(element.start, element.end),
            values[index]
          );
          curPosition = element;
        });

        let additionalLines: vscode.Position = curPosition.active;

        for (let i = sortSelections.length; i < values.length; i++) {
          if (values[i] != undefined) {
            values[i] = '\n';
          }

          additionalLines = new vscode.Position(
            additionalLines.line + 1,
            additionalLines.character
          );

          WSPedit.insert(
            curTextEditor.document.uri,
            additionalLines,
            values[i]
          );
        }
      } else {
        // insert mode (numberic or alpha)
        let curPosition: vscode.Position;
        let selectionCounter: number = 0;
        values.forEach(function (element: string, index: number) {
          if (sortSelections && sortSelections[index]) {
            curPosition = sortSelections[index].active;
            WSPedit.replace(
              curTextEditor.document.uri,
              new vscode.Range(
                sortSelections[index].start,
                sortSelections[index].end
              ),
              element
            );
            selectionCounter++;
          } else {
            if (curPosition.line + 1 < curTextEditor.document.lineCount) {
              curPosition = new vscode.Position(
                curPosition.line + 1,
                curPosition.character
              );
            } else {
              element = '\n' + element;
            }
            WSPedit.replace(
              curTextEditor.document.uri,
              // lastPosition,
              new vscode.Range(curPosition, curPosition),
              element
            );
          }
        });
        for (let i = selectionCounter; i < sortSelections.length; i++) {
          WSPedit.replace(
            curTextEditor.document.uri,
            new vscode.Range(sortSelections[i].start, sortSelections[i].end),
            ''
          );
        }
      }
      vscode.workspace.applyEdit(WSPedit);
    }
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
