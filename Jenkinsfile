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


@Library('jenkins-shared-lib') _
import devops.waves.*
ut = new utils()
scripts = new scripts()
wallet = new wallet()

def buildTasks = [:]
buildTasks.failFast = true
def deployTasks = [:]
def electronContainerTasks = [:]
def electronMacTasks = [:]
def electronGlobalTasks = [:]
def winElectronBuildTasks = [:]
def macElectronBuildTasks = [:]
def source = false
def action = false
def repoUrl = 'https://github.com/wavesplatform/WavesGUI.git'
def deploymentFile = "./kubernetes/waves-wallet-stage-io/deployment.yaml"
def pipelineTriggerToken = 'wavesGuiGithubToken'
def gitDescribeTag = false
def windowsSingCertName = 'WavesPlatformLTD.pfx'
def macSingCertName = 'mac_app.p12'
def itemTemplate = [niceName: false, platform: false, dockerTag: false, containerInfo: false, buildTask: false, buildSuccess: false, buildArtifacts: false, deployTask: false, deploySuccess: false, deployArtifacts: false, remoteDestination: false]
def items = [wallet: itemTemplate.clone(), walletElectron: itemTemplate.clone(), electron: itemTemplate.clone()]
def slackChannelBuild = 'docker_builds'
def slackChannelDeploy = "waves-deploy-alerts"
items['wallet'].platform = 'web'
items['wallet'].niceName = 'wallet'
items['electron'].niceName = 'electron'
items['walletElectron'].platform = 'desktop'
items['walletElectron'].niceName = 'wallet-electron'

def branchesOrTagsScript(String imageName, String repoUrl){
    return """
        if (binding.variables.get('action') == 'Deploy to stage' || binding.variables.get('action').contains('PROD')) {
            ${getDockerTagsScript(imageName, Constants.WAVES_DOCKER_REGISTRY_CREDS, 'Waves')}
        } else {
            ${getGitBranchesScript(repoUrl)}
        }
    """
}

properties([

    ut.buildDiscarderPropertyObject('14', '30'),

    parameters([
            // action - choose if you want to deploy or build or both
            ut.choiceParameterObject('action', "return ['Build', 'Build and Deploy to stage', 'Deploy to stage', 'Deploy PROD mainnet', 'Deploy PROD testnet', 'Deploy PROD stagenet', 'Build Electron']"),

            // source depends on choice parameter above and dynamically
            // loads either Git repo branches for building or Docker Registry tags for deploy
            ut.cascadeChoiceParameterObject('source', branchesOrTagsScript('waves/wallet', repoUrl), 'action', 'PARAMETER_TYPE_SINGLE_SELECT', true),

            // image to deploy from - depends on choice parameter above and used if deploying is specified.
            ut.cascadeChoiceParameterObject('image', wallet.getImages(), 'action'),

            // network is either mainnet, testnet or stagenet - depends on choice parameter above and used if deploying is specified.
            ut.cascadeChoiceParameterObject('network', wallet.getNetworks(), 'action'),

            // destination is a remote server to deploy to - depends on choice parameter above and used if deploying is specified.
            ut.cascadeChoiceParameterObject('destination', wallet.getDestinations(wallet.wavesWalletProdDomainNames(), wallet.wavesWalletStageServers(), true), 'action,image'),

            // confirm is an extra check before we deploy to prod
            ut.cascadeChoiceParameterObject('confirm', wallet.getConfirms(), 'action', 'PARAMETER_TYPE_CHECK_BOX'),
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
        token: pipelineTriggerToken ]
    ])
])

stage('Build info'){
    echo "Parameters specified: ${params}"
    action = params.action
    if ((params.action.contains('PROD') && ! params.confirm) || ! params.source || ! params.source.length() || params.source.contains('Please select parameter')){
        if (params.action.contains('PROD'))
            echo "Aborting this build. Deploy to PROD ${params.network} was not confirmed."
        else
            echo "Aborting this build. Variable 'source' not defined."
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    source = params.source
    if (action.contains('Electron')){
        items['electron'].buildTask = true
    }
    else if (action.contains('Build')){
        items.each{
            if (it.key != 'electron'){
                item = it.value
                item.buildTask = true
                item.dockerTag = source + '.latest'
            }
        }
    }
    if (action.contains('Deploy')){
        items.each{
            item = it.value
            if (!action.contains('Build'))
                item.dockerTag = source
            if (it.key != 'electron' && (item.niceName == params.image || params.image == "both"))
                item.deployTask = true
        }
    }
}
if (currentBuild.result == Constants.PIPELINE_ABORTED){
    return
}
println items
timeout(time:40, unit:'MINUTES') {
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
                            gitCheckout(branch: source, url: repoUrl, relativeTargetDir: 'WavesGUI')


                            dir ('WavesGUI'){
                                gitDescribeTag = ut.shWithOutput("git describe --tags")
                            }

                            if (action.contains('Electron')) {
                                dir ('WavesGUI'){
                                    withCredentials([
                                            file(credentialsId: 'electron-signing-cert', variable: 'signingCert'),
                                            file(credentialsId: 'electron-mac-signing-cert', variable: 'signingCertMac'),
                                            string(credentialsId: 'electron-signing-cert-passphrase', variable: 'winCertPass'),
                                            string(credentialsId: 'electron-mac-signing-cert-passphrase', variable: 'macCertPass')
                                    ]){
                                        sh "cp '${signingCert}' '${windowsSingCertName}'"
                                        sh "cp '${signingCertMac}' '${macSingCertName}'"
                                        writeFile file: './jenkinsBuildElectronScript.sh', text: wallet.wavesElectronInstallScript(windowsSingCertName, winCertPass, macSingCertName, macCertPass)
                                        sh "chmod 700 '${windowsSingCertName}' '${macSingCertName}' 'jenkinsBuildElectronScript.sh'"
                                    }

                                }
                            }

                            stash includes: 'WavesGUI/**,', name: 'repo'

                            // this two lines are for compatibility with the branches that already exist
                            // after 'build-wallet' files are replaced in all branches in the repo - these checks can be removed
                            // and commented code should be uncommented
                            //  once 'newApproach' is merged to dev/master - rename the branch in the string below:
                            gitCheckout(branch: 'newApproach', url: repoUrl, relativeTargetDir: 'newTemplate')

                            dir('newTemplate/build-wallet'){
                                stash includes: '**', name: 'docker', useDefaultExcludes: false
                            }

                            // dir('WavesGUI/build-wallet'){
                            //     stash includes: '**', name: 'docker', useDefaultExcludes: false
                            // }
                        }
                        if (action.contains('Deploy')) {
                            gitCheckout(url: Constants.KUBERNETES_REPO, relativeTargetDir: 'kubernetes', repoCreds: Constants.KUBERNETES_REPO_CREDS)
                        }

                    }
                    items.each{
                        def item = it.value
                        buildTasks["Building " + item.niceName] = {
                            stage("Building " + item.niceName) {
                                dir(it.key){
                                    if (item.buildTask) {
                                        if (it.key == 'electron'){
                                            item.buildArtifacts = it.key + '-electronArtifacts-'
                                            electronGlobalTasks['container']={
                                                node("wavesnode||vostok"){
                                                    step([$class: 'WsCleanup'])
                                                    electronContainerTasks['linux'] = { 
                                                        dir('linux'){
                                                            try{
                                                                docker.image('node').inside("-u 0"){
                                                                    unstash name: 'repo'
                                                                    wallet.launchElectronContainerBuild('linux')
                                                                }
                                                            }
                                                            finally{
                                                                sh 'sudo chmod -R 777 ./'
                                                                stash includes: '**/Waves*.deb', name: item.buildArtifacts + 'linux', allowEmpty: true
                                                            }
                                                        }
                                                    }
                                                    // electronContainerTasks['windows'] = {
                                                    //     dir('windows'){
                                                    //         try{
                                                    //             docker.image('electronuserland/builder:wine').inside("-u 0"){
                                                    //                 unstash name: 'repo'
                                                    //                 wallet.launchElectronContainerBuild('win')
                                                    //             }
                                                    //         }
                                                    //         finally{
                                                    //             sh 'sudo chmod -R 777 ./'
                                                    //             stash includes: '**/waves*.exe,**/Waves*.exe', name: 'win', allowEmpty: true, excludes: '**/Waves DEX.exe'
                                                    //         }
                                                    //     }
                                                    // }
                                                    parallel electronContainerTasks
                                                }
                                            }
                                            electronGlobalTasks['mac']={
                                                node('electron'){
                                                    step([$class: 'WsCleanup'])
                                                    electronMacTasks['windowsVagrant'] = {
                                                        dir('windowsVagrant'){
                                                            try{
                                                                wallet.removeElectronBuilderVM()
                                                                unstash name: 'repo'
                                                                writeFile file: 'Vagrantfile', text: wallet.wavesElectronVagrantfile()
                                                                winElectronBuildTasks['windowsVagrant'] = {
                                                                    sh 'vagrant up && pkill -f tail'
                                                                }
                                                                winElectronBuildTasks['windowsVagrantLog'] = {
                                                                    sleep 20
                                                                    sh 'touch WavesGUI/electron.log && tail -f WavesGUI/electron.log || true'
                                                                }
                                                                parallel winElectronBuildTasks
                                                            }
                                                            finally{
                                                                stash includes: '**/waves*.exe,**/Waves*.exe', name: item.buildArtifacts + 'win', allowEmpty: true, excludes: '**/Waves DEX.exe'
                                                                wallet.removeElectronBuilderVM()
                                                            }
                                                        }
                                                    }
                                                    electronMacTasks['mac'] = {
                                                        dir('mac'){
                                                            try{
                                                                unstash name: 'repo'
                                                                dir('WavesGUI'){
                                                                    withCredentials([usernamePassword(credentialsId: 'appleid-specific-password-for-electron-notarization', usernameVariable: 'appleIdUsername', passwordVariable: 'appleIdPassword')]) {
                                                                        def macNotarizeMap = [appleIdUsername: appleIdUsername, appleIdPassword: appleIdPassword]
                                                                        cookThisTemplate(
                                                                            templateMap: macNotarizeMap,
                                                                            template: './electron/notarize.ts'
                                                                        )
                                                                    }
                                                                    sh "PATH=/usr/local/opt/node@10/bin:${PATH} DEBUG=electron* ./jenkinsBuildElectronScript.sh mac"
                                                                }
                                                            }
                                                            finally{
                                                                stash includes: '**/Waves*.dmg', name: item.buildArtifacts + 'mac', allowEmpty: true
                                                            }
                                                        }
                                                    }
                                                    parallel electronMacTasks
                                                }
                                            }
                                            parallel electronGlobalTasks
                                            item.buildSuccess = true
                                            slackIt(channel: slackChannelBuild, message: "Built electron images. <${env.BUILD_URL}/|`Click me to download!`>")
                                        }
                                        else{
                                            step([$class: 'WsCleanup'])
                                            unstash name: 'repo'
                                            unstash name: 'docker'

                                            // configure nginx template
                                            def wavesWalletNginxMap = wallet.wavesWalletNginxMap().clone()
                                            wavesWalletNginxMap.nginxPlatform = item.platform
                                            cookThisTemplate(
                                                templateMap: wavesWalletNginxMap,
                                                template: './nginx/default.conf'
                                            )

                                            // configure Dockerfile template
                                            def wavesWalletDockerfileMap = [jenkinsPlatform: item.platform]
                                            cookThisTemplate(
                                                templateMap: wavesWalletDockerfileMap,
                                                template: './Dockerfile'
                                            )

                                            // configure a page with container_info which
                                            // contains all info about Jenkins build and git parameters
                                            item.containerInfo = wallet.wavesWalletContainerInfo(gitDescribeTag, item.niceName, item.dockerTag)
                                            writeFile file: './info.html', text: item.containerInfo

                                            // copy all the generated text files
                                            item.buildArtifacts = it.key + '-dockerBuildArtifacts'
                                            stash includes: 'nginx/default.conf,Dockerfile,info.html', allowEmpty: true, name: item.buildArtifacts

                                            imageIt(
                                                imageName: 'waves/' + item.niceName,
                                                dockerTag: item.dockerTag,
                                                args: " --build-arg trading_view_token=${wallet.wavesWalletTradingViewToken()}" +
                                                      " --build-arg platform=${item.platform}" +
                                                      " --no-cache"
                                            )
                                            item.buildSuccess = true
                                            slackIt(channel: slackChannelBuild, message: "Built image: ${Constants.DOCKER_REGISTRY}/waves/${item.niceName}:${item.dockerTag}")
                                        }
                                    }
                                    else{
                                        org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Building " + item.niceName)
                                    }
                                }
                            }
                        }
                    }
                    parallel buildTasks
                    items.findAll{ it.key !='electron' }.collect{ 
                        println it
                        def item = it.value
                        item.remoteDestination = destination
                        deployTasks["Deploying " + item.niceName] = {
                            stage("Deploying " + item.niceName) {
                                if (item.deployTask){

                                    def wavesWalletDeploymentMap = [
                                        domainName: item.remoteDestination.replaceAll("\\.","-"),
                                        network: network,
                                        tag: item.dockerTag,
                                        imageName: item.niceName
                                    ]

                                    if (action.contains('PROD')) {
                                        item.remoteDestination = wallet.wavesWalletProdDomainNames()[network + '-' + item.niceName]
                                        deploymentFile = "./kubernetes/waves-wallet-${network}/deployment.yaml"
                                        wavesWalletDeploymentMap.domainName = wallet.wavesWalletProdDomainNames()[network + '-' + item.niceName].replaceAll("\\.","-")
                                    }

                                    def deploymentFileOutput = kubeIt(
                                        deploymentTemplate: deploymentFile,
                                        deploymentMap: wavesWalletDeploymentMap
                                    )
                                    item.deployArtifacts = item.niceName + '-kubeDeployArtifacts'
                                    stash includes: 'kubeItOut/**', allowEmpty: true, name: item.deployArtifacts


                                    item.deploySuccess = true
                                    slackIt(channel: slackChannelDeploy, message: "Deployed image:\n${Constants.DOCKER_REGISTRY}/waves/${item.niceName}:${item.dockerTag} ${network} to ${item.remoteDestination}")
                                }
                                else {
                                    org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Deploying " + item.niceName)
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
                    items.each{
                        def item = it.value
                        if (item.buildTask && !item.buildSuccess)
                            if (item.niceName == 'electron')
                                slackIt(channel: slackChannelBuild, buildStatus: currentBuild.result, message: "Failed to build electron images in branch ${source}")
                            else
                                slackIt(channel: slackChannelBuild, buildStatus: currentBuild.result, message: "Failed to build image: ${Constants.DOCKER_REGISTRY}/waves/${item.niceName}:${item.dockerTag}")

                        if (item.deployTask && !item.deploySuccess)
                            slackIt(channel: slackChannelBuild, buildStatus: currentBuild.result, message: "Failed to deploy image:\n${Constants.DOCKER_REGISTRY}/waves/${item.niceName}:${item.dockerTag} ${network} to ${item.remoteDestination}")

                        dir("out/${item.niceName}"){
                            if(item.buildArtifacts){
                                if (it.key == 'electron'){
                                    ['linux','mac','win'].each{ os ->
                                        dir(os){
                                            unstash name: item.buildArtifacts + os    
                                        }
                                    }
                                    // dir("winOnLinux"){
                                    //     unstash name: 'win'
                                    // }
                                } else{
                                    unstash name: item.buildArtifacts
                                }
                            }
                            if(item.deployArtifacts)
                                unstash name: item.deployArtifacts
                        }

                    }
                    dir("out"){
                        def isNotEmpty = ut.shWithOutput('ls')
                        if (isNotEmpty)
                        archiveArtifacts artifacts: "**/**"
                    }
                }
            }
        }
    }
}
