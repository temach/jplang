# Build via creating a fake project because cargo has no option to download only dependencies:
# - https://github.com/rust-lang/cargo/issues/2644
# - https://stackoverflow.com/questions/42130132/can-cargo-download-and-build-dependencies-without-also-building-the-application
#
# alternative (brittle) solution with buildkit: https://vsupalov.com/buildkit-cache-mount-dockerfile/

FROM rust:1.66-bullseye as builder

RUN rustup target add x86_64-unknown-linux-musl

RUN apt-get update
RUN apt-get install musl musl-dev musl-tools && ld-musl-config

WORKDIR /opt/moonspeak/router

# create fake project to build only dependencies, allows docker caching
RUN cargo init .
COPY Cargo.lock ./
COPY Cargo.toml ./
RUN cargo build --target=x86_64-unknown-linux-musl --release

# buld this project, COPY does not update timestamp so must touch at least src/main.rs to trigger re-compile
COPY src/ src/
RUN touch src/main.rs
RUN cargo build --target=x86_64-unknown-linux-musl --release 

FROM alpine:3.17
WORKDIR /opt/moonspeak/router
COPY --from=builder /opt/moonspeak/router/target/x86_64-unknown-linux-musl/release/router ./
CMD ["/opt/moonspeak/router/router"]
