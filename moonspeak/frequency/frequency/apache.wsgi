import os
django_dir = os.path.dirname(os.path.realpath(__file__))
moonspeak_dir = os.path.dirname(django_dir)

# Change working directory so relative paths (and template lookup) work again
os.chdir(moonspeak_dir)

# Add file directory to PYTHONPATH so apache mod_wsgi can find relative imports
# and redirect stdout to stderr, see: https://www.modwsgi.org/en/develop/user-guides/application-issues.html#writing-to-standard-output
import sys
sys.path.append(moonspeak_dir)
sys.path.append(django_dir)
sys.stdout = sys.stderr

# must provide WSGI app as "application" object and init
# here we re-import the default django wsgi config
from wsgi import application
