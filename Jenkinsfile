#!/usr/bin/env groovy

/*
This is a Jenkins scripted pipeline for building and deploying Waves Web Client docker images
This pipeline requires:
- Active Choices Plug-in: https://wiki.jenkins.io/display/JENKINS/Active+Choices+Plugin
- Generic Webhook Trigger plugin: https://wiki.jenkins.io/display/JENKINS/Generic+Webhook+Trigger+Plugin

In the GitHub repo navigate to repository settings > Webhooks and add following WebHook:
- Payload URL: https://<jenkins_web_address>/generic-webhook-trigger/invoke?token=wavesGuiGithubToken
- Content type: application/json
- SSL Verification: enabled
- Events: choose the events you want to trigger build on

To set up pipeline in Jenkins: New Item > Pipeline > name it > OK > Scroll to Pipeline pane >
- Definition: Pipeline script from SCM, SCM: Git, Repo: 'https://github.com/wavesplatform/WavesGUI.git',
- Lightweight checkout: disabled. Save settings and launch pipeline

Note: this pipeline uses a private repository as well as private shared library which is not available externally.
*/

@Library('jenkins-shared-lib')
import devops.waves.*
ut = new utils()
scripts = new scripts()
def buildTasks = [:]
def deployTasks = [:]
def remote_destination = [:]
def artifactsDir = 'out'
def container_info = [:]
buildTasks.failFast = true
def repo_url = 'https://github.com/wavesplatform/WavesGUI.git'
def deploymentFile = "./kubernetes/waves-wallet-stage-io/deployment.yaml"
def pipeline_tasks = ['build': false, 'deploy': false, 'electron': false]
def pipeline_status = [:]
def pipeline_trigger_token = 'wavesGuiGithubToken'

properties([

    ut.buildDiscarderPropertyObject('14', '30'),

    parameters([
            // action - choose if you want to deploy or build or both
            ut.choiceParameterObject('action', scripts.getActions()),

            // source depends on choice parameter above and dynamically
            // loads either Git repo branches for building or Docker Registry tags for deploy
            ut.cascadeChoiceParameterObject('source', scripts.getBranchesOrTags('waves/wallet', 'Waves', repo_url), 'action', 'PARAMETER_TYPE_SINGLE_SELECT', true),

            // image to deploy from - depends on choice parameter above and used if deploying is specified.
            ut.cascadeChoiceParameterObject('image', scripts.getImages(), 'action'),

            // network is either mainnet, testnet or stagenet - depends on choice parameter above and used if deploying is specified.
            ut.cascadeChoiceParameterObject('network', scripts.getNetworks(), 'action'),

            // destination is a remote server to deploy to - depends on choice parameter above and used if deploying is specified.
            ut.cascadeChoiceParameterObject('destination', scripts.getDestinations(Constants.WAVES_WALLET_PROD_DOMAIN_NAMES, Constants.WAVES_WALLET_STAGE_SERVERS, true), 'action,image'),

            // confirm is an extra check before we deploy to prod
            ut.cascadeChoiceParameterObject('confirm', scripts.getConfirms(), 'action', 'PARAMETER_TYPE_CHECK_BOX'),
        ]),

    // this is a trigger to run a build when hooks from GitHub received
    pipelineTriggers([
        [$class: 'GenericTrigger',
        genericVariables: [
            [ key: 'source', value: '$.ref', regexpFilter: 'refs/heads/', defaultValue: '' ],
            [ key: 'deleted', value: '$.deleted']],
        regexpFilterText: '$deleted',
        regexpFilterExpression: 'false',
        causeString: "Triggered by GitHub Webhook",
        printContributedVariables: true,
        printPostContent: true,
        token: pipeline_trigger_token ]
    ])
])

stage('Aborting this build'){
    // On the first launch pipeline doesn't have any parameters configured and must skip all the steps
    if (env.BUILD_NUMBER == '1'){
        echo "This is the first run of the pipeline! It is now should be configured and ready to go!"
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }

    if (! source ) {
        echo "Aborting this build. Please run it again with the required parameters specified."
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    if (( action.contains('PROD') ) && ! confirm){
        echo "Aborting this build. Deploy to PROD ${network} was not confirmed."
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    else
        echo "Parameters are specified:\n" +
        "action: ${action}\n" +
        "source: ${source}\n" +
        "image: ${image}\n" +
        "destination: ${destination}\n" +
        "network: ${network}"
        if (action.contains('Deploy')) pipeline_tasks['deploy'] = true
        if (action.contains('Build') && ! action.contains('Electron')) pipeline_tasks['build'] = true
        if (action.contains('Electron')) pipeline_tasks['electron'] = true
}

if (currentBuild.result == Constants.PIPELINE_ABORTED){
    return
}

timeout(time:20, unit:'MINUTES') {
    node('buildagent'){
        currentBuild.result = Constants.PIPELINE_SUCCESS
        timestamps {
            wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
                try {
                    currentBuild.displayName = "#${env.BUILD_NUMBER} - ${source} - ${action}"

                    stage('Checkout') {
                        sh 'env'
                        step([$class: 'WsCleanup'])
                        if (action.contains('Build')) {
                            ut.checkoutRelative(source, repo_url, 'WavesGUI', '')

                            sh """
                            mkdir ${artifactsDir}
                            cp -R ./WavesGUI/build-wallet/ ./WavesGUI/build-wallet-desktop/
                            cp -R ./WavesGUI/ ./WavesGUI_tmp/
                            cp -R ./WavesGUI_tmp/ ./WavesGUI/build-wallet/WavesGUI/
                            mv ./WavesGUI_tmp/ ./WavesGUI/build-wallet-desktop/WavesGUI/
                            """
                            if (action.contains('Electron')) {
                                withCredentials([file(credentialsId: 'electron-signing-cert', variable: 'signingCert'),
                                    file(credentialsId: 'electron-mac-signing-cert', variable: 'signingCertMac')]) {
                                    sh "cp '${signingCert}' 'WavesGUI/WavesPlatformLTD.pfx'"
                                    sh "cp '${signingCertMac}' 'WavesGUI/mac_app.p12'"
                                    stash includes: '**', name: 'repo', useDefaultExcludes: false
                                }
                            }
                            source += '.latest'
                        }
                        if (action.contains('Deploy')) {
                            ut.checkoutRelative('master', Constants.KUBERNETES_REPO, 'kubernetes', Constants.KUBERNETES_REPO_CREDS)
                        }
                    }

                    ['wallet', 'wallet-electron'].each{ serviceName ->
                        buildTasks["Building " + serviceName] = {
                            dir(Constants.DOCKERFILE_LOCATION_MAP[serviceName]) {
                                stage("Building " + serviceName) {
                                    pipeline_status["built-${serviceName}"] = false
                                    if (pipeline_tasks['build']) {
                                        def platform = (serviceName == 'wallet') ? 'web' : 'desktop'

                                        // configure nginx template
                                        def waves_wallet_nginx_map = Constants.WAVES_WALLET_NGINX_MAP.clone()
                                        waves_wallet_nginx_map.nginx_platform = "${platform}"
                                        String nginxConfFileContent = ut.replaceTemplateVars('./nginx/default_template.conf', waves_wallet_nginx_map)
                                        writeFile file: './nginx/default.conf', text: nginxConfFileContent

                                        // configure Dockerfile template
                                        def waves_wallet_dockerfile_map = [jenkins_platform: platform, trading_view_token: '$trading_view_token']
                                        String dockerfileConfFileContent = ut.replaceTemplateVars('./Dockerfile_template', waves_wallet_dockerfile_map)
                                        writeFile file: './Dockerfile', text: dockerfileConfFileContent

                                        // configure a page with container_info which
                                        // contains all info about Jenkins build and git parameters
                                        container_info["${serviceName}"] = ""           +
                                            "<p>Job name:       ${env.JOB_NAME}</p>"    +
                                            "<p>Job build tag:  ${env.BUILD_TAG}</p>"   +
                                            "<p>Docker image:   ${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source}</p>" +
                                            "<p>Web environment: \${WEB_ENVIRONMENT}</p>"

                                        writeFile file: './info.html', text: container_info["${serviceName}"]

                                        // copy all the generated text files
                                         sh """
                                            cp ./nginx/default.conf "${env.WORKSPACE}/${artifactsDir}/default.conf-${serviceName}"
                                            cp ./Dockerfile "${env.WORKSPACE}/${artifactsDir}/Dockerfile-${serviceName}"
                                            cp ./info.html "${env.WORKSPACE}/${artifactsDir}/info.html-${serviceName}"
                                            """

                                        // run build
                                        ut.buildDockerImage('waves/' + serviceName, source.split("\\.")[0] + '.latest', "--build-arg trading_view_token=${Constants.WAVES_WALLET_TRADING_VIEW_TOKEN} --build-arg platform=${platform}")
                                        pipeline_status["built-${serviceName}"] = true
                                        ut.notifySlack("docker_builds",
                                            currentBuild.result,
                                            "Built image: ${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source}")
                                    }
                                    else{
                                        org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Building " + serviceName)
                                    }
                                }
                            }
                        }
                    }
                    parallel buildTasks
                    stage("Building Electron") {
                        if (pipeline_tasks['electron']) {
                            node('mobile'){
                                step([$class: 'WsCleanup'])
                                unstash name: "repo"
                                withCredentials([string(credentialsId: 'electron-signing-cert-passphrase', variable: 'signingCertPassphrase'), string(credentialsId: 'electron-mac-signing-cert-passphrase', variable: 'signingMacCertPassphrase')]) {
                                    dir('WavesGUI'){
                                        pipeline_status["built-electron"] = false
                                        sh """
                                        env
                                        export DEBUG=electron-builder
                                        npm ci --unsafe-perm
                                        node_modules/.bin/gulp build --platform desktop --config ./configs/mainnet.json
                                        cd ./dist/desktop/mainnet && npm i --unsafe-perm && cd ../../../
                                        WIN_CSC_LINK=WavesPlatformLTD.pfx \
                                        WIN_CSC_KEY_PASSWORD=${signingCertPassphrase} \
                                        CSC_LINK=mac_app.p12 \
                                        CSC_KEY_PASSWORD=${signingMacCertPassphrase} \
                                        WAVES_CONFIGURATION=mainnet \
                                        ./node_modules/.bin/build -mwl -p never \
                                            --config.directories.app=dist/desktop/mainnet
                                        """
                                        stash includes: '**/mainnet/*.deb, **/mainnet/*.dmg, **/mainnet/*.exe', name: 'electron-clients'
                                        pipeline_status["built-electron"] = true
                                        ut.notifySlack("docker_builds", currentBuild.result, "Built Electron clients")
                                    }
                                }
                            }

                            ['wallet', 'wallet-electron'].each{ serviceName ->
                                org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Building " + serviceName)
                            }
                        }else{
                            org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Building Electron")
                        }
                    }
                    ['wallet', 'wallet-electron'].each{ serviceName ->
                        remote_destination[serviceName] = destination
                        deployTasks["Deploying " + serviceName] = {
                            stage("Deploying " + serviceName) {
                                pipeline_status["deployed-${serviceName}"] = false
                                if (action.contains('Deploy')) {
                                    if (image == serviceName || image =="both" ) {
                                        def waves_wallet_deployment_map = [
                                            domain_name: remote_destination[serviceName].replaceAll("\\.","-"),
                                            network: network,
                                            tag: source,
                                            image: serviceName,
                                            current_date: "'${ut.shWithOutput('date +%s')}'"
                                        ]

                                        if (action.contains('PROD')) {
                                            remote_destination[serviceName] = Constants.WAVES_WALLET_PROD_DOMAIN_NAMES[network + '-' + serviceName]
                                            deploymentFile = "./kubernetes/waves-wallet-${network}/deployment.yaml"
                                            waves_wallet_deployment_map.domain_name = Constants.WAVES_WALLET_PROD_DOMAIN_NAMES[network + '-' + serviceName].replaceAll("\\.","-")
                                        }

                                        // configure deployment template
                                        String deploymentConfFileContent = ut.replaceTemplateVars(deploymentFile, waves_wallet_deployment_map)
                                        def deployment_config = "./${artifactsDir}/${serviceName}-deployment.yaml"
                                        writeFile file: "./${artifactsDir}/${serviceName}/${serviceName}-deployment.yaml", text: deploymentConfFileContent

                                        // deploy container to kuber
                                        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: Constants.AWS_KUBERNETES_KEY, secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                                            sh """
                                                docker run -i --rm \
                                                    -v "${env.WORKSPACE}/${artifactsDir}/${serviceName}":/root/app \
                                                    -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
                                                    -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
                                                    -e KUBE_CLUSTER_NAME="${Constants.AWS_KUBERNETES_KUBE_CLUSTER_NAME}" \
                                                    -e AWS_REGION="${Constants.AWS_KUBERNETES_AWS_REGION}" \
                                                    -e CONFIG_PATH="${serviceName}-deployment.yaml" \
                                                    "${Constants.DOCKER_KUBERNETES_EXECUTOR_IMAGE}"
                                                """
                                        }
                                        pipeline_status["deployed-${serviceName}"] = true
                                        ut.notifySlack("waves-deploy-alerts",
                                            currentBuild.result,
                                            "Deployed image:\n${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source} ${network} to ${remote_destination[serviceName]}")

                                    } else {
                                        org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Deploying " + serviceName)
                                    }

                                }
                                else {
                                    org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Deploying " + serviceName)
                                }
                            }
                        }
                    }
                    parallel deployTasks

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
                    ['wallet', 'wallet-electron'].each{ serviceName ->
                        if (pipeline_tasks['build'] && ! pipeline_status["built-${serviceName}"])
                            ut.notifySlack("docker_builds",
                                currentBuild.result,
                                "Failed to build image: ${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source}")

                        if (pipeline_tasks['deploy'] && !pipeline_status["deployed-${serviceName}"])
                        if (image == serviceName || image =="both" ) {
                            ut.notifySlack("waves-deploy-alerts",
                                    currentBuild.result,
                                    "Failed to deploy image:\n${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source} ${network} to ${remote_destination[serviceName]}")
                        }
                    }
                    if (pipeline_tasks['electron']) {
                        if (! pipeline_status["built-electron"]){
                            ut.notifySlack("docker_builds", currentBuild.result, "Failed to build Electron clients")
                        } else{
                            dir("${artifactsDir}") {
                                unstash "electron-clients"
                            }
                        }
                    }
                    sh "tar -czvf artifacts.tar.gz -C ./${artifactsDir} ."
                    archiveArtifacts artifacts: 'artifacts.tar.gz'
                }
            }
        }
    }
}
