/*global module:false*/
module.exports = function (grunt) {

    var replaceTestnetVersion = function (content) {
        return content
            .replace(/CLIENT_VERSION\s*:\s*'[^']+'/, grunt.template.process("CLIENT_VERSION: '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("NODE_ADDRESS: '<%= meta.configurations.testnet.server %>'"))
            .replace(/NETWORK_NAME\s*:\s*'[^']+'/, grunt.template.process("NETWORK_NAME: '<%= meta.configurations.testnet.name %>'"))
            .replace(/NETWORK_CODE\s*:\s*'[^']+'/, grunt.template.process("NETWORK_CODE: '<%= meta.configurations.testnet.code %>'"))
            .replace(/MATCHER_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("MATCHER_ADDRESS: '<%= meta.configurations.testnet.matcher %>'"));
    };

    var replaceMainnetVersion = function (content) {
        return content
            .replace(/CLIENT_VERSION\s*:\s*'[^']+'/, grunt.template.process("CLIENT_VERSION: '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("NODE_ADDRESS: '<%= meta.configurations.mainnet.server %>'"))
            .replace(/NETWORK_NAME\s*:\s*'[^']+'/, grunt.template.process("NETWORK_NAME: '<%= meta.configurations.mainnet.name %>'"))
            .replace(/NETWORK_CODE\s*:\s*'[^']+'/, grunt.template.process("NETWORK_CODE: '<%= meta.configurations.mainnet.code %>'"))
            .replace(/MATCHER_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("MATCHER_ADDRESS: '<%= meta.configurations.mainnet.matcher %>'"));
    };

    var patchHtml = function (content, fileName) {
        return content
            .replace(/<!-- JAVASCRIPT BEGIN -->(\s|.)*?<!-- JAVASCRIPT END -->/m, '<script src="js/' + fileName + '"></script>\n')
            .replace(/<!-- CSS BEGIN -->(\s|.)*?<!-- CSS END -->/m,
                grunt.template.process('<link rel="stylesheet" href="css/<%= pkg.name %>-styles-<%= pkg.version %>.css">\n'));
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            stylesheets: [
                'bower_components/angular/angular-csp.css',
                'bower_components/angular-material/angular-material.css',
                // application stylesheets
                'src/css/jquery.modal.css',
                'src/css/jquery.growl.css',
                'src/css/tooltipster.min.css',
                'src/css/style.css'
            ],
            content: ['css/*/**', 'img/**', 'index.html'],
            licenses: ['3RD-PARTY-LICENSES.txt', 'LICENSE'],
            editor: "gedit --new-window -s ",
            configurations: {
                testnet: {
                    name: 'testnet',
                    code: 'T',
                    server: 'http://52.30.47.67:6869',
                    matcher: 'http://52.28.66.217:6886'
                },
                mainnet: {
                    name: 'mainnet',
                    code: 'W',
                    server: 'https://nodes.wavesnodes.com',
                    matcher: 'http://52.28.66.217:6886' //TODO: replace this with mainnet matcher address
                },
                chrome: {
                    name: 'chrome'
                },
                css: {
                    concat: 'distr/<%= pkg.name %>-styles-<%= pkg.version %>.css',
                    bundle: 'distr/<%= pkg.name %>-styles-<%= pkg.version %>.css'
                }
            },
            dependencies: [
                'bower_components/jquery/dist/jquery.js',

                // this library doesn't work properly being included after angular
                'bower_components/js-sha3/src/sha3.js',

                'bower_components/angular/angular.js',
                'bower_components/angular-sanitize/angular-sanitize.js',
                'bower_components/angular-animate/angular-animate.js',
                'bower_components/angular-mocks/angular-mocks.js',
                'bower_components/angular-aria/angular-aria.js',
                'bower_components/angular-material/angular-material.js',
                'bower_components/restangular/dist/restangular.js',
                'bower_components/underscore/underscore.js',
                'bower_components/decimal.js/decimal.js',
                'bower_components/Base58/Base58.js',
                'bower_components/cryptojslib/rollups/aes.js',
                'bower_components/cryptojslib/rollups/sha256.js',
                'bower_components/curve25519-js/axlsign.js',
                'bower_components/clipboard/dist/clipboard.js',
                'bower_components/ngclipboard/dist/ngclipboard.js',
                'bower_components/nprogress/nprogress.js',
                'bower_components/growl/javascripts/jquery.growl.js',
                'bower_components/jquery-validation/dist/jquery.validate.js',
                'bower_components/tooltipster/js/jquery.tooltipster.min.js',
                'bower_components/waves-angular-validate/src/angular-validate.js',

                'src/js/vendor/jquery.modal.js',

                'bower_components/wavesplatform-core-js/distr/wavesplatform-core.js'
            ],
            application: [
                // project sources
                'src/js/ui.module.js',
                'src/js/application.context.factory.js',
                'src/js/matcher.restangular.factory.js',
                'src/js/home.controller.js',
                'src/js/splash.controller.js',

                'src/js/shared/shared.module.js',
                'src/js/shared/shared.constants.js',
                'src/js/shared/dialog.service.js',
                'src/js/shared/notification.service.js',
                'src/js/shared/shared.dialog.directive.js',
                'src/js/shared/focus.directive.js',
                'src/js/shared/tooltipster.directive.js',
                'src/js/shared/transaction.loading.service.js',
                'src/js/shared/transaction.filter.js',
                'src/js/shared/shared.autocomplete.factory.js',
                'src/js/shared/transaction.broadcast.factory.js',
                'src/js/shared/decimal.input.restrictor.directive.js',
                'src/js/shared/integer.input.restrictor.directive.js',
                'src/js/shared/transaction.menu.component.js',

                'src/js/login/login.module.js',
                'src/js/login/login.constants.js',
                'src/js/login/login.context.factory.js',
                'src/js/login/accounts.controller.js',
                'src/js/login/account.list.controller.js',
                'src/js/login/account.register.controller.js',
                'src/js/login/account.seed.controller.js',
                'src/js/login/account.login.controller.js',

                'src/js/navigation/navigation.module.js',
                'src/js/navigation/main.menu.controller.js',
                'src/js/navigation/navigation.controller.js',
                'src/js/navigation/tab.directive.js',

                'src/js/wallet/wallet.module.js',
                'src/js/wallet/wallet.box.component.js',
                'src/js/wallet/wallet.list.controller.js',
                'src/js/wallet/wallet.send.controller.js',
                'src/js/wallet/wallet.withdraw.controller.js',

                'src/js/tokens/tokens.module.js',
                'src/js/tokens/token.create.controller.js',

                'src/js/history/history.module.js',
                'src/js/history/history.controller.js',

                'src/js/community/community.module.js',
                'src/js/community/community.controller.js',

                'src/js/portfolio/portfolio.module.js',
                'src/js/portfolio/asset.list.controller.js',
                'src/js/portfolio/asset.transfer.controller.js',
                'src/js/portfolio/asset.details.controller.js',
                'src/js/portfolio/asset.reissue.controller.js',
                'src/js/portfolio/asset.filter.js',
                'src/js/portfolio/mass.payment.controller.js',
                'src/js/portfolio/file.select.directive.js',

                'src/js/exchange/exchange.module.js',
                'src/js/exchange/exchange.main.controller.js',
                'src/js/exchange/exchange.pair.list.controller.js',
                'src/js/exchange/exchange.pair.new.controller.js',
                'src/js/exchange/exchange.pair.controller.js',

                'src/js/style.js',

                'src/js/app.js'
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
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            development: {
                options: {
                    files: [
                        '<%= meta.dependencies %>',
                        '<%= meta.application %>',

                        'src/js/**/*.spec.js'
                    ]
                }
            },
            distr: {
                options: {
                    files: [
                        'distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.js',
                        'src/js/**/*.spec.js'
                    ]
                }
            },
            minified: {
                options: {
                    files: [
                        'distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.min.js',
                        'src/js/**/*.spec.js'
                    ]
                }
            }
        },
        concat: {
            testnet: {
                src: ['<%= meta.dependencies %>', '<%= meta.application %>'],
                dest: 'distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.js',
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('app.js'))
                            return replaceTestnetVersion(content);

                        return content;
                    }
                }
            },
            mainnet: {
                src: ['<%= meta.dependencies %>', '<%= meta.application %>'],
                dest: 'distr/<%= pkg.name %>-<%= meta.configurations.mainnet.name %>-<%= pkg.version %>.js',
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('app.js'))
                            return replaceMainnetVersion(content);

                        return content;
                    }
                }
            },
            chrome: {
                src: ['<%= meta.dependencies %>', '<%= meta.application %>'],
                dest: 'distr/<%= pkg.name %>-<%= meta.configurations.chrome.name %>-<%= pkg.version %>.js',
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('app.js'))
                            return replaceMainnetVersion(content);

                        return content;
                    }
                }
            },
            css: {
                src: ['<%= meta.stylesheets %>'],
                dest: '<%= meta.configurations.css.concat %>'
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            distr: {
                files: {
                    'distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.js'],
                    'distr/<%= pkg.name %>-<%= meta.configurations.mainnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.mainnet.name %>-<%= pkg.version %>.js'],
                    'distr/<%= pkg.name %>-<%= meta.configurations.chrome.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.chrome.name %>-<%= pkg.version %>.js']
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
                files: [
                    {expand: true, flatten: true, src: '<%= meta.configurations.css.bundle %>', dest: 'distr/<%= meta.configurations.testnet.name %>/css'},
                    {expand: true, src: '<%= meta.licenses %>', dest: 'distr/<%= meta.configurations.testnet.name %>'},
                    {expand: true, cwd: 'src', src: '<%= meta.content %>', dest: 'distr/<%= meta.configurations.testnet.name %>'},
                    {expand: true, flatten: true, src: 'distr/<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.js', dest: 'distr/<%= meta.configurations.testnet.name %>/js'}
                ],
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('index.html'))
                            return patchHtml(content,
                                grunt.template.process('<%= pkg.name %>-<%= meta.configurations.testnet.name %>-<%= pkg.version %>.js'));

                        return content;
                    }
                }
            },
            mainnet: {
                files: [
                    {expand: true, flatten: true, src: '<%= meta.configurations.css.bundle %>', dest: 'distr/<%= meta.configurations.mainnet.name %>/css'},
                    {expand: true, src: '<%= meta.licenses %>', dest: 'distr/<%= meta.configurations.mainnet.name %>'},
                    {expand: true, cwd: 'src', src: '<%= meta.content %>', dest: 'distr/<%= meta.configurations.mainnet.name %>'},
                    {expand: true, flatten: true, src: 'distr/<%= pkg.name %>-<%= meta.configurations.mainnet.name %>-<%= pkg.version %>.js', dest: 'distr/<%= meta.configurations.mainnet.name %>/js'}
                ],
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('index.html'))
                            return patchHtml(content,
                                grunt.template.process('<%= pkg.name %>-<%= meta.configurations.mainnet.name %>-<%= pkg.version %>.js'));

                        return content;
                    }
                }
            },
            chrome: {
                files: [
                    {expand: true, flatten: true, src: '<%= meta.configurations.css.bundle %>', dest: 'distr/<%= meta.configurations.chrome.name %>/css'},
                    {expand: true, src: '<%= meta.licenses %>', dest: 'distr/<%= meta.configurations.chrome.name %>'},
                    {expand: true, cwd: 'src', src: '<%= meta.content %>', dest: 'distr/<%= meta.configurations.chrome.name %>'},
                    {expand: true, flatten: true, src: 'distr/<%= pkg.name %>-<%= meta.configurations.chrome.name %>-<%= pkg.version %>.js', dest: 'distr/<%= meta.configurations.chrome.name %>/js'},
                    {expand: true, dest: 'distr/<%= meta.configurations.chrome.name %>', flatten: true, src: 'src/chrome/*.*'}
                ],
                options: {
                    process: function (content, srcPath) {
                        if (srcPath.endsWith('index.html'))
                            return patchHtml(content,
                                grunt.template.process('<%= pkg.name %>-<%= meta.configurations.chrome.name %>-<%= pkg.version %>.js'));

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
                commitFiles: ['package.json', 'bower.json'],
                push: 'branch', // debug
                pushTo: 'origin',
                createTag: false,
                commitMessage: "chore(version): bumping version v%VERSION%"
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
                repository : "wavesplatform/WavesGUI",
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
                    client_secret: ""
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
        },
        s3: {
            options: {
                accessKeyId: process.env['WALLET_AWS_ACCESS_KEY_ID'],
                secretAccessKey: process.env['WALLET_AWS_ACCESS_SECRET'],
                region: 'eu-central-1',
                dryRun: false
            },
            testnet: {
                options: {
                    bucket: 'testnet.waveswallet.io'
                },
                cwd: 'distr/<%= meta.configurations.testnet.name %>',
                src: '**/*'
            },
            mainnet: {
                options: {
                    bucket: 'waveswallet.io'
                },
                cwd: 'distr/<%= meta.configurations.mainnet.name %>',
                src: '**/*'
            }
        },
        cloudfront: {
            options: {
                accessKeyId: process.env['WALLET_AWS_ACCESS_KEY_ID'],
                secretAccessKey: process.env['WALLET_AWS_ACCESS_SECRET'],
                invalidations: [
                    '/index.html',
                    '/css/*',
                    '/js/*'
                ]
            },
            testnet: {
                options: {
                    distributionId: 'E174FYNYORL3QH'
                }
            },
            mainnet: {
                options: {
                    distributionId: 'E2BNQKK79AMUA0'
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
    grunt.loadNpmTasks('waves-grunt-github-releaser');
    grunt.loadNpmTasks('grunt-webstore-upload');
    grunt.loadNpmTasks('grunt-aws');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-conventional-changelog');

    grunt.registerTask('emptyChangelog', 'Creates an empty changelog', function() {
        grunt.file.write('distr/CHANGELOG.tmp', '');
    });

    grunt.registerTask('distr', ['clean', 'build', 'emptyChangelog', 'copy', 'compress']);
    grunt.registerTask('publish', ['bump', 'distr', 'conventionalChangelog', 'shell', 'github-release']);
    grunt.registerTask('deploy', ['webstore_upload', 's3']);
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
