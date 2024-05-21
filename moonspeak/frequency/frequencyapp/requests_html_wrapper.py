"""
Custom wrapper over requests_html because we needed to launch pyppeteer with custom params and requests_html does not allow that.
The custom parameter is executablePath to chromium that is pre-installed in docker image.
It was necessary to override only BaseSession class, but as HTMLSession is what we use in the end, that gets overriden too.

opened a merge request in requests_html on this issue:
"""
from requests_html import BaseSession, HTMLSession
import asyncio
import pyppeteer


class MoonspeakBaseSession(BaseSession):
    def __init__(self, *args, **kwargs):
        super(MoonspeakBaseSession, self).__init__(*args, **kwargs)

    @property
    async def browser(self):
        if not hasattr(self, "_browser"):
            # override browser args to pass default chromium location
            # see: https://github.com/psf/requests-html/blob/075ac162dc62fc532037df0d98954ab840a97516/requests_html.py#L784
            # see: https://github.com/miyakogi/pyppeteer/blob/f5313d0e7f973c57ed31fa443cea1834e223a96c/pyppeteer/launcher.py#L82
            self._browser = await pyppeteer.launch(executablePath="/usr/bin/chromium", ignoreHTTPSErrors=not(self.verify), headless=True, args=['--no-sandbox'])
        return self._browser


# multiple inheritance: due to how super() works
# property "browser" is searched for in HTMLSession then instead of going to BaseSession.browser as normal
# it goes to MoonspeakBaseSession where we have it overriden to pass custom pyppeteer args
class MoonspeakHTMLSession(HTMLSession, MoonspeakBaseSession):
    def __init__(self, **kwargs):
        super(MoonspeakHTMLSession, self).__init__(**kwargs)
