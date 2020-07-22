FROM ubuntu:latest
RUN echo Updating existing packages, installing and upgrading python and pip.

RUN apt-get update && apt-get install -y software-properties-common
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash
RUN apt-get install nodejs -y
RUN node -v
RUN npm -v

RUN echo Copying the Users api node.js service into a service directory.
COPY ./ users-api
WORKDIR /users-api
RUN npm install
EXPOSE 3000
CMD ["node", "index.js"]
