FROM quay.io/keycloak/keycloak:23.0.1

ADD --chown=keycloak:root "https://maven.org/maven2/io/phasetwo/keycloak/keycloak-magic-link/0.22/keycloak-magic-link-0.22.jar" /opt/keycloak/providers/

COPY resources/import/* /opt/keycloak/data/import/
