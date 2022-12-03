Start with the latest open source version 4.2.2. The aim is to demangle 20.3.0 by re-using stuff from 4.2.2.
For this use the jsnice.org project: specifically the demangling tool at https://www.sri.inf.ethz.ch/jsnice-artifact
Download older mxClient.js releases, train the jsnice demangling on them, then run mxClient 20.3.0 through the demangling.

This way we get reasonable variable names and nicer source code.

Then using Meld tool diff the demangled 4.2.2 and demangled 20.3.0 to fix any inaccuracies after the jsnice demangling.
During this process also use the original mxClient 4.2.2 which has full comments.
And also use the pretty-print of the minified 20.3.0, because that is our source of truth (even though its mostly unreadable). 


Files related to 4.2.2 release:
- original release with comments for reference: mxClient.4.2.2.js
- minified original release: mxClient.4.2.2.min.js
- demangled by trained jsnice, this is highly similar to demangle of 20.3.0 release: mxClient.4.2.2.demangle.js
- demangled and with stripped comments for clarity: mxClient.4.2.2.demangle.no-comments.js
- demangled, without comments and used by Meld to track 20.3.0 and 4.2.2 merge progress: mxClient.4.2.2.demangle.no-comments.wasted.js


Files related to 20.3.0 release:
- original minified 20.3.0: mxClient.20.3.0.min.js
- firefox pretty-print of minified source, used as reference in difficulty while merging: mxClient.20.3.0.pretty-print.js
- demangled by trained jsnice: mxClient.20.3.0.demangle.js
- demangled and comments stripped, used as reference that can be regenerated: mxClient.20.3.0.demangled.no-comment.js
- demangled, without comments and with manual fixes, this is the final result: mxClient.20.3.0.demangled.no-comment.fixed.js



To get the no-comment version, used C preprocessor:
- https://unix.stackexchange.com/questions/486284/how-to-remove-all-comments-from-a-javascript-file-using-common-linux-command-lin

All files:
- mxClient.4.2.2.js
- mxClient.4.2.2.min.js
- mxClient.4.2.2.demangled.js
- mxClient.4.2.2.demangled.no-comments.js
- mxClient.4.2.2.demangled.no-comments.wasted.js
- mxClient.20.3.0.min.js
- mxClient.20.3.0.pretty-print.js
- mxClient.20.3.0.demangled.js
- mxClient.20.3.0.demangled.no-comment.js
- mxClient.20.3.0.demangled.no-comment.fixed.js
