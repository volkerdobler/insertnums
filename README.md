# Insert Nums

This extension **inserts** or **changes sequential values** in any text file.
It is very helpful if you have to insert numbers or sequences of Ascii chars or want to change some selected numbers/chars based on a javascript expression.

This extension is based on the wonderful sublimetext extension from James Books (https://github.com/jbrooksuk/InsertNums).

I used this extension intensively in the past within sublime text and I could not find such a flexible extension for VSCode. So I rewrote this python extension in javascript and extended it further.

---
## Usage:

The extension implements the command "insertNums" and has a default keybinding of `CTRL ALT DOT` (or `CMD ALT DOT` on Mac). (`DOT` is the period char on the keyboard)

The easiest usage is to insert a sequence of integers, starting with "1" when selecting multiple cursors:

Select multi-cursors

```
|
|
|
|
|
```

Press `CTRL ALT DOT` and `RETURN` (Default is to insert numbers, starting with 1)

```
1
2
3
4
5
```

But the standard behaviour can be changed anytime, as a pop-up window shows up after pressing `CTRL ALT DOT`.

If you want to start with the integer 10 instead of 1, you can do:
`CTRL ALT DOT` and type 10 in the pop-up and press `RETURN` and the result will be:

```
10
11
12
13
14
```

If you add a second number in the pop-up windows after a colon ( : ), you define the steps between the integers.

To insert only every 5th integer, starting from 5, you type:
`CTRL ALT DOT 5:5 RETURN` and the result will be:

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

Sometime, you might need to repeat the sequence after a fixed number of repetitions. *(this feature is new and not included in the original sublimetext extension!)*
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

If this all does not fit your needs, there is an even more complex feature called "expressions" you can use.
Within an expression, you can use some (internal) "variables". (see [Syntax section](#Syntaxes:))

An example could be to insert numbers depending on the previous selection (double the last value). You can type `CTRL ALT DOT 1::p>0?2*p:1` (anything after :: is treated as a javascript expression including the replacement of the internal variables)

```
1
2
4
8
16
```

It is also possible to have a stop criteria after the ``@``.
With the stop criteria, you can stop before filling all selections or (which might be more helpful) to extend the extension.


_Example:_ no selection at all
Start (only current cursor):

```
|
```

After typing `1@_>5`, 5 lines will be inserted *(stopp if current value will be greater than 5)*.

```
1
2
3
4
5
```

If you still need a more complex insertion algorithm, you can use expressions with the `::`.
In these expression, the `_` (underline) represents the current value under a possible selection.

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

But *not only numbers* can be included. The extension is flexible and is able to **handle Ascii chars**, so same selection as above but with `CTRL ALT DOT a RETURN`

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

And "finally" you can use even more complex expressions to insert numbers, floats, strings or boolean.

An example would be: 5 numbers are selected *(| shows cursors)*:

```
1|
2|
3|
4|
5|
```

With the expression: `|if (i+1<=3) {_+100} else {_+200}`, the result will be:
*(for the first 3 numbers 100 will be added, for all others 200 will be added)*

```
101|
102|
103|
204|
205|
```

---
## Syntaxes:

Syntax for **numbers**: 
```
[<start>][:<step>][#<repeat>][~<format>][::<expr>][@<stopexpr>][!]
```
with
```
<start>    ::= any number
<step>     ::= any number (positive oder negative)
<repeat>   ::= any positive number
<format>   ::= [<padding>][<align>][<sign>][#][0] any integer [.<precision>][<type>]
<expr>     ::= any javascript expression, which can include the special chars (see below)
<stopexpr> ::= any javascript expression, which can include the special chars (see below)
!          ::= reverts the output
```

***
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

***
Syntax for **alpha**:
```
<start>[:<step>][#<repeat>][~<format>][w][@<stopexpr>][!]
```

with

```
<start>    ::= any Ascii char
<step>     ::= any number (positive oder negative)
<repeat>   ::= any positive number
<format>   ::= [<padding>][<align>][<integer>]
w          ::= wrap output to one char. So after z, not aa will follow but only a (last char)
<stopexpr> ::= any javascript expression with some special chars, see below
!          ::= reverts the output
```

***
Formatting can be done with the following options:
```
<padding> ::= any char except }
<align>   ::= "<" for left aligned, ">" for right aligned, "=" for centered
<integer> ::= any positive number (length of string)
```

***
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
*Be aware: You can use the stop expression in expressions, but in contrast to numbers, the stop expression can not extend the current selection (just stopp before the end)*

The *"cast"* information for expressions defines the output:

```
i ::= output is an integer
s ::= output is a string (default)
f ::= output is a float number
b ::= output is a boolean
```

***
The following *special chars* can be used and will be replaced by some values:

```
_ ::= current value (before expression)
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
