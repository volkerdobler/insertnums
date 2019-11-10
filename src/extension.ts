// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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
    num = (num - 1) % (Math.pow(26, len) + 1);
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

function getRegexps() {
  let ruleTemplate = {
    integer: "[1-9]\\d* | 0",
    signedint: "[+-]? {integer}",
    pointfloat: "({integer})? \\. \\d+ | {integer} \\.",
    exponentfloat: "(?:{integer} | {pointfloat}) [eE] [+-]? \\d+",
    float: "{pointfloat} | {exponentfloat}",
    numeric: "{integer} | {float}",
    signednum: "[+-]? {numeric}",
    format: "([^}}]?[<>=^])?[-+ ]?\#?0?({integer})?(\\.\\d+)?[bcdeEfFgGnoxX%]?",
    alphastart: "[a-z]+ | [A-Z]+",
    alphaformat: "([^}}]?[<>=^])?({integer})?",
    cast: "[ifsb]",
    expr: ".+?",
    stopexpr: ".+?",
    exprmode: "^(?<cast> {cast})?\\|(~ (?<format> {format})::)? (?<expr> {expr}) (@(?<stopexpr> {stopexpr}))?(?<reverse> !)? $",
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

function status(msg: any) {
  console.log("Meldung: " + msg);
}

function InsertNumsCommand() {
  let document = vscode.window;
  
  document.showInputBox({ prompt: "Enter format string (default: '1:1')", placeHolder: "1:1"})
    .then((result) => {
      
      if (result === undefined) { return null; }
      
      let eingabe = (result.length > 0) ? result : "1:1";
      
      let {insertnum, insertalpha, exprmode} = getRegexps();
      const numreg = new RegExp(insertnum,"gi");
      const alphareg = new RegExp(insertalpha,"gi");
      const modereg = new RegExp(exprmode,"gi");

      let matches = null;
      
      matches = numreg.exec(eingabe) || alphareg.exec(eingabe) || modereg.exec(eingabe);
      
      if (matches === null) {
        vscode.window.showErrorMessage("Format string not valid" + result);
        return null;
      }

      let groups = matches.groups;
      
      const EXPRMODE = ((groups as any).start === undefined);
      const ALPHA = ((groups as any).wrap !== undefined);
      const REVERSE = (groups as any).reverse === "!";
      const step = (groups as any).step !== undefined ? intOrFloat((groups as any).step) : 1;
      const format = (groups as any).format !== undefined ? (groups as any).format : "";
      const expr = (! ALPHA) && (groups as any).expr !== undefined;
      const stop_expr = (groups as any).stopexpr;
      const cast = EXPRMODE && (groups as any).cast !== undefined ? (groups as any).cast : "s";
      const UPPER = ALPHA && (groups as any).start[0] === (groups as any).start[0].toUpperCase();
      const WRAP = ALPHA && (groups as any).wrap === "w";
      
      let vd = 1;
      
      // vscode.window.showInformationMessage("Eingegeben: " + eingabe);
    });

}