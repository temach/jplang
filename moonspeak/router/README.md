# Getting started

# Step 1

Add moonspeak.test record to your /etc/hosts:
```
127.0.0.1	moonspeak.test
```

# Step 2

Run router:
```
cd ./backend/
MOONSPEAK_DEBUG=True python main.py --port 8001
```

# Step 3

Check that router does the routing correctly:
```
curl -vvv http://moonspeak.test:8001/router/localhost/some_service_name
```


# Optional step 4: add your service

First add a record for any service you want to reach on you localhost machine:
```
127.0.0.1	myservice.moonspeak.test
```

Lets sey you start a service called MYSERVICE on port 8005, then you can reach it via router like this:
```
curl -vvv http://moonspeak.test:8001/router/localhost/hud-demouser-aaa:8002/mypath
```

The above request will result in router sending a request to: `http://hud-demouser-aaa.moonspeak.test:8005/mypath` 

If HTML is returned as response it will be changed to include base tag linking to its root: `http://moonspeak.test:8001/router/localhost/hud-demouser-aaa:8002/mypath`



Rewrite in rust:

html5ever parsers take a TreeSink, they fill it up with data.

kuichi also implements TreeSink:
https://stackoverflow.com/a/35660699
https://github.com/kuchiki-rs/kuchiki/issues/89
A bit about rendering in more details: https://howtorecover.me/vyvod-osnovnoi-vetkoi-analiza-html-v-servo

For XML: https://github.com/servo/html5ever/tree/master/xml5ever/examples


kuichi implementation: https://github.com/kuchiki-rs/kuchiki/blob/master/src/parser.rs
