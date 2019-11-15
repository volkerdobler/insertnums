# Insert Nums README

This extension helps to insert or change sequential values in any text file.
It is very helpful if you have to insert numbers or sequences of Ascii charts or
want to change some given numbers based on an expression.

This extension is based on the wonderful sublimetext extension from
James Books (https://github.com/jbrooksuk/InsertNums).

I used this extension a lot in the past and therefore, I had to implement this
python extension to javascript to use it within VSCode.

## Usage

The extension implements the command "insertNums" and has a default keybinding of CTRL-ALT-.
(or CMD-ALT-. on Mac). The keybinding can be changed anytime.

The easiest usage is to insert a sequence of numbers at given selections:

Select multi-cursors
```
|
|
|
|
|
```

`CTRL-ALT-DOT` and `RETURN`
```
1
2
3
4
5
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

The values, which are inserted, can be formated with **~{FORMAT}**,
so an input with "`1~05d`" will result in:
```
00001
00002
00003
00004
00005
```

or for alpha: `z~<6` (the : are just because to underline the folling spaces)
```
:z     :
:aa    :
:ab    :
:ac    :
:ad    :
```

Beside formatting, it is also possible to have a stop criteria.
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

The easiest way of using 
To read the features, please look at the original extension 
[here](https://github.com/jbrooksuk/InsertNums).

If I have the time, I will write more in the future.

## Release Notes

All release notes are in the Changelog file

**Enjoy!**
