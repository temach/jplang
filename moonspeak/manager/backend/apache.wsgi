import os
# Change working directory so relative paths (and template lookup) work again
os.chdir(os.path.dirname(__file__))

# Add file directory to PYTHONPATH so apache mod_wsgi can find relative imports 
# and redirect stdout to stderr, see: https://www.modwsgi.org/en/develop/user-guides/application-issues.html#writing-to-standard-output
import sys
sys.path.append(os.path.dirname(__file__))
sys.stdout = sys.stderr

# must provide WSGI app as "application" object and init
from main import APP
application = APP
