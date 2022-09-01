Solving the IFrame re-size issue

https://betterprogramming.pub/how-to-automatically-resize-an-iframe-7be6bfbb1214

https://medium.com/@kaptenadhoc/how-to-make-an-iframe-automatically-resize-to-fit-its-content-31593ff54f01


Graph loads all sub components in iframes. 
There is a mapping between component name and its iframe src.

When running on localhost, graph uses the config/graph.xml file, right now the mapping is as follows:
```
<iframe name="workelements" src="http://moonspeak.test:8040">
<iframe name="submit" src="http://moonspeak.test:8041">
<iframe name="suggestions" src="http://moonspeak.test:8042">
<iframe name="synonyms" src="http://moonspeak.test:8043">
```
So make sure to start each sub component on the appropriate port, e.g. workelements on port 8040, submit on port 8041.


When running in docker compose, the config/graph.xml is passed as an environment variable, see docker-compose.override.yml
