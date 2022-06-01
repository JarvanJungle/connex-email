#!/bin/bash


# shellcheck disable=SC1073
deploy_dev() {
  echo "Deploy to DEV environment"
    docker build -t 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com/doxa-connex-dev/email-service:latest .
    docker push 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com/doxa-connex-dev/email-service:latest
}

deploy_stag() {
   echo "Deploy to STAG environment"
    docker build -t 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com/doxa-connex-stag/email-service:latest .
    docker push 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com/doxa-connex-stag/email-service:latest
}

deploy_uat() {
   echo "Deploy to UAT environment"
    docker build -t 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com/doxa-connex-uat/email-service:latest .
    docker push 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com/doxa-connex-uat/email-service:latest
}

case $1 in
"dev")
deploy_dev
  ;;
"stag")
deploy_stag
;;
"uat")
deploy_uat
esac