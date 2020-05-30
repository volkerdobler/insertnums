# Insert Nums

This extension **inserts** or **changes sequential values** in any text file.
It is very helpful if you have to insert numbers or sequences of Ascii chars or want to change some selected numbers/chars based on a javascript expression.

This extension is based on the wonderful sublimetext extension from James Books (https://github.com/jbrooksuk/InsertNums).

I used this extension intensively in the past within sublime text and I could not find such a flexible extension for VSCode. So I rewrote this python extension in javascript and extended it further.

---

## Usage:

The extension implements the command "insertNums" and has a default keybinding of `CTRL+ALT+DOT` (or `CMD ALT DOT` on Mac). (`DOT` is the period char on the keyboard)

The easiest usage is to insert a sequence of integers, starting with "1" when selecting multiple cursors:

Select multi-cursors

```
|
|
|
|
|
```

Press `CTRL+ALT+DOT` and `RETURN` (Default is to insert numbers, starting with 1)

```
1
2
3
4
5
```

But the standard behaviour can be changed anytime, as a pop-up window shows up after pressing `CTRL+ALT+DOT`.

If you want to start with the integer 10 instead of 1, you can do:
`CTRL+ALT+DOT` and type 10 in the pop-up and press `RETURN` and the result will be:

```
10
11
12
13
14
```

If you add a second number in the pop-up windows after a colon ( : ), you define the steps between the integers.

To insert only every 5th integer, starting from 5, you type:
`CTRL+ALT+DOT 5:5 RETURN` and the result will be:

```
5
10
15
20
25
```

You can format the values before including them with **~{FORMAT}** (Definition see below),
so an input "`1~05d`" will get (starting with 1, default step is 1 and format is 5 digits with leading zeros - without the leading zero, blanks will be included):

```
00001
00002
00003
00004
00005
```

Sometime, you might need to repeat the sequence after a fixed number of repetitions. _(this feature is new and not included in the original sublimetext extension!)_
Example would be, you want to include the numbers 1, 2, 3 and then start from 1 again.
This can be done with the optional **#{REPEATS}**.
Typing `1#3` results in:

```
1
2
3
1
2
```

Another need I often have, is to repeat the current number in a sequence a couple of times. _(this feature is new and not included in the original sublimetext extension!)_
Example would be, you want to include the numbers 1 three time, 2 three times and 3 times (so 9 in total).
This can be done with the optional **\*{FREQUENCY}**.
Typing `1*3` when 9 multiselections are marked results in:

```
1
1
1
2
2
2
3
3
3
```

It is also possible to have a stop criteria with the option **@{STOPPEXPRESSION}**.
*STOPPEXPRESSION* can be any regular javascript but has the advantage, that some special chars can be used (details in the **SYNTAX** chapter below). 

_Example:_ no multi-selection at all
Start (only current cursor):

```
|
```

After typing `1@_>5`, 5 lines will be inserted _(stopp if current value will be greater than 5)_.

```
1
2
3
4
5
```

And you can combine all of them in one command.
With one cursor selected and the following command `3:2*2#4@i>10` results in:

```
3
3
5
5
7
7
9
9
3
3
5
```

A special sequence of intergers is the random sequence. Insertnums can do see easily with the option **r{UNTIL}** option.
*UNTIL* is either an integer or a plus-char followed by an integer. Without a plus-char the integer determins the maximal value in the random range. If a plus-char is used, the *UNTIL* value will be added to the start value (details syntax see below).

You want to include 5 random number between 15 and 25 (including both). Type the following: `15r25`(or alternative `15r+10`).

Example (5 multi-lines are selected):
```
19
16
15
24
24
```
Each time you run this command, new random numbers will be created.

And there is an even more complex feature called "expressions" you can use. Within such an expression, you can use some (internal) "variables". (see [Syntax section](#Syntaxes:))

An example could be to insert numbers depending on the previous selection (double the last value). You can type `CTRL+ALT+DOT 1::p>0?2*p:1` (anything after :: is treated as a javascript expression including the replacement of the internal variables)

```
1
2
4
8
16
```

And because one "variable" within expressions is the `_` (underline) representing the current value under the selection, you can even manipulate the current values.

_Example:_ you select a list of numbers and want to add 50 to each number individually.

Start (all 5 numbers are selected, | shows cursors):

```
1|
2|
3|
4|
5|
```

After typing `::_+50`

```
51
52
53
54
55
```

But _not only numbers_ can be included with this extension. The extension is flexible and is able to **handle Ascii chars**, so same selection as above but with `CTRL+ALT+DOT a RETURN`

```
a
b
c
d
e
```

or if you want to format the alpha chars leftside: `z~<6` (the : just underline the following spaces and are not visible in the document)

```
:z     :
:aa    :
:ab    :
:ac    :
:ad    :
```

And "finally" you can use even more complex **expressions** to insert numbers, floats, strings or boolean.

An example would be: 5 numbers are selected _(| shows cursors)_:

```
1|
2|
3|
4|
5|
```

With the expression: `|if (i+1<=3) {_+100} else {_+200}`, the result will be:
_(for the first 3 numbers 100 will be added, for all others 200 will be added)_

```
101|
102|
103|
204|
205|
```
---
## (local) History:

As the Inputbox in VSCode does not provide a history option, I implemented a bash-like history for Insertnums.

You can use the following syntax to use it.
```
!!          ::= runs last command (if available)
!<integer>  ::= runs the <integer> last command (if available) (!0 and !! are identical)
!p          ::= shows current history in an vscode output channel.
!c          ::= clears current history
```

The history is local only and will be cleared after closing vscode. But it can be used accross different tabs as long as you do not close the editor completely (to be honest, as long as the extension is not reloaded).

You can even add some additional commands to the history, but it's not possible to edit the history commands.

Example: if you have run the previous command `10:5` and you would like to add a stopp criteria, you can type `!!@i>5` to run the previous command with the new stopp criteria (the new command will be `10:5@i>5`).

New commands (including edited commands) will be saved in the history as new entry. 

The number of commands in the history is not limited, but history will be cleared if extension or vscode is reloaded.

---

## Syntax details:

Syntax for **numbers**:

```
[<start>][:<step>][#<repeat>][*<frequency>][~<format>][r[+]<random>][::<expr>][@<stopexpr>][!]
```

with

```
<start>    ::= any integer
<step>     ::= any integer (positive oder negative)
<repeat>   ::= any positive integer
<frequency>::= any positive integer
<format>   ::= [<padding>][<align>][<sign>][#][0] any integer [.<precision>][<type>]
<random>   ::= any integer (if a plus-char is available, the number will be added to the <start> number)
<expr>     ::= any javascript expression, which can include the special chars (see below)
<stopexpr> ::= any javascript expression, which can include the special chars (see below)
!          ::= reverts the output
```

---

Formatting can be done with the following options:

```
<padding>   ::= any char except }
<align>     ::= "<" for left aligned, ">" for right aligned, "=" for centered, "^" for decimal centered
<sign>      ::= "-", "+" or " " (blank)
#           ::= option causes the “alternate form” to be used for the conversion (see Python documentation)
<precision> ::= any positive number
<type>      ::= any one of the following chars "bcdeEfFgGnoxX%"
```

For more details about the formating possibilities see the [Python mini-language documentation](https://docs.python.org/3.4/library/string.html#format-specification-mini-language)

---

Syntax for **alpha**:

```
<start>[:<step>][#<repeat>][*<frequency>][~<format>][w][@<stopexpr>][!]
```

with

```
<start>    ::= any Ascii char
<step>     ::= any integer (positive oder negative)
<repeat>   ::= any positive integer
<frequency>::= any positive integer
<format>   ::= [<padding>][<align>][<integer>]
w          ::= wrap output to one char. So after z, not aa will follow but only a (last char)
<stopexpr> ::= any javascript expression with some special chars, see below
!          ::= reverts the output
```

---

Formatting can be done with the following options:

```
<padding> ::= any char except }
<align>   ::= "<" for left aligned, ">" for right aligned, "=" for centered
<integer> ::= any positive integer (length of string)
```

---

Syntax for **expressions**:

```
[<cast>]|[~<format>::]<expr>[@<stopexpr>][!]
```

with

```
<cast>      ::= "i", "f", "s", "b"
<format>    ::= same as for numbers
<expr>      ::= any javascript expression including special chars
<stopexpr>  ::= any javascript expression with some special chars, see below
!           ::= reverts the output
```

_Be aware: You can use the stop expression in expressions, but in contrast to numbers, the stop expression can not extend the current selection (just stopp before the end)_

The _"cast"_ information for expressions defines the output:

```
i ::= output is an integer
s ::= output is a string (default)
f ::= output is a float number
b ::= output is a boolean
```

---

The following **_special chars_** can be used and will be replaced by some values:

```
_ ::= current value (before expression or value under current selection)
s ::= value of <step>
n ::= number of selections
p ::= previous value (last inserted)
c ::= current value (only within expressions, includes value after expression)
a ::= value of <start>
i ::= counter, starting with 0 and increased by each inseration
```

## Additional information

For more examples and information, please look at the original extension [here](https://github.com/jbrooksuk/InsertNums).

## Release Notes

All release notes are in the Changelog file

## Special thanks!

This project would not be possible without the original Python code [insertnums](https://github.com/jbrooksuk/InsertNums) from James Brooks .
I also used [d3-format](https://github.com/d3/d3-format) from the d3 group.

Thanks a lot!
Volker

**Enjoy!**
