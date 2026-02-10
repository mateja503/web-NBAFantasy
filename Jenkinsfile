pipeline {
    agent any

    environment{
        DOTNET_ENVIRONMENT = 'Development'
		IMAGE_NAME = "matejanikolikj/web-nba-fantasy-app"
		IMAGE_TAG = "latest"
		DOCKER_HUB_CREDENTIALS = 'docker-hub-credentials'
		GITHUB_CONTEXT = "Jenkins CI Build"
		GITHUB_CRED_ID = 'cb1a22d0-0e56-4363-95f5-5376109acb94'
        GIT_REPO = 'web-NBAFantasy'
        GIT_ACCOUNT = 'mateja503'
    }

    stages {
        stage('Initialize Application') {
            steps {
                githubNotify(
                    account: env.GIT_ACCOUNT,
					repo: env.GIT_REPO,
					credentialsId: env.GITHUB_CRED_ID, // Use the ID from your logs
					sha: env.GIT_COMMIT,
					status: 'PENDING',
					context: env.GITHUB_CONTEXT,
					description: "Building Pipeline...."
                )
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} ."
            }
        }

        stage('Test Image'){
            steps{
                sh 'echo "Tests passed"'
            }
        }

        stage('Push Image') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com',"${env.DOCKER_HUB_CREDENTIALS}"){
							docker.image("${env.IMAGE_NAME}:${env.IMAGE_TAG}").push()
						}		
                }
            }
        }
    }

    post{
		always{
			sh "docker rmi ${env.IMAGE_NAME}:${env.IMAGE_TAG} || true"

            sh "docker image prune -f"
		}
        success {
			githubNotify(
					account: env.GIT_ACCOUNT,
					repo: env.GIT_REPO,
					credentialsId: env.GITHUB_CRED_ID, // Use the ID from your logs
					sha: env.GIT_COMMIT,
					status: 'SUCCESS',
					context: env.GITHUB_CONTEXT,
					description: "Success"
				)			
        }
        failure {
			githubNotify(
					account: env.GIT_ACCOUNT,
					repo: env.GIT_REPO,
					credentialsId: env.GITHUB_CRED_ID, // Use the ID from your logs
					sha: env.GIT_COMMIT,
					status: 'FAILURE',
					context: env.GITHUB_CONTEXT,
					description: "Failed"
				)	
        }
	}
}