#!/bin/bash
mv $(ls -d ../evaldata ../*/evaldata) .
java -jar ../compiler.jar --eval_jsnice --jsnice_features=ASTREL,NODEFLAG,ARGALIAS,FNAMES --jsnice_infer=NAMES > evalnames.txt
java -jar ../compiler.jar --eval_jsnice --jsnice_features=TYPEREL,TYPEALIAS,TYPERELALIAS --jsnice_infer=TYPES > evaltypes.txt
