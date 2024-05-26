evomaster:
./bin/evomaster  --blackBox true --bbTargetUrl http://localhost:8005  --bbSwaggerUrl file:///opt/moonspeak/openapi.yaml  --outputFormat JS_JEST --maxTime 60s


dev-proxy urlsToWatch:
{
    "http://*/*",
    "https://*/*"
}
