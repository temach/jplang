Few rules:
- Any frame (sepcifically background frame) can add css class .deadzone to show that clicks in this area are not actually useful.
- Click on HTML element in frame means that no element was clicked, so we run a check if user was targeting a different frame.
- When a frame is active, all other frames are inactive, and allow all events to pass throught.
- Order in which frames are added is important. Background frame should be added last, otherwise it will steal all events.
- Mouse click event is used currently to switch between active frames. This should be a pointer event in the future.


