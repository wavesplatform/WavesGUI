pipeline {
  agent any
  stages {
    stage('first') {
      parallel {
        stage('first') {
          steps {
            echo 'test'
          }
        }
        stage('sleep2') {
          steps {
            sleep 2
          }
        }
      }
    }
    stage('next') {
      steps {
        sleep 1
      }
    }
  }
}