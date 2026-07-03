pipeline {
    agent any

    parameters {
        string(name: 'DOCKERHUB_IMAGE', defaultValue: 'devopstrainer/shopeasy', description: 'Docker Hub repo, e.g. myuser/shopeasy')
        booleanParam(name: 'PROVISION_EC2', defaultValue: true, description: 'Provision the EC2 build/deploy server via Terraform before deploying')
        string(name: 'EC2_HOST', defaultValue: '', description: 'Existing EC2 public IP/DNS to deploy to. Only used when PROVISION_EC2 is false.')
        string(name: 'APP_PORT', defaultValue: '80', description: 'Host port on EC2 to expose the app on')
    }

    environment {
        IMAGE_TAG        = "${env.BUILD_NUMBER}"
        FULL_IMAGE       = "${params.DOCKERHUB_IMAGE}:${IMAGE_TAG}"
        LATEST_IMAGE     = "${params.DOCKERHUB_IMAGE}:latest"
        DOCKERHUB_CREDS  = 'docker-hub'        // Jenkins credential: Docker Hub username/password
        EC2_SSH_CREDS    = 'slave2'            // Jenkins credential: EC2 SSH private key
        AWS_ACCESS_CRED  = 'AWS_ACCESS_KEY_ID' // Jenkins credential: Secret text
        AWS_SECRET_CRED  = 'AWS_SECRET_ACCESS_KEY' // Jenkins credential: Secret text
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

        stage('Provision EC2 (Terraform)') {
            when { expression { return params.PROVISION_EC2 } }
            steps {
                dir('terraform') {
                    withCredentials([
                        string(credentialsId: env.AWS_ACCESS_CRED, variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: env.AWS_SECRET_CRED, variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh """
                            terraform init -input=false
                            terraform apply -auto-approve -input=false -var="app_port=${params.APP_PORT}"
                        """
                        script {
                            env.EC2_HOST = sh(script: 'terraform output -raw public_ip', returnStdout: true).trim()
                        }
                    }
                }
            }
        }

        stage('Resolve Deploy Target') {
            steps {
                script {
                    if (!params.PROVISION_EC2) {
                        env.EC2_HOST = params.EC2_HOST
                    }
                    if (!env.EC2_HOST?.trim()) {
                        error("No deploy target: enable PROVISION_EC2 or set the EC2_HOST parameter.")
                    }
                    echo "Deploy target: ${env.EC2_HOST}"
                }
            }
        }

        stage('Wait for SSH') {
            steps {
                sshagent(credentials: [env.EC2_SSH_CREDS]) {
                    sh """
                        for i in \$(seq 1 30); do
                            if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${EC2_USER}@${env.EC2_HOST} 'echo ready' 2>/dev/null; then
                                echo "SSH is up"
                                exit 0
                            fi
                            echo "Waiting for SSH on ${env.EC2_HOST}... (\$i/30)"
                            sleep 10
                        done
                        echo "Timed out waiting for SSH"
                        exit 1
                    """
                }
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
                sshagent(credentials: [env.EC2_SSH_CREDS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${env.EC2_HOST} '
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
            echo "Deployed ${LATEST_IMAGE} to http://${env.EC2_HOST}:${params.APP_PORT}"
        }
        failure {
            echo "Pipeline failed. Check stage logs above."
        }
    }
}
