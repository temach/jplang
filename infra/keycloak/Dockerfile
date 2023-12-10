# Must use same keycloak version 21.1.2 for builder and final image

# FROM quay.io/phasetwo/phasetwo-keycloak:23.0.1 as builder
# do nothing becasue phase-two have already bundled everything

FROM quay.io/keycloak/keycloak:23.0.1

COPY resources/import/* /opt/keycloak/data/import/

ADD --chown=keycloak:root "https://maven.org/maven2/io/phasetwo/keycloak/keycloak-magic-link/0.22/keycloak-magic-link-0.22.jar" /opt/keycloak/providers/
# COPY --from=builder /opt/keycloak/providers/io.phasetwo.keycloak-keycloak-magic-link-0.23.jar /opt/keycloak/providers/
# COPY keycloak-magic-link/target/keycloak-magic-link-0.23-SNAPSHOT.jar /opt/keycloak/providers
# COPY keycloak-extensions-demo/magiclink/target/dasniko.keycloak-magiclink.jar  /opt/keycloak/providers/
