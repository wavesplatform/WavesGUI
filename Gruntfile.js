/*global module:false*/
module.exports = function (grunt) {

    var replaceTestnetVersion = function (content) {
        return content
            .replace(/CLIENT_VERSION\s*=\s*'[^']+'/, grunt.template.process("CLIENT_VERSION = '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*=\s*'[^']+'/, grunt.template.process("NODE_ADDRESS = '<%= meta.configurations.testnet.server %>'"))
            .replace(/NETWORK_NAME\s*=\s*'[^']+'/, grunt.template.process("NETWORK_NAME = '<%= meta.configurations.testnet.name %>'"));
    };

    var replaceMainnetVersion = function (content) {
        return content
            .replace(/CLIENT_VERSION\s*=\s*'[^']+'/, grunt.template.process("CLIENT_VERSION = '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*=\s*'[^']+'/, grunt.template.process("NODE_ADDRESS = '<%= meta.configurations.mainnet.server %>'"))
            .replace(/NETWORK_NAME\s*=\s*'[^']+'/, grunt.template.process("NETWORK_NAME = '<%= meta.configurations.mainnet.name %>'"));
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            sources: ['css/**', 'img/**', 'js/**', 'index.html', '3RD-PARTY-LICENSES.txt', 'LICENSE'],
            editor: "notepad++.exe -multiInst -nosession",
            configurations: {
                testnet: {
                    name: 'testnet',
                    server: 'http://52.30.47.67:6869'
                },
                mainnet: {
                    name: 'mainnet',
                    server: 'https://nodes.wavesnodes.com'
                },
                chrome: {
                    name: 'chrome'
                }
            }
        },
        // Task configuration.
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib_test: {
                src: ['js/*.js']
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.src %>',
                tasks: ['jshint:lib_test', 'qunit']
            }
        },
        jasmine: {
            src: 'js/*.js',
            options: {
                specs: 'tests/spec/**/*.js',
                vendor: ['js/3rdparty/**/*.js', 'js/blake2b/**/*.js', 'js/crypto/**/*.js', 'js/axlsign/**/*.js', 'js/util/**/*.js'],
                keepRunner: false
            }
        },
        clean: ['build/**', 'distr/**'],
        copy: {
            testnet: {
                expand: true,
                src: '<%= meta.sources %>',
                dest: 'distr/<%= meta.configurations.testnet.name %>',
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('waves.settings.js'))
                            return replaceTestnetVersion(content);

                        return content;
                    }
                }
            },
            mainnet: {
                expand: true,
                src: '<%= meta.sources %>',
                dest: 'distr/<%= meta.configurations.mainnet.name %>',
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('waves.settings.js'))
                            return replaceMainnetVersion(content);

                        return content;
                    }
                }
            },
            chrome: {
                files: [
                    { expand: true, dest: 'distr/<%= meta.configurations.chrome.name %>', src: '<%= meta.sources %>' },
                    { expand: true, dest: 'distr/<%= meta.configurations.chrome.name %>', flatten: true, src: 'src/chrome/*.*' }
                ],
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('waves.settings.js'))
                            return replaceMainnetVersion(content);

                        if (srcPath.endsWith('manifest.json'))
                            return grunt.template.process(content);

                        return content;
                    }
                }
            }
        },
        compress: {
            testnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.testnet.name %>', src: '**/*', dest: '/'}]
            },
            mainnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.mainnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.mainnet.name %>', src: '**/*', dest: '/'}]
            },
            chrome: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.chrome.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.chrome.name %>', src: '**/*', dest: '/'}]
            }
        },
        bump: {
            options: {
                updateConfigs: ['pkg'],
                commit: true, // debug
                push: 'branch', // debug
                pushTo: 'origin',
                createTag: false,
                commitMessage: "chore(version): bumping version v%VERSION%",
            }
        },
        shell: {
            release: {
                command: "<%= meta.editor %> distr/CHANGELOG.tmp"
            }
        },
        conventionalChangelog: {
            release: {
                options: {
                    changelogOpts: {
                        // conventional-changelog options go here
                        preset: 'angular',
                        append: false,
                        releaseCount: 0
                    },
                    context: {
                        // context goes here
                    },
                    gitRawCommitsOpts: {
                        // git-raw-commits options go here
                    },
                    parserOpts: {
                        // conventional-commits-parser options go here
                    },
                    writerOpts: {
                        // conventional-changelog-writer options go here
                    }
                },
                src: 'distr/CHANGELOG.tmp'
            }
        },
        "github-release": {
            options: {
                repository : "beregovoy68/WavesGUI",
                auth: {
                    user: process.env["GITHUB_ACCESS_TOKEN"],
                    password: ''
                },
                release: {
                    tag_name: "v<%= pkg.version %>",
                    name: "v<%= pkg.version %>",
                    bodyFilename: 'distr/CHANGELOG.tmp',
                    draft: true,
                    prerelease: true
                }
            },
            files: {
                expand: true,
                src: ['<%= compress.testnet.options.archive %>', '<%= compress.mainnet.options.archive %>']
            }
        },
        webstore_upload: {
            "accounts": {
                "default": { //account under this section will be used by default
                    publish: false, //publish item right after uploading. default false
                    client_id: process.env["WEBSTORE_CLIENT_ID"],
                    client_secret: "",
                    refresh_token: process.env["WEBSTORE_REFRESH_TOKEN"]
                }
            },
            "extensions": {
                "WavesLiteApp": {
                    //required
                    appID: "kfmcaklajknfekomaflnhkjjkcjabogm",
                    //required, we can use dir name and upload most recent zip file
                    zip: "<%= compress.chrome.options.archive %>"
                }
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-github-releaser');
    grunt.loadNpmTasks('grunt-webstore-upload');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-conventional-changelog');

    grunt.registerTask('emptyChangelog', 'Creates an empty changelog', function() {
        grunt.file.write('distr/CHANGELOG.tmp', '');
    });

    grunt.registerTask('distr', ['clean', 'emptyChangelog', 'copy', 'compress']);
    grunt.registerTask('publish', ['distr', 'conventionalChangelog', 'shell', 'github-release']);
    // Default task.
    grunt.registerTask('default', ['jasmine']);
};
