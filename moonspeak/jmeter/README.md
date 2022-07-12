Run jmeter gui to configure the tests:

Then run the CLI:
```
# mkdir test_2022-07-12
# cd test_2022-07-12
# jmeter -n -t ../MoonspeakRecord2.jmx -l samples.jtl -q jmeter.properties -e -o report
```

Note for jmeter -q and -p are very different: https://stackoverflow.com/questions/60204942/exception-generated-when-trying-to-generate-jmeter-html-reports
-q = adds properties
-p = overrides properties file
