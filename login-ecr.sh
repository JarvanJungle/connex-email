export AWS_PROFILE=doxa-connex2-dev
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 750655480130.dkr.ecr.ap-southeast-1.amazonaws.com