# Change Log

All notable changes to this extension:

- 0.0.1
Initial upload

- 0.0.2
Currently, it's a first running version of InsertNums.
You will find a command (CTRL-SHIFT P in windows) "Insert Numbers"

Current feature list (compared to the original python script - see README file):
* Usage with numbers
  * start and step is supported
  * stopexpr is supported
  * format is _not_ supported at the moment
  * expr is still in _test mode_
  
* Usage with the alphabet
  * start and step is supported
  * wrap is supported
  * format is _not_ supported at the moment
  
* Usage with Expressions
  * cast is supported
  * expr is supported
  * stopexpr is supported
  * format is _not_ supported at the moment

- 0.0.3
Fixed bug while default step was 0 - is now 1
Additionally add first format options - integers and floats can be formated
now.

- 0.1.0
Added full formatting for integers and strings.
Added Expression evaluation.
Added icon and additional information about project to package.json

- 0.1.1
Bugfix: expressions will no longer end in an end-less loop