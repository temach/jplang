#!/usr/bin/env bash
docker run --rm --network host --name moonspeak-gateway -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx
