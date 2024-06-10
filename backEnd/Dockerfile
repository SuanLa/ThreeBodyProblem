FROM golang
LABEL authors="Tomcat"
RUN yum -y install vim

USER root
WORKDIR ./root/back
EXPOSE 6750
ENTRYPOINT ["top", "-b"]