# config priorities see: https://docs.gunicorn.org/en/latest/configure.html
# config options see: https://docs.gunicorn.org/en/latest/settings.html

bind=["127.0.0.1:8040"]

preload_app = True

# write to console
accesslog = "-"

wsgi_app = "main:app"
