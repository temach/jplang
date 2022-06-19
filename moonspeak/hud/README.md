# Getting started

# Create hud.json 

hud.json with content:
```
{
    "urls": [
        "/plus:8010",
        "/router/localhost/graph-demouser-bbb:8011"
    ]
}
```

# Run service with this hud

```
export MOONSPEAK_HUD_CONFIG_JSON="$(cat hud.json)" python main.py --port 8003
```

