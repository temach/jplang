#!/bin/sh

# The config is a runtime thing, its decided during deploy.
# therefore can not set the appropriate config.json at build time

if [ -z "$MOONSPEAK_HUD_CONFIG_JSON" ]; then
  echo 'using hud config from filesystem' > /dev/stderr
else 
  echo 'tying to use hud confg from env MOONSPEAK_HUD_CONFIG_JSON' > /dev/stderr
  echo "$MOONSPEAK_HUD_CONFIG_JSON" > frontend/dist/ru/config/hud.json || true
  echo "$MOONSPEAK_HUD_CONFIG_JSON" > frontend/dist/en/config/hud.json || true
fi
