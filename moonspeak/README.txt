Some folders are alternative implementations of the same functionallity.

Some are obsoleted, here is the relationship:
getter          -> router-bottle
hud             -> router-bottle
router          -> router-bottle
router-flask    -> router-bottle
mxgraph         -> grapheditor

When making a new feature:
- All frontend requests are relative
- Add url link to plus feature
- Add server_name to nginx config
- If on localhost add server_name to /etc/hosts
- For graph feature port number choose 902X where X is incremented by one
- For fullscreen feature port numebr choose 901X where X is incremented by one


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



