FROM ubuntu:latest
RUN echo Updating existing packages, installing and upgrading python and pip.

RUN apt-get update && apt-get install -y \
    software-properties-common
RUN add-apt-repository universe
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3.4 \
    python3-pip

RUN pip3 install --upgrade pip

RUN echo Copying the Classifier python service into a service directory.
COPY ./ classifier
WORKDIR /classifier

RUN echo Installing Python packages listed in requirements.txt
RUN pip3 install -r ./requirements.txt
RUN echo Starting python service...

CMD ["python3", "-u", "main.py"]
