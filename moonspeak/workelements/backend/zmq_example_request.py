import zmq
import json

context = zmq.Context()

#  Socket to talk to server
print("Connecting to hello world server…")
socket = context.socket(zmq.REQ)
port = 9001
socket.connect(f"tcp://localhost:{port}")

request = json.dumps({
    "kanji": "日",
    "keyword": "day",
}, ensure_ascii=False)

print(f"Sending request {request} …")
socket.send_string(request)

#  Get the reply.
message = socket.recv_string()
print(f"Received reply {request} [ {message} ]")
