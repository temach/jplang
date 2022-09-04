
# Developers

## Running locally

```
# cd backend
# pip install -r requirements.txt
# python main.py
```
Will run by default on port 8043.


To run on specific port use:
```
# python main.py --bind=127.0.0.1:8043
```

Gunicorn will automatically pick up other settings from its config file and run the application.
