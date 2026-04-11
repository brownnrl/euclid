# euclid-applet — Java 8 environment for running appletviewer with X11 forwarding
#
# Build:  docker build -f Containerfile -t euclid-applet:latest .
# Run:    ./start_java8_container.sh
#
# The project directory is mounted at /usr/src/app at runtime; nothing from
# the repo is baked into this image.  The image only provides:
#   - OpenJDK 8 JDK (appletviewer lives in the JDK, removed in JDK 11+)
#   - X11 client libraries (needed for AWT/Swing GUI to connect to host X server)

FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openjdk-8-jdk \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /usr/src/app

CMD ["bash"]
