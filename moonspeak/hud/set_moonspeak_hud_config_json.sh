#!/bin/sh

# The config is a runtime thing, its decided during deploy.
# therefore can not set the appropriate config.json at build time

if [ -z "$MOONSPEAK_HUD_CONFIG_JSON" ]; then
  echo 'var.moonspeak_hud_config = "using from filesystem"'
else 
  echo 'var.moonspeak_hud_config = "using from env MOONSPEAK_HUD_CONFIG_JSON"'
  echo $MOONSPEAK_HUD_CONFIG_JSON > frontend/config/hud.json
fi
