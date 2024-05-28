evomaster:
/opt/evomaster/bin/evomaster  --blackBox true --bbTargetUrl http://localhost:8005  --bbSwaggerUrl file:///opt/moonspeak/openapi.yaml  --outputFormat JS_JEST --maxTime 60s


dev-proxy urlsToWatch:
{
    "http://*/*",
    "https://*/*"
}


schemathesis:
st run --verbosity --hypothesis-max-examples=1500 --hypothesis-deadline=15000  --max-response-time=2000 --contrib-openapi-fill-missing-examples --contrib-openapi-formats-uuid  --validate-schema=true --data-generation-method=all --checks=all --base-url http://localhost:8005 --schemathesis-io-telemetry=false /opt/moonspeak/openapi.yaml
