Some folders are alternative implementations of the same functionallity.

Some are obsoleted, here is the relationship:
getter          -> router-bottle
hud             -> router-bottle
router          -> router-bottle
router-flask    -> router-bottle
mxgraph         -> grapheditor

When making a new feature:
- handle "iframe connect" message by trying to install relevant observer hacks. The observers are your guests. Care for them.
- All URLs must be relative (because we forcefully insert absolute <base> tag to all root pages)
- Add url link to plus feature
- Add server_name to nginx config
- If on localhost add server_name to /etc/hosts

- For graph feature port number choose 902X where X is incremented by one
- For fullscreen feature port numebr choose 901X where X is incremented by one
- To talk: window.parent.postMessage to talk, ensure that (window != window.top) before sending to avoid infinite loop when running solo
- To listen: add onMessage event handler

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
