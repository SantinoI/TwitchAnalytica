FROM ubuntu:latest
RUN echo Updating existing packages, installing and upgrading python and pip.

# Install dependencies
RUN apt-get update && apt-get install -y \
    software-properties-common
# RUN add-apt-repository universe
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash
RUN apt-get install nodejs -y
RUN node -v
RUN npm -v

RUN echo Copying the TwitchAnalytica node.js service into a service directory.
COPY ./ nodejs-backend
WORKDIR /nodejs-backend
RUN npm install
EXPOSE 3000
CMD ["node", "index.js"]
