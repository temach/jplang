When you set the --import-realm option, the server is going to try to import any realm configuration file from the directory.
Only regular files using the .json extension are read from this directory, sub-directories are ignored.
For the Keycloak containers, the import directory is /opt/keycloak/data/import
When importing a realm at startup, you are able to use placeholders to resolve values from environment ${MY_PASSWORD} variables for any realm configuration.
see: https://www.keycloak.org/server/importExport#_importing_a_realm_during_startup

If you get error "Script upload is disabled":
```
INFO  [org.keycloak.exportimport.singlefile.SingleFileImportProvider] (main) Full importing from file /opt/keycloak/bin/../data/import/moonspeak.json
ERROR [org.keycloak.quarkus.runtime.cli.ExecutionExceptionHandler] (main) ERROR: Failed to start server in (development) mode
ERROR [org.keycloak.quarkus.runtime.cli.ExecutionExceptionHandler] (main) Error details:: java.lang.RuntimeException: Script upload is disabled
```
You can fix your realm json by removing "Default policy" and "Default permission" (which is using JS ...) from the realm json file.
See https://github.com/codecentric/helm-charts/issues/163#issuecomment-1382169610
