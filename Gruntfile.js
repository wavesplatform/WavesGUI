/*global module:false*/
module.exports = function (grunt) {

    var replaceTestnetVersion = function (content) {
        return content
            .replace(/CLIENT_VERSION\s*=\s*'[^']+'/, grunt.template.process("CLIENT_VERSION = '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*=\s*'[^']+'/, grunt.template.process("NODE_ADDRESS = '<%= meta.configurations.testnet.server %>'"))
            .replace(/NETWORK_NAME\s*=\s*'[^']+'/, grunt.template.process("NETWORK_NAME = '<%= meta.configurations.testnet.name %>'"))
            .replace(/NETWORK_CODE\s*=\s*'[^']+'/, grunt.template.process("NETWORK_CODE = '<%= meta.configurations.testnet.code %>'"));
    };

    var replaceMainnetVersion = function (content) {
        return content
            .replace(/CLIENT_VERSION\s*=\s*'[^']+'/, grunt.template.process("CLIENT_VERSION = '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*=\s*'[^']+'/, grunt.template.process("NODE_ADDRESS = '<%= meta.configurations.mainnet.server %>'"))
            .replace(/NETWORK_NAME\s*=\s*'[^']+'/, grunt.template.process("NETWORK_NAME = '<%= meta.configurations.mainnet.name %>'"))
            .replace(/NETWORK_CODE\s*=\s*'[^']+'/, grunt.template.process("NETWORK_CODE = '<%= meta.configurations.mainnet.code %>'"));
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            sources: ['css/**', 'img/**', 'js/**', 'index.html', '3RD-PARTY-LICENSES.txt', 'LICENSE'],
            editor: "nano",
            configurations: {
                testnet: {
                    name: 'testnet',
                    code: 'T',
                    server: 'http://52.30.47.67:6869'
                },
                mainnet: {
                    name: 'mainnet',
                    code: 'W',
                    server: 'https://nodes.wavesnodes.com'
                },
                chrome: {
                    name: 'chrome'
                }
            },
            jsFilesForTesting: [
                //'bower_components/jquery/dist/jquery.js',

                // this library doesn't work properly being included after angular
                'bower_components/js-sha3/src/sha3.js',

                'bower_components/angular/angular.js',
                'bower_components/angular-route/angular-route.js',
                'bower_components/angular-sanitize/angular-sanitize.js',
                'bower_components/angular-mocks/angular-mocks.js',
                'bower_components/restangular/dist/restangular.js',
                'bower_components/underscore/underscore.js',
                'bower_components/decimal.js/decimal.js',
                'bower_components/Base58/Base58.js',
                'bower_components/cryptojslib/rollups/aes.js',
                'bower_components/cryptojslib/rollups/sha256.js',
                'bower_components/curve25519-js/axlsign.js',

                'src/js/vendor/blake2b.js',
                'src/js/vendor/converters.js',
                'src/js/vendor/extensions.js',
            ]
        },
        // Task configuration.
        jshint: {
            all: ['src/js/**/*.js', '!src/js/vendor/*.js']
        },
        jscs: {
            src: ['src/js/**/*.js', '!src/js/vendor/*.js'],
            options: {
                config: '.jscsrc'
            }
        },
        watch: {
            scripts: {
                files: ['Gruntfile.js', 'src/js/**/*.js'],
                tasks: ['test'],
                options: {
                    interrupt: true
                }
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
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            development: {
                options: {
                    files: [
                        '<%= meta.jsFilesForTesting %>',
                        // project sources
                        'src/js/app.js',
                        'src/js/core/waves.money.js',
                        'src/js/core/core.module.js',
                        'src/js/core/core.constants.js',
                        'src/js/core/core.services.module.js',
                        'src/js/core/account.service.js',
                        'src/js/core/address.service.js',
                        'src/js/core/crypto.service.js',
                        'src/js/core/api.service.js',
                        'src/js/core/localstorage.chrome.service.js',
                        'src/js/core/localstorage.html5.service.js',

                        'src/js/**/*.spec.js'
                    ]
                }
            },
            distr: {
                options: {
                    files: [
                        '<%= meta.jsFilesForTesting %>',
                        'distr/<%= pkg.name %>-<%= pkg.version %>.js',
                        'src/js/**/*.spec.js'
                    ]
                }
            },
            minified: {
                options: {
                    files: [
                        '<%= meta.jsFilesForTesting %>',
                        'distr/<%= pkg.name %>-<%= pkg.version %>.min.js',
                        'src/js/**/*.spec.js'
                    ]
                }
            }
        },
        concat: {
            distr: {
                src: ['src/js/**/*.js', 'src/js/**/*.spec.js'],
                dest: 'distr/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            distr: {
                files: {
                    'distr/<%= pkg.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= pkg.version %>.js']
                }
            }
        },
        clean: ['build/**', 'distr/**'],
        copy: {
            options: {
                // if this line is not included copy corrupts binary files
                noProcess: ['**/*.{png,gif,jpg,ico,psd,woff,woff2,svg}']
            },
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
                files: ['package.json', 'bower.json'],
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
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-github-releaser');
    grunt.loadNpmTasks('grunt-webstore-upload');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-conventional-changelog');

    grunt.registerTask('emptyChangelog', 'Creates an empty changelog', function() {
        grunt.file.write('distr/CHANGELOG.tmp', '');
    });

    grunt.registerTask('distr', ['clean', 'emptyChangelog', 'copy', 'compress']);
    grunt.registerTask('publish', ['bump', 'distr', 'conventionalChangelog', 'shell', 'github-release']);
    grunt.registerTask('test', ['jshint', 'jscs', 'karma:development']);
    grunt.registerTask('build', [
        'jscs',
        'jshint',
        'karma:development',
        'concat',
        'karma:distr',
        'uglify',
        'karma:minified'
    ]);
    // Default task.
    grunt.registerTask('default', ['jasmine']);
};
