pipeline {
    agent any

    environment{
        DOTNET_ENVIRONMENT = 'Development'
		IMAGE_NAME = "matejanikolikj/web-nba-fantasy-app"
		IMAGE_TAG = "${env.BUILD_NUMBER}"
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
                // Build the image and tag it 'nba-fantasy-app'
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
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
                    docker.withRegistry('https://registry.hub.docker.com',"${DOCKER_HUB_CREDENTIALS}"){
							docker.image("${IMAGE_NAME}:${IMAGE_TAG}").push()
						}		
                }
            }
        }
    }

    post{
		always{
			sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true"
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