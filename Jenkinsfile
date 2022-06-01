pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '5'))
        office365ConnectorWebhooks([
                [
                        startNotification: true,
                        notifySuccess    : true,
                        notifyFailure    : true,
                        timeout          : 30000,
                        url              : "${env.TEAMS_WEBHOOK}"
                ]]
        )
    }

    tools {
        maven "maven3.6.2"
        nodejs "node14"
    }

    environment {
        REGISTRY_URI = 'dkr.ecr.ap-southeast-1.amazonaws.com'
        DEV_USERID = '750655480130'
        DOCS_BUCKET = 'connex-docs/email-service'
        DEV_REPO = 'doxa-connex-dev/email-service'
        UAT_REPO = 'doxa-connex-uat/email-service'
        UAT_USERID = '556257862131'
        STAG_REPO = 'doxa-connex-stag/email-service'
        STAG_USERID = '538871320653'
        PROD_REPO = 'doxa-connex-prod/email-service'
        PROD_USERID = '750655480130' // TODO: Change to production registry
        JAVA_HOME = "/usr/local/jdk-11.0.2" // Use java 11
    }

    stages {
        stage('Set variables') {
            parallel {
                stage('Set variables for STAGE') {
                    when { anyOf { branch 'release/develop'; branch 'release/uat'; branch 'release/stag'; branch 'release/production'; } }
                    steps {
                        script {
                            def myRepo = checkout scm
                            def gitCommit = myRepo.GIT_COMMIT
                            def gitBranch = myRepo.GIT_BRANCH
                            def branchDelimitted = gitBranch.split('/')
                            def stageName = branchDelimitted[1].trim()
                            def shortGitCommit = "${gitCommit[0..8]}"
                            def imageTag = "${shortGitCommit}-${BUILD_NUMBER}"

                            switch (stageName) {
                                case 'develop':
                                    REPO = "${env.DEV_REPO}"
                                    USERID = "${env.DEV_USERID}"
                                    NAMESPACE = "development"
                                    REPLICAS = '1'
                                    KUBE_CREDENTIALS = 'eks_dev_secret'
                                    ECR_CREDENTIALS = 'ecr-credential-development'
                                    CLUSTER = "${env.DEV_CLUSTER}"
                                    break
                                case 'uat':
                                    STAGE = "uat"
                                    CLUSTER = "${env.UAT_CLUSTER}"
                                    REPO = "${env.UAT_REPO}"
                                    NAMESPACE = "uat"
                                    REPLICAS = '1'
                                    KUBE_CREDENTIALS = 'eks_uat_secret'
                                    ECR_CREDENTIALS = 'ecr-credential-uat'
                                    USERID = "${env.UAT_USERID}"
                                    break
                                case 'stag':
                                    STAGE = "stag"
                                    REPO = "${env.STAG_REPO}"
                                    CLUSTER = "${env.STAG_CLUSTER}"
                                    NAMESPACE = "stagging"
                                    REPLICAS = '1'
                                    KUBE_CREDENTIALS = 'eks_stag_secret'
                                    ECR_CREDENTIALS = 'ecr-credential-stag'
                                    USERID = "${env.STAG_USERID}"
                                    break
                                case 'production':
                                    NAMESPACE = "production"
                                    CLUSTER = "${env.PROD_CLUSTER}"
                                    REPLICAS = '2'
                                    KUBE_CREDENTIALS = 'eks_prod_secret'
                                    ECR_CREDENTIALS = 'ecr-credential-prod'
                                    REPO = "${env.DEV_REPO}" // TODO: Update for production
                                    USERID = "${env.DEV_USERID}" // TODO: Update for production
                                    break
                            }
                            DOCKER_IMAGE_REGISTORY = "${USERID}.${REGISTRY_URI}/${REPO}"
                            DOCKER_IMAGE_FULLPATH = "https://${USERID}.${REGISTRY_URI}"
                            IMAGE_TAG = "${imageTag}"
                            DEF_CREDENTIALS = "${ECR_CREDENTIALS}"
                            DEF_KUBE_CREDENTIALS = "${KUBE_CREDENTIALS}"
                            DEF_NAMESPACE = "${NAMESPACE}"
                            DEF_NAMESPACE_QA = "qa"
                            DEF_REPLICAS = "${REPLICAS}"
                        }
                    }
                }
            }
        }

        stage('Build Application') {
      when { anyOf { branch 'release/develop'; branch 'release/uat'; branch 'release/stag'; branch 'release/production';} }
      steps {
        script {
          sh "npm install --production"
        }
      }
    }
    

        stage('Create Docker images & push to ECR') {
            when { anyOf { branch 'release/develop'; branch 'release/uat'; branch 'release/stag'; branch 'release/production'; } }
            steps {
                script {
                    withDockerRegistry(credentialsId: "ecr:ap-southeast-1:${DEF_CREDENTIALS}", toolName: 'docker', url: "${DOCKER_IMAGE_FULLPATH}") {
                        sh "docker build -t ${DOCKER_IMAGE_REGISTORY}:${IMAGE_TAG} ."
                        sh "docker push ${DOCKER_IMAGE_REGISTORY}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Deploy to kubernetes') {
            when { anyOf { branch 'release/develop'; branch 'release/uat'; branch 'release/stag'; branch 'release/production'; } }
            steps {
                withKubeConfig([credentialsId: "${DEF_KUBE_CREDENTIALS}", serverUrl: "${CLUSTER}"]) {
                    sh "sed -i.bak 's#{replicas}#${DEF_REPLICAS}#' ./deployment/app-deployment.yml"
                    sh "sed -i.bak 's#{container_image}#${DOCKER_IMAGE_REGISTORY}:${IMAGE_TAG}#' ./deployment/app-deployment.yml"
                    sh "/usr/local/bin/kubectl apply -f ./deployment/app-deployment.yml --namespace ${DEF_NAMESPACE}"
                    sh "/usr/local/bin/kubectl apply -f ./deployment/service.yml --namespace ${DEF_NAMESPACE}"
//          sh "/usr/local/bin/kubectl rollout status deployment/email-service-deployment --namespace ${DEF_NAMESPACE}"
                }
            }
        }

        stage('Deploy to kubernetes qa') {
            when { anyOf { branch 'release/develop'; } }
            steps {
                withKubeConfig([credentialsId: "${DEF_KUBE_CREDENTIALS}", serverUrl: "${CLUSTER}"]) {
                    sh "sed -i.bak 's#{replicas}#${DEF_REPLICAS}#' ./deployment/app-deployment.yml"
                    sh "sed -i.bak 's#{container_image}#${DOCKER_IMAGE_REGISTORY}:${IMAGE_TAG}#' ./deployment/app-deployment.yml"
                    sh "/usr/local/bin/kubectl apply -f ./deployment/app-deployment.yml --namespace ${DEF_NAMESPACE_QA}"
                    sh "/usr/local/bin/kubectl apply -f ./deployment/service.yml --namespace ${DEF_NAMESPACE_QA}"
                }
            }
        }

    }


      /*** workspace clean up*/
    post { 
        always { 
            cleanWs()
        }
    }

}