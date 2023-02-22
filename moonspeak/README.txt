TODO:

1. strange bug with building synonyms, -- DEV_MODE --, htmlLint did not strip 
2. github does not copy tags when forking, and does not copy branches it seems?!

Server setup:
- create server
- redirect DNS to server ip
- configure server swap file to make at least 3GB RAM total (add swap to fstab)
- install docker-compose on server (docker will be pulled as dependency)
- curl the letsencrypt script
- edit letsncyrpt script so it creates a new cert instead of refreshing
- curl the docker-compose-update script
- chmod and run docker-compose-update script


To test localhost installations against open web, use ngrok: https://dashboard.ngrok.com/get-started/setup

Setup for development:

Add the following to your /etc/hosts
```
127.0.0.10	moonspeak.test
127.0.0.20	deploy.moonspeak.test
```

Then run `docker-compose up`, and browse to `http://moonspeak.test` or `http://moonspeak.test/router/localhost/hud-demouser-aaa`

Using different IPs in /etc/hosts for localhost:
https://unix.stackexchange.com/questions/576835/display-webpage-with-unix-domain-socket


Working with container labels:

Display containers with their labels:
```
docker container ls -a --format='{{println . }}'
```

To get the field names (but docker is quite slow in creating the json):
```
docker container ls -a --format='{{json . }}'
```

When making a new feature:
- optionally provide moonspeakConnect function if this iframe wants to install plugins into other iframes (place the plugin in /plugins/ dir in top level router)
- handle "iframe connect" message by trying to install a js plugin by url. The plugins are your guests. Care for them.
- All URLs must be relative (because we forcefully insert absolute <base> tag to all root pages)
- Add url link to plus feature
- Add server_name to nginx config
- If on localhost add server_name to /etc/hosts

- For graph feature port number choose 902X where X is incremented by one
- For fullscreen feature port numebr choose 901X where X is incremented by one
- To talk: window.parent.postMessage to talk, ensure that (window != window.top) before sending to avoid infinite loop when running solo
- To listen: add onMessage event handler

mxGraph save/load diagram:
 * Output:
 * 
 * To produce an XML representation for a diagram, the following code can be
 * used.
 * 
 * (code)
 * var enc = new mxCodec(mxUtils.createXmlDocument());
 * var node = enc.encode(graph.getModel());
 * (end)
 * 
 * This will produce an XML node than can be handled using the DOM API or
 * turned into a string representation using the following code:
 * 
 * (code)
 * var xml = mxUtils.getXml(node);
 * (end)
 * 
 * To obtain a formatted string, mxUtils.getPrettyXml can be used instead.
 * 
 * This string can now be stored in a local persistent storage (for example
 * using Google Gears) or it can be passed to a backend using mxUtils.post as
 * follows. The url variable is the URL of the Java servlet, PHP page or HTTP
 * handler, depending on the server.
 * 
 * (code)
 * var xmlString = encodeURIComponent(mxUtils.getXml(node));
 * mxUtils.post(url, 'xml='+xmlString, function(req)
 * {
 *   // Process server response using req of type mxXmlRequest
 * });
 * (end)
 * 
 * Input:
 * 
 * To load an XML representation of a diagram into an existing graph object
 * mxUtils.load can be used as follows. The url variable is the URL of the Java
 * servlet, PHP page or HTTP handler that produces the XML string.
 * 
 * (code)
 * var xmlDoc = mxUtils.load(url).getXml();
 * var node = xmlDoc.documentElement;
 * var dec = new mxCodec(node.ownerDocument);
 * dec.decode(node, graph.getModel());
 * (end)
 * 
 * For creating a page that loads the client and a diagram using a single
 * request please refer to the deployment examples in the backends.


about the save/open thing:
1) change how the SAVE action works, make it directly save the graph to xml (what the Backend.java example uses, see index.html in /java/)
2) inherit Editor from mxEditor, but there is a problem, because then we should ignore mxEditor's constructor (it again calls createGraph func)
3) add a few mxEditor methods to Editor, because Editor is kind of supposed to be a custom class
4) just use directly mxEditor code, see the Backend.java example when running `ant web-example` in /java/ directory.

Writing plugins that observe when element's value is changed:
https://stackoverflow.com/questions/42427606/event-when-input-value-is-changed-by-javascript

Adding javascript code to send message in the context of iframe:
https://stackoverflow.com/questions/45993415/run-code-in-context-of-frame-window

Get the iframe from event:
event.source.frameElement
https://developer.mozilla.org/en-US/docs/Web/API/Window/frameElement


Handling switching between iframes: 
https://stackoverflow.com/questions/13993398/click-through-sticky-transparent-iframe

https://stackoverflow.com/questions/15080222/add-click-event-to-iframe

We can make each iframe check if they received mouse click that did not touch anything, if it did not touch anything, then they pass it on to next iframe.

https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events#values


Passing events through layers:
https://stackoverflow.com/questions/1009753/pass-mouse-events-through-absolutely-positioned-element

https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events


Elm running in shadow-root also has the problem of "document" being undefined:
https://discourse.elm-lang.org/t/shadowroots-and-browser-dom/7791/3


Only limited info is shared between windows:
https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy


mxGraph api documentation:
overview: https://jgraph.github.io/mxgraph/docs/tutorial.html
javascript: https://jgraph.github.io/mxgraph/docs/js-api/files/index-txt.html



## Inteacting between iframes when running on different ports:

To send post message properly you need to get window object and know its origin.

The simple way to overcome the necessity of knowing the origin: serve everything from the same domain.

Then child windows can access window.parent.location.origin when sending the message.
For cross-origin iframes window.parent.location is SET only, (really it is WRITE only, no reading).

This is a problem when developing locally and running say the graph editor and multiple services on different ports.
Because ports are part of origin, and since they are different means the sending window actually has to know who is who's port numebr exactly.


Right now in every index.html we include the script dev_mode.js which force sets document.domain = location.hostname, this also sets domain port to null.
With this the iframes and their parent can be made same domain.
Then children can read parent's window.parent.location.origin to portMessage correctly like this:
```
    if (window !== window.parent) {
        window.parent.postMessage(message, window.parent.location.origin);
    }
```

However for the message receiver, the event.origin is still set by the browser correctly (ignores document.domain setting), so the check for incoming
messages must be relaxed to be just on the hostname, ignoring the port:
```
    let eventUrl = new URL(event.origin);
    if (eventUrl.hostname !== window.location.hostname) {
        // accept only messages for your domain
        return;
    }
```
 
How do we deal with services that are end user microservices? Because we dont want to embed dev_mode.js into then.
Its not cool to embed dev_mode.js into them becasue they might be using very different build systems (e.g. webpack)
and then each developer must instruct such system to drop dev_mode.js when building for prod. A nuisance.

However at least this nuisance is easy to explain: since you are running on different ports the origins are different
so for development it helps to include a script that erases the domains and of course you dont need this on prod 
So there we are.
To reiterate: same domain gives full access between iframes, so they can read each other's origins.
Also you dont need dev_mode.js if running with "router" service or with default docker-compose.


Another alternative is to add to all services that can be parents (hud and graph) 
a debug feature to route to other services (the functionallity from router).


Another way is to hardcode "moonspeak.test"? Then how would we handle prod? 
Maybe each iframe can extract the hostname part from its location and postMessage with it,
expecting that the parent was run on port 80? Then this introduces a hard requirement on parent, if your
dont start it on default http port, things will brake. This is a strange requirement. 

Consider using MessageChannel that does not need to know targetOrigin (but is safe).
Maybe via a library:
- https://github.com/amplience/message-event-channel
- https://github.com/krakenjs/post-robot



## Observable behaviour and managing interactions

think about this: After some time ANY observable behaivour of your system becomes a part of your API because someone depends on it.

possible solution: when chaning api you must know every single consumer of your api


So the workelements need to only be updated when submit button is pressed,
but synonyms need to be updated when ever a new char is entered into submit's input field.

Right now submit only spits out a message with three fields when a submit button is pressed.

First urge is to make submit spit out a messsage each time a new char is added. 
But this breaks previous behaiviour: submit only send message when submit button was pressed.
In other words, workelements was dependent on submit sending this particular event in this particualr conditions (i.e. only once per work element).
If submit starts sending event when a char is added to submit's input, then workelements will spam the network with database calls and might even beak.

Straightforward solution is to add another field to submit's message to say the reason why this message was send.
I.e. posting this message because submit button was clicked and it was accepted, OR posting this message because char was added to submit's input.
Workelements could distinguish between these two types of messages and handle each one differently. Great it works! 

Alternative, but similar vibe solution: submit can produce an entirely different type of message when a char is appened to its input.
Workelements would ignore this message due to lack of parser, but synonyms could consume it. Then all three iframes would function as intended!

But

This means previous contract with workelements and the arrival of synonyms demanded submit to expose more of its internal state. 
To expose a different aspect of its state in a different place. 
Its like someone asks and you punch two new holes from inside the giant worm (how I see your component).
From these holes events flow like water, and the asker jumps on the worm's back and starts to sip on these events.
Soon other people may also join him.
They will build structures that resonate with the shape of this worm. Their structures will also be based around what fountains of events you expose.
This way your software component consists of some core and a bunch of holes from which events flow.
(Good architecture/design is then good guessing where to place these holes?)

Except your core has properties as well and someone depends on them to stay the same.

When the worm changes direction or changes pace, all the strucures around it break! They are too weak to hold on, and they can not adapt!


Can we solve this with versioning? I.e. lets be able to freeze the worm in time, when we know the location of all event fountains and how to consume them.
But when to increase the version? Much of the observable behaivour that onlookers rely on is not in the mind of developers (not part of official api).
In case above: the version string should tie together versions of submit, workelements, synonyms.
So tie toghether all participating parties, including onlookers of onlookers (second line of event consumers).
And you never know who and how many are onlooking a particular event fountain, because code is static,
and the blessed way to get this info is when code is running (for example: show all listeners of event).

Can we solve this with GraphQL? Adding a layer around the worm which we tell what we want and the layer tries hard to bring it to us.
Well this is only good when pulling events (doing a request), not for push events (becasue what data to push?).
So push events are still basically random fountains which onlookers must subscribe to. The onlookers must do a pull when something interesting is pushed out.
And besides as an onlooker I want to create an event fountain and get push events from it,
but with graphql I will only get replies at checkpoints when the core is ready to process my query. So I would not have access to all the internal state.
And actually core develpers have to codify the internal state, to allow me to query it.


How to speed up the process of making a new event fountain? 
Right now its: 
develper of synonyms detects a problem,
goes to developer of submit, 
submit is modified
workelements breaks...

When programming without messages, building a monolith you can just observe anything at any time. 
Adding a listening to event at any other place is easy. You can become onlooker to anything.

The point of messages is that they define what you see and what you dont. The less is exposed the more freedom core developers have.
i.e. their changes will not break your code. Except, this is not true.
When using messages like monolith programming i.e. "hey john please expose this state here for me", "sure thing bob"
This will lead to re-building a spaghetti of pipes that feed into each other on top of the event fountains (i.e. the same complexity)
i.e. this postMessage in submit is actually here because workelements asked for it (and synonyms is involved), and how do you safely refactor submit then?

Tools have handles and ways to use them. Hammer is for hitting nails. Microscope is for looking at small things. 
Your system (your worm) exposes specific event fountains because that's how its meant to be used.
But hammer can be used a myriad of other ways. Why? Becasue as users we can rely on any observable behaiviour of hammer.
Its event fountain works nicely for us when we are hitting nails, but we can use it for firewood (if it has a wooden handle).


Its a flawed interaction: one party asking to expose an certain property of internal state of the worm
and the worm owner punching a new event fountain from the inside.

For example the asker (assuming a monolith) can monkey patch (i.e. bolt right on top) the exposure of internal state.
Or if messaging he can (after receiving a message) directly read that internal state. 
The problem is that then when the core team changes something, this monkey patching will break. 
The worm changes pace or direction and all the pipes build by onlookers break down.

I see the solution in giving the onlookers the rights to read-only access any internal state (except like secret/private fields)
by injecting code that will read the worm state and create the event fountain for onlookers.
(This is kind of GraphQL, you can inject what fields you need, they will be filled.)
And does not solve the problem: when the worm changes, code paths will change and injected code will break.
But developers of the worm can ensure that code of the onlookers does not break, if they see the context of the code.
If they see where and what is injected by onlookers, then while changing the core they can move the onlooker's code to the next logical place.
Or they can not bother, but there is a choice.

Basically without changing submit, I want to be able to add synonyms component. Synonyms should be able to inject into submit.
The injection mechanism should be provided by submit? I think not, unless its a generic mechanism.
Concerning javascript, synonyms can do addEventListener that will do postMessage when input field is changed.
The catch is that submit is written in Elm.
Therefore synonyms has trouble specifying the exact place where to run its monkey patch injection trojan. 
This trojan ought to sample the internal state, convert it to message and push with postMessage to synonyms.

How to find where and what the onlooker has injected? 
One approach: always-on app like smalltalk vm, where we can get into the current executing context and query the attached listeners
Another approach: log whenever someone uses the injection mechanism (or just ask well behaived onlookers to log it)





## Container sizes

Python:alpine container with ansible and docker-python library:
```
artem@vivoarch ~> docker container commit -m "Test ansible+docker" fe3fc767e186
sha256:b9a0b8053d511bfbaabfb508cd94983d58dc48d6ead7d2c2d34849aed33165d0
artem@vivoarch ~> 
artem@vivoarch ~> docker image ls
REPOSITORY                                                                           TAG               IMAGE ID       CREATED          SIZE
<none>                                                                               <none>            b9a0b8053d51   32 seconds ago   536MB
```

Python:slim container with ansible and docker-python library:
```
artem@vivoarch jplang/moonspeak> docker container commit -m "Test python:slim ansible + docker" 3b17960d39f7 
sha256:b0f4e91ec3ea3b379f783cf8c2b48c26bfeac42e91326eb6b27ce9b26ac25c4b
artem@vivoarch jplang/moonspeak> docker image ls
REPOSITORY                                                                           TAG               IMAGE ID       CREATED         SIZE
<none>                                                                               <none>            b0f4e91ec3ea   2 hours ago     706MB
<none>                                                                               <none>            b9a0b8053d51   2 hours ago     536MB
```

Alpine:latest with manual python, pip ansible and docker-python
```
artem@vivoarch ~> docker commit -m "Raw alpine python + ansible + docker" fb1ce280a883
sha256:13afc64988a1823db7bcdc6662506732904b29803a3e807f4fa36f5fa43f48b4
artem@vivoarch ~> docker image ls
REPOSITORY                                                                           TAG               IMAGE ID       CREATED          SIZE
<none>                                                                               <none>            13afc64988a1   16 seconds ago   96MB
<none>                                                                               <none>            b0f4e91ec3ea   23 hours ago     706MB
<none>                                                                               <none>            b9a0b8053d51   23 hours ago     536MB
```






How to handle multiple js files in dev mode that must be one js file in prod?

One option is to use webpack HtmlPlugin which combines js files and then outputs HTML file with link according to your template
https://webpack.js.org/plugins/html-webpack-plugin/

Another option is to use javascript modules, so index.html loads index.js module.
In dev mode index.js imports other modules, in prod mode index.js is the final bundle
Related question: How to import elm code using javascript "import" keyword?
See: 
- https://www.npmjs.com/package/react-elm-components
- https://blog.boon.gl/2017/11/28/react-elm-wrapper.html
- https://github.com/elm/core/issues/998
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this#function_context
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#other_differences_between_modules_and_standard_scripts
- https://discourse.elm-lang.org/t/undefined-module-when-calling-elm-from-js/1941
The core issue: elm expects "this" to be set to configure exports, but JS modules are 'use strict;' by default and so "this" is not set on elm init.

Another option is to add markup DEV_MODE_BEGIN/DEV_MODE_END to index.html which gulp
will cut out and replace with a single bundle.

Another option is to use file as direcotry with numbered filenames, aka .conf.d/
This has benefit of being an old idea and of how webservers handle directories by returning index.html inside
Also has the benefit/drawback of keeping translations close to the file.

Another option is to use symlinks, instead of proxy files. But must keep in mind the different directories and relative paths.


Remember HTTP is unix filesystem extended over TCP/IP with "GET/POST /some/file " semantics.


How to handle translations and what level of abstraction to use?

Add separate en/ru/kz/test directories with proxy files?
Its pretty complicated anyway. Also this does NOT work with javascript modules option above.
Example: index.html loads javascript module index.js which has relative import to ./some_static.js AND to ../template/elmapp.js
Then you might consider putting index.js into ../templates/ folder,
but this means its src in index.html becomes relative, and so you NEED to add a index.js.toml. Ridiculus.
And so you have all the extra files and folders in the world: templates, static, ru/en/kz/test full of proxy files.

Fix it in webserver side: if file is not found, check if .toml exists, in which case return proxy.
This means normal webservers will not be able to keep up, they are not fit anymore.
Combined with placing /templates/ into /static/ dir, another thing crops up: after .toml check webserver should also check
if file exists in /static/ directory (to accomodate relative paths, you go to /test/index.html but get back proxy from /static/proxy.html)
So the paths get muddled somewhat.

Another option is to use symlinks, instead of proxy files. But must keep in mind the different directories and relative paths.



Basically when writing code the idea is to have "declaration mimic use".
Which is an old idea from C language, see: http://ptgmedia.pearsoncmg.com/images/9780131774292/samplepages/0131774298.pdf
However is it worth it?
On the one hand you want "when you see it you know how to use it" effect, on the other this needlesly comingles two things that are separate:
declaration is one thing, use is another.

The way files are in you web project is one thing, the way they are served over the web is another.
But! HTTP is basically an extension of the unix filesystem, so here its tempting to have "declaration mimic use".
If you can just declare the files in a nice tree, then the user will have an easy time navigating (becasue its 
the same file tree except over http).
Is it?



About web development:

Favour bundling (and build step) because:
- multiple http requests is bad
- code splitting (i.e. load only necessary files per each page)
- build step is necessary anyway for font minification
- newer syntax on older browsers (and typescript etc.)
- itegration between multiple frameworks (e.g. elm and react in same project)


Avoiding bundling:
- simpler code
- build step can be avoided for dev mode, easier to get started for new people
- http2 and http2_server_push make it much faster to handle multiple requests over one tcp connection
- dynamically load js modules as code splitting: https://hackernoon.com/reduce-js-bundle-size-by-dynamically-importing-es6-modules
- link prefetching and preloading: https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ and https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/preload
- changing small part of a bundle means invalidating the whole bundle, but if we avoid bundles cache is not invalidated needlessly!

ideas about avoiding bundling:
- https://javascript.plainenglish.io/what-got-me-writing-vanilla-js-again-2c53756c8a4c
- https://www.nginx.com/blog/nginx-1-13-9-http2-server-push
- https://stackoverflow.com/questions/70041823/what-is-the-overhead-in-nginx-to-proxy-an-http-2-request-to-an-http-1-1-request

Basically without bundles: better caching, worse compression (and small overhead on wire).
With bundles: frequent cache invalidation, better compression.



About deployment:

Really we need to spin up a few default containers when a user tries to access a url. This is like lambda or WSGI processing.
But we use containers becasue its safer and allows for fs manipulations and versioning.
So really the thing that the user leaves is his data. Its in ../userdata/ folder in each container.
Really the userdata is on a docker volume. The volume has tags that tell us how info about it.
- We must know what service is the volume used for: hud, graph, workelements?
- Must know what VERSION of the service the volume was last used with, because then we can handle upgrades and data migration when we run it with a new version of the service.
- Must know who is the user that created the data, i.e. the user's uuid.

The above info can not be stored inside a volume, because that's leaking abstraction to service developers.
The fact that containers for users are started and stopped, means they are easier to upgrade, as there is always downtime.
Also this allows them to have some internal state while they are working.
The containers can be started on first url request, but there needs to be a way to designate a few "always needed"
containers for pre-loading on the very first url request.

Looks like this starting mechanism is really like WSGI. Maybe nginx can handle this? I.e. the gateway 
can run a WSGI program that starts up docker containers?

Maybe each volume should just have a uuid, and somewhere keep a mapping between volume uuid and its metadata?
Maybe metadata can be attached directly to a volume?




About html includes, they are needed for two reasons:
1. for code that is only used in dev mode
2. to template parts for doc.html, index.html, signup.html such as header/footer
3. they should work in dev mode and be absent in prod
They can NOT be done in javascript, because then they will persist to prod.
Also they can NOT be done as Server Side Includes, because then they will persist to prod.
Therefore they have to be done as a build step that does not break dev mode.
Instead of gulp replace, consider using: https://www.npmjs.com/package/gulp-processhtml


Right now links should be relaive in each service, if a link is absolute then it ignores the base tag and goes to root of moonspeak server.
With reedirects the story is similar, but there are three types of reddirects:
- redirects that specify hostname e.g. http://moonspeak.localhost/landing/en/
- redirects without hostname, that start with root slash e.g. /landing/en/
- redirects without hostname, without root slash e.g. landing/en/

nginx by default adds hostname (see "absolute_redirect on").
lighttpd and flask do not add hostname.
For now lets use redirects without hostname.


Alternative python WSGI servers (https://github.com/topics/wsgi-server):
- rust WSGI: https://gitlab.com/tschorr/pyruvate
- rust ASGI: https://github.com/sansyrox/robyn
- C: https://github.com/jamesroberts/fastwsgi
- C: https://github.com/jonashaag/bjoern
- python: https://github.com/cherrypy/cheroot
- apache: https://www.modwsgi.org/en/develop/
