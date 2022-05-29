#!/usr/bin/env python3
import logging

import uvicorn
from api import app

logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.INFO)

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=80, reload=False, log_level=logging.INFO)
