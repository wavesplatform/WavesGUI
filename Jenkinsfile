#!/usr/bin/env groovy

// This is a Jenkins pipeline for building Waves Web Client docker images
// This pipeline requires:
// 'Generic Webhook Trigger' plugin: https://wiki.jenkins.io/display/JENKINS/Generic+Webhook+Trigger+Plugin
// 'List Git Branches Parameter' plugin: https://wiki.jenkins.io/display/JENKINS/List+Git+Branches+Parameter+Plugin
// In the GitHub repo navigate to repository settings > Webhooks and add following WebHook:
// Payload URL: https://<jenkins_web_address>/generic-webhook-trigger/invoke?token=wavesGuiGithubToken
// Content type: application/json
// SSL Verification: enabled
// Events: choose the events you want to trigger build on
// Note: this pipeline uses a private repository as well as private shared library which is not available externally.
// To set up pipeline in Jenkins: New Item > Pipeline > name it > OK > Scroll to Pipeline pane >
// Definition: Pipeline script from SCM, SCM: Git, Repo: 'https://github.com/wavesplatform/WavesGUI.git',
// Lightweight checkout: disabled. Save settings and launch pipeline.

@Library('jenkins-shared-lib')
import devops.waves.*
ut = new utils()
def buildTasks = [:]
def repo_url = 'https://github.com/wavesplatform/WavesGUI.git'

properties []

properties([
    [$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', daysToKeepStr: '14', numToKeepStr: '30']], 
    [$class: 'ScannerJobProperty', doNotScan: false]
    parameters([
        listGitBranches(
            branchFilter: 'origin/(.*)',
            credentialsId: '',
            defaultValue: '',
            name: 'branch',
            listSize: '20',
            quickFilterEnabled: false,
            remoteURL: repo_url,
            selectedValue: 'NONE',
            sortMode: 'DESCENDING_SMART',
            type: 'PT_BRANCH')
        ]),
    
        pipelineTriggers([
            [$class: 'GenericTrigger',
            genericVariables: [
                [ key: 'branch', value: '$.ref', regexpFilter: 'refs/heads/', defaultValue: '' ],
                [ key: 'deleted', value: '$.deleted']],
            regexpFilterText: '$deleted',
            regexpFilterExpression: 'false',
            causeString: "Triggered by GitHub Webhook",
            printContributedVariables: true,
            printPostContent: true,
            token: 'wavesGuiGithubToken' ]
        ])
])

stage('Aborting this build'){
    // On the first launch pipeline doesn't have any parameters configured and must skip all the steps
    if (env.BUILD_NUMBER == '1'){
        echo "This is the first run of the pipeline! It is now should be configured and ready to go!"
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    if (! branch ) {
        echo "Aborting this build. Please run it again with the required parameters specified."
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    else
        echo "Parameters are specified. Branch: ${branch}"
}

if (currentBuild.result == Constants.PIPELINE_ABORTED){
    return
}

timeout(time:20, unit:'MINUTES') {
    node('buildagent'){
        currentBuild.result = Constants.PIPELINE_SUCCESS
        timestamps {
            try {
                currentBuild.displayName = "#${env.BUILD_NUMBER} - ${branch}"

                    stage('Checkout') {
                        sh 'env'
                        step([$class: 'WsCleanup'])
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name:'master']],
                            doGenerateSubmoduleConfigurations: false,
                            extensions: [],
                            submoduleCfg: [],
                            userRemoteConfigs: [[credentialsId: Constants.JENKINSFILES_REPO_CREDS, url: Constants.JENKINSFILES_REPO]]
                        ])
                        checkout([
                            $class: 'GitSCM',
                            branches: [[ name: branch ]],
                            doGenerateSubmoduleConfigurations: false,
                            extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'WavesGUI']],
                            submoduleCfg: [],
                            userRemoteConfigs: [[url: repo_url]]
                        ])
                        sh 'cp -R ./WavesGUI ./build-gui-client/build_desktop_wallet/'
                        sh 'cp -R ./WavesGUI ./build-gui-client/build_web_wallet/'
                        sh 'cp -R ./build-gui-client/nginx ./build-gui-client/build_desktop_wallet/'
                        sh 'cp -R ./build-gui-client/nginx ./build-gui-client/build_web_wallet/'
                        sh 'cp ./build-gui-client/devnet.conf ./build-gui-client/build_desktop_wallet/'
                        sh 'cp ./build-gui-client/devnet.conf ./build-gui-client/build_web_wallet/'
                    }

                ['wallet', 'wallet-electron'].each{ serviceName ->
                    buildTasks["Building " + serviceName] = {
                        dir(Constants.DOCKER_FILE_LOCATION_MAP[serviceName]) {
                            stage("Building " + serviceName) {
                                ut.buildDockerImage('waves/' + serviceName, branch)
                            }
                        }
                    }
                }
                parallel buildTasks
            }
            catch (err) {
                currentBuild.result = Constants.PIPELINE_FAILURE
                println("ERROR caught")
                println(err)
                println(err.getMessage())
                println(err.getStackTrace())
                println(err.getCause())
                println(err.getLocalizedMessage())
                println(err.toString())
             }
            finally{
                ut.notifySlack("docker_builds",
                    currentBuild.result,
                    "Built images:\n${Constants.DOCKER_REGISTRY_ADDRESS - 'https://'}/waves/wallet:${branch}-build${env.BUILD_NUMBER}" +
                    "\n${Constants.DOCKER_REGISTRY_ADDRESS - 'https://'}/waves/wallet-electron:${branch}-build${env.BUILD_NUMBER}")
            }
        }
    }
}
