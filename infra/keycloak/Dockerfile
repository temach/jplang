# Must use same keycloak version 21.1.2 for builder and final image

FROM quay.io/phasetwo/phasetwo-keycloak:21.1.2 as builder
# do nothing becasue phase-two have already bundled everything


FROM quay.io/keycloak/keycloak:21.1.2

COPY resources/import/* /opt/keycloak/data/import/

COPY --from=builder /opt/keycloak/providers/io.phasetwo.keycloak-keycloak-magic-link-0.15.jar /opt/keycloak/providers/
# COPY keycloak-extensions-demo/magiclink/target/dasniko.keycloak-magiclink.jar  /opt/keycloak/providers/
