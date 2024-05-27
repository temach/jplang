evomaster:
./bin/evomaster  --blackBox true --bbTargetUrl http://localhost:8005  --bbSwaggerUrl file:///opt/moonspeak/openapi.yaml  --outputFormat JS_JEST --maxTime 60s


dev-proxy urlsToWatch:
{
    "http://*/*",
    "https://*/*"
}


schemathesis:
st run --hypothesis-max-examples=500 --verbosity --contrib-openapi-fill-missing-examples --contrib-openapi-formats-uuid  --validate-schema=true --data-generation-method=all --checks=all --base-url http://localhost:8005 --schemathesis-io-telemetry=false /opt/moonspeak/openapi.yaml


BUGS:

=======================================================================
  File "/opt/moonspeak/frequencyapp/views.py", line 57, in result
    status = 200 if not response.error else 400
                        ^^^^^^^^^^^^^^
AttributeError: 'dict' object has no attribute 'error'
[26/May/2024 22:02:04] "GET /result/00e2b621-659d-48b6-8b8a-6ead511a7c9e HTTP/1.1" 500 57309


=======================================================================

    Received: 500
    Documented: 202, 400
[500] Internal Server Error:
    `
    <!doctype html>
    <html lang="en">
    <head>
      <title>Server Error (500)</title>
    </head>
    <body>
      <h1>Server Error (500)</h1><p></p>
    </body>
    </html>`

Reproduce with:

    curl -X POST -H 'Content-Type: application/json' -d '{"usertext": null}' http://localhost:8005/submit

=======================================================================


- Undocumented Content-Type

    Received: text/html; charset=utf-8
    Documented: application/json

[404] Not Found:
    `
    <!doctype html>
    <html lang="en">
    <head>
      <title>Not Found</title>
    </head>
    <body>
      <h1>Not Found</h1><p>The requested resource was not found on this server.</p>
    </body>
    </html>`

Reproduce with:

    curl -X GET http://localhost:8005/result/null

=======================================================================
