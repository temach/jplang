from selenium.webdriver import FirefoxOptions, Firefox
options = FirefoxOptions()
options.headless = True
driver = Firefox(options=options)



driver.quit()
