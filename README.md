# Insert Nums README

This extension helps to insert or change sequential values in any text file.
It is very helpful if you have to insert numbers or sequences of Ascii charts or
want to change some given numbers based on an expression.

This extension is based on the wonderful sublimetext extension from
James Books (https://github.com/jbrooksuk/InsertNums).

I used this extension a lot in the past and therefore, I had to implement this
python extension to javascript to use it within VSCode.

## Usage

The extension implements the command "insertNums" and has a default keybinding of `CTRL ALT .`
(or `CMD ALT .` on Mac). Don't forget the DOT at the end.

The easiest usage is to insert a sequence of integers, starting with "1" when selecting multiple cursors:

Select multi-cursors
```
|
|
|
|
|
```

Press `CTRL ALT DOT` and `RETURN`
```
1
2
3
4
5
```

But the standard behaviour can be changed anytime, as a pop-up window shows up after pressing `CTRL ALT DOT`.

If you want to start with the integer 10 instead of 1 at the same cursors, you can do:
`CTRL ALT DOT` and type 10 in the pop-up and press `RETURN` and the result will be:
```
10
11
12
13
14
```

If you add a second number in the pop-up windows after a colon (:), you define the steps between the integers.
To include only every 5th integer, starting from 5, you can do:
`CTRL ALT DOT 5:5 RETURN` and the result will be:
```
5
10
15
20
25
```

And you can format the values before including them with **~{FORMAT}**,
so an input "`1~05d`" will result in (starting with 1, default step is 1 and format is 5 digits with leading zeros - without the leading zero, blanks will be included):
```
00001
00002
00003
00004
00005
```

If this does not fit your needs, there is an even more complex feature called "expressions" you can use to define each integer.
To define an expression, you can use the following (internal) "variables":
`s`: The value of step (specified in the format query and defaults to 1)
`n`: The number of selections
`i`: Just an integer holding the counter for the iteration; starts at 0 and is increased by 1 in every loop
`_`: The current value before the expression (start + i * step)
`p`: The result of the previously evaluated value (without formatting); 0 for the first value

To insert numbers depending of the previous selection (double the last integer), you can type `CTRL ALT DOT 1::p>0?2*p:1` (anything after :: is treated as a javascript expression)
```
1
2
4
8
16
```

It can also include alpha chars, so same selection as above but
with `CTRL-ALT-DOT` + a + `RETURN`
```
a
b
c
d
e
```

or for alpha: `z~<6` (the : just underline the following spaces and are not visible)
```
:z     :
:aa    :
:ab    :
:ac    :
:ad    :
```

Beside formatting, it is also possible to have a stop criteria with **@{STOPCRITERIA}**.
With the stop criteria, you can stop before filling all selections or (which might be more helpful) to extend the extension. 

Example: we only have one selection:

BEFORE (only one cursor):
```
|
```

AFTER typing `1@_>5`, 5 lines will be inserted.
```
1
2
3
4
5
```

Another feature is to use expressions. Example, you have already a list of numbers and want to add 50 to each number individually.

BEFORE (all 5 numbers are selected, | shows cursors):
```
1|
2|
3|
4|
5|
```

AFTER typing `::_+50`
```
51
52
53
54
55
```

Even more complicated expressions could be used, e.g.:

BEFORE (all 5 numbers are selected, | shows cursors):
```
1|
2|
3|
4|
5|
```

AFTER typing: `|if (i+1<=3) {_+100} else {_+200}`, results between numbers 1 to 3 100 are added, all numbers greater than 3 200 are added.

```
101|
102|
103|
204|
205|
```

## Features

To read all possible features, please look at the original extension 
[here](https://github.com/jbrooksuk/InsertNums). For correct "expressions", the Python syntax  (e.g. "`_+1 if _<5 else _`") needs to be changed to Javascript syntax ("`if (_<5) {_+1} else {_}`").

If I have the time, I will write more in the future.

## Release Notes

All release notes are in the Changelog file

## Special thanks!

This project would not be possible without the original Python code [insertnums](https://github.com/jbrooksuk/InsertNums) from James Brooks .
I also used the [sprintf-js](https://github.com/jbrooksuk/InsertNums) implementation from Alexandru Mărășteanu and [d3-format](https://github.com/d3/d3-format) from the d3 group.

Thanks a lot!
Volker

**Enjoy!**
