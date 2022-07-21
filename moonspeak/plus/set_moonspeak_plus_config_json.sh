#!/bin/sh

# The config is a runtime thing, its decided during deploy.
# therefore can not set the appropriate config.json at build time

if [ -z "$MOONSPEAK_PLUS_CONFIG_JSON" ]; then
  echo 'var.moonspeak_plus_config = "using from filesystem"'
else 
  echo 'var.moonspeak_plus_config = "using from env MOONSPEAK_PLUS_CONFIG_JSON"'
  echo $MOONSPEAK_PLUS_CONFIG_JSON > frontend/config/plus.json
fi
