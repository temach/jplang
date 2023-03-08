# config priorities see: https://docs.gunicorn.org/en/latest/configure.html
# config options see: https://docs.gunicorn.org/en/latest/settings.html

bind=["moonspeak.localhost:8043"]

# we use the simplest setting: multiple workers, no threads, preload between workers to save memory
# for worker types and quantity see: https://stackoverflow.com/questions/38425620/gunicorn-workers-and-threads
# for preload see: https://www.joelsleppy.com/blog/gunicorn-application-preloading/
preload_app = True
worker_class="sync"
workers=3
timeout=0

# write to console
accesslog = "-"

wsgi_app = "main:app"
