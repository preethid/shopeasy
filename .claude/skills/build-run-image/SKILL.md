---
name: build-run-image
description: Start docker ,   Build and run a Docker image for the application
allowed-tools: Bash, Read, Grep       
#disable-model-inovaction: true
---

Run 'start docker and docker build and docker run -P' to build and run the Docker image for the application

Steps:
1. Start Docker if it is not already running.
2. Run `docker build -t <image_name> .` to build the Docker image
3. Run `docker run -P <image_name>` to run the Docker image and map the exposed ports to random ports on the host machine.
4. Summarize the output of the build and run commands, including the image name, container ID, and the mapped ports.