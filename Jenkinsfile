pipeline {
    agent any

    parameters {
        string(name: 'DOCKERHUB_IMAGE', defaultValue: 'yourdockerhubusername/shopeasy', description: 'Docker Hub repo, e.g. myuser/shopeasy')
        string(name: 'EC2_HOST', defaultValue: '', description: 'EC2 public IP or DNS, e.g. ec2-1-2-3-4.compute.amazonaws.com')
        string(name: 'APP_PORT', defaultValue: '80', description: 'Host port on EC2 to expose the app on')
    }

    environment {
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
        FULL_IMAGE       = "${params.DOCKERHUB_IMAGE}:${IMAGE_TAG}"
        LATEST_IMAGE     = "${params.DOCKERHUB_IMAGE}:latest"
        DOCKERHUB_CREDS  = 'dockerhub'         // Jenkins credential: Docker Hub username/password
        EC2_SSH_CREDS    = 'slave2'            // Jenkins credential: EC2 SSH private key
        EC2_USER         = 'ec2-user'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${FULL_IMAGE} -t ${LATEST_IMAGE} ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${FULL_IMAGE}
                        docker push ${LATEST_IMAGE}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    if (!params.EC2_HOST?.trim()) {
                        error("EC2_HOST parameter is required to deploy.")
                    }
                }
                sshagent(credentials: [env.EC2_SSH_CREDS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${params.EC2_HOST} '
                            docker pull ${LATEST_IMAGE} &&
                            docker stop shopeasy || true &&
                            docker rm shopeasy || true &&
                            docker run -d --name shopeasy --restart unless-stopped -p ${params.APP_PORT}:80 ${LATEST_IMAGE} &&
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker rmi ${FULL_IMAGE} ${LATEST_IMAGE} || true"
        }
        success {
            echo "Deployed ${LATEST_IMAGE} to http://${params.EC2_HOST}:${params.APP_PORT}"
        }
        failure {
            echo "Pipeline failed. Check stage logs above."
        }
    }
}
