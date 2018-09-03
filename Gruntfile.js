/*global module:false*/
module.exports = function (grunt) {

    var compiledTemplates = 'distr/devel/js/templates.js';

    var replaceVersion = function (content, target) {
        return content
            .replace(/CLIENT_VERSION\s*:\s*'[^']+'/, grunt.template.process("CLIENT_VERSION: '<%= pkg.version %>a'"))
            .replace(/NODE_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("NODE_ADDRESS: '<%= meta.configurations." + target + ".server %>'"))
            .replace(/NETWORK_NAME\s*:\s*'[^']+'/, grunt.template.process("NETWORK_NAME: '<%= meta.configurations." + target + ".name %>'"))
            .replace(/NETWORK_CODE\s*:\s*'[^']+'/, grunt.template.process("NETWORK_CODE: '<%= meta.configurations." + target + ".code %>'"))
            .replace(/COINOMAT_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("COINOMAT_ADDRESS: '<%= meta.configurations." + target + ".coinomat %>'"))
            .replace(/DATAFEED_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("DATAFEED_ADDRESS: '<%= meta.configurations." + target + ".datafeed %>'"))
            .replace(/MATCHER_ADDRESS\s*:\s*'[^']+'/, grunt.template.process("MATCHER_ADDRESS: '<%= meta.configurations." + target + ".matcher %>'"));
    };

    var patchHtml = function (content, target) {
        var fileName = grunt.template.process('<%= pkg.name %>-<%= meta.configurations.' + target + '.name %>-<%= pkg.version %>.js');

        return content
            .replace(/<!-- JAVASCRIPT BEGIN -->(\s|.)*?<!-- JAVASCRIPT END -->/m, '<script src="js/' + fileName + '"></script>\n')
            .replace(/<!-- CSS BEGIN -->(\s|.)*?<!-- CSS END -->/m,
                grunt.template.process('<link rel="stylesheet" href="css/<%= pkg.name %>-styles-<%= pkg.version %>.css">\n'));
    };

    var generateConcatDirectives = function (target) {
        var patcherTarget = target;
        if (target.indexOf('chrome') === 0) {
            patcherTarget = target.replace('chrome.', '');
        }

        if (target.indexOf('desktop') == 0) {
            patcherTarget = target.replace('desktop.', '');
        }

        return {
            src: ['<%= meta.dependencies %>', '<%= meta.application %>', compiledTemplates],
            dest: 'distr/<%= pkg.name %>-<%= meta.configurations.' + target + '.name %>-<%= pkg.version %>.js',
            options: {
                process: function (content, srcPath) {
                    if (srcPath.endsWith('app.js'))
                        return replaceVersion(content, patcherTarget);

                    return content;
                }
            }
        };
    };

    var generateCopyDirectives = function (target, isChrome, isDesktop) {
        return {
            files: [
                {expand: true, flatten: true, src: '<%= meta.configurations.css.bundle %>', dest: 'distr/<%= meta.configurations.' + target + '.name %>/css'},
                {expand: true, cwd: 'src', src: '<%= meta.fonts %>', dest: 'distr/<%= meta.configurations.' + target + '.name %>/'},
                {expand: true, src: '<%= meta.licenses %>', dest: 'distr/<%= meta.configurations.' + target + '.name %>'},
                {expand: true, cwd: 'src', src: '<%= meta.content %>', dest: 'distr/<%= meta.configurations.' + target + '.name %>'},
                {expand: true, flatten: true, src: 'distr/<%= pkg.name %>-<%= meta.configurations.' + target + '.name %>-<%= pkg.version %>.js', dest: 'distr/<%= meta.configurations.' + target + '.name %>/js'},
                isChrome ? {expand: true, dest: 'distr/<%= meta.configurations.' + target + '.name %>', flatten: true, src: 'src/chrome/*.*'} : {},
                isDesktop ? {expand: true, dest: 'distr/<%= meta.configurations.' + target + '.name %>', flatten: true, src: 'src/desktop/*.*'} : {}
            ],
            options: {
                process: function (content, srcPath) {
                    if (srcPath.endsWith('index.html'))
                        return patchHtml(content, target);

                    if (isChrome && srcPath.endsWith('manifest.json'))
                        return grunt.template.process(content);

                    return content;
                }
            }
        }
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            stylesheets: [
                'bower_components/angular/angular-csp.css',
                'bower_components/angular-material/angular-material.css',
                // application stylesheets
                'distr/devel/css/style.css'
            ],
            fonts: ['fonts/**'],
            content: ['img/**', 'index.html'],
            licenses: ['3RD-PARTY-LICENSES.txt', 'LICENSE'],
            editor: "gedit --new-window -s ",
            configurations: {
                testnet: {
                    name: 'testnet',
                    code: 'T',
                    server: 'https://testnet1.wavesnodes.com',
                    coinomat: 'https://test.coinomat.com',
                    matcher: 'https://testnet1.wavesnodes.com',
                    datafeed: 'https://marketdata.wavesplatform.com'
                },
                mainnet: {
                    name: 'mainnet',
                    code: 'W',
                    server: 'https://nodes.wavesnodes.org',
                    coinomat: 'https://coinomat.com',
                    matcher: 'https://matcher.wavesnodes.org',
                    datafeed: 'https://marketdata.wavesnodes.org'
                },
                devnet: {
                    name: 'devnet',
                    code: 'D',
                    server: 'http://13.229.61.140:16869/',
                    coinomat: 'https://test.coinomat.com',
                    matcher: 'http://52.28.66.217:6886',
                    datafeed: 'http://marketdata.wavesplatform.com'
                },
                chrome: {
                    testnet: {
                        name: 'chrome_testnet'
                    },
                    mainnet: {
                        name: 'chrome'
                    }
                },
                desktop: {
                    testnet: {
                        name: 'desktop-testnet'
                    },
                    mainnet: {
                        name: 'desktop-mainnet'
                    }
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
                'bower_components/qrious/dist/umd/qrious.js',

                'bower_components/d3/d3.min.js',
                'bower_components/techan/dist/techan.min.js',

                'src/js/vendor/jquery.modal.js',

                'bower_components/wavesplatform-core-js/distr/wavesplatform-core.js'
            ],
            application: [
                // project sources
                'src/js/ui.module.js',
                'src/js/ui.utils.service.js',
                'src/js/application.context.factory.js',
                'src/js/restangular.factories.js',
                'src/js/home.controller.js',
                'src/js/splash.controller.js',

                'src/js/shared/module.js',
                'src/js/shared/constants.js',
                'src/js/shared/assets.store.factory.js',
                'src/js/shared/bitcoin.uri.service.js',
                'src/js/shared/dialog.service.js',
                'src/js/shared/document.title.service.js',
                'src/js/shared/notification.service.js',
                'src/js/shared/spam.asset.service.js',
                'src/js/shared/antispam.asset.filter.js',
                'src/js/shared/padder.filter.js',
                'src/js/shared/page.component.js',
                'src/js/shared/qr.code.component.js',
                'src/js/shared/scrollbox.component.js',
                'src/js/shared/dialog.directive.js',
                'src/js/shared/focus.directive.js',
                'src/js/shared/tooltipster.directive.js',
                'src/js/shared/transaction.loading.service.js',
                'src/js/shared/transaction.filter.js',
                'src/js/shared/money.short.filter.js',
                'src/js/shared/money.long.filter.js',
                'src/js/shared/autocomplete.factory.js',
                'src/js/shared/transaction.broadcast.factory.js',
                'src/js/shared/decimal.input.restrictor.directive.js',
                'src/js/shared/integer.input.restrictor.directive.js',
                'src/js/shared/support.link.component.js',
                'src/js/shared/transaction.menu.component.js',
                'src/js/shared/transaction.history.component.js',

                'src/js/login/module.js',
                'src/js/login/constants.js',
                'src/js/login/context.factory.js',
                'src/js/login/accounts.controller.js',
                'src/js/login/account.list.controller.js',
                'src/js/login/account.register.controller.js',
                'src/js/login/account.seed.controller.js',
                'src/js/login/account.login.controller.js',

                'src/js/navigation/module.js',
                'src/js/navigation/controller.js',
                'src/js/navigation/main.menu.controller.js',
                'src/js/navigation/alias.create.controller.js',
                'src/js/navigation/tab.directive.js',

                'src/js/wallet/module.js',
                'src/js/wallet/box.component.js',
                'src/js/wallet/list.controller.js',
                'src/js/wallet/send.controller.js',
                'src/js/wallet/withdraw.controller.js',
                'src/js/wallet/deposit.controller.js',
                'src/js/wallet/card.deposit.controller.js',

                'src/js/tokens/module.js',
                'src/js/tokens/create.controller.js',

                'src/js/dex/module.js',
                'src/js/dex/component.js',
                'src/js/dex/asset.picker.component.js',
                'src/js/dex/chart.component.js',
                'src/js/dex/charts.factory.js',
                'src/js/dex/favorites.component.js',
                'src/js/dex/history.component.js',
                'src/js/dex/order.creator.component.js',
                'src/js/dex/order.service.js',
                'src/js/dex/orderbook.component.js',
                'src/js/dex/orderbook.service.js',
                'src/js/dex/user.orders.component.js',

                'src/js/leasing/module.js',
                'src/js/leasing/service.js',
                'src/js/leasing/component.js',
                'src/js/leasing/lease.form.component.js',
                'src/js/leasing/balance.details.component.js',

                'src/js/history/module.js',
                'src/js/history/controller.js',

                'src/js/community/module.js',
                'src/js/community/controller.js',

                'src/js/portfolio/module.js',
                'src/js/portfolio/asset.list.controller.js',
                'src/js/portfolio/asset.transfer.controller.js',
                'src/js/portfolio/asset.details.controller.js',
                'src/js/portfolio/asset.reissue.controller.js',
                'src/js/portfolio/asset.filter.js',
                'src/js/portfolio/mass.payment.controller.js',
                'src/js/portfolio/file.select.directive.js',

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
                tasks: ['concat:scriptsBundle', 'test'],
                options: {
                    interrupt: true
                }
            },
            css: {
                files: ['src/less/**/*.less'],
                tasks: ['less']
            },
            ngtemplates: {
                files: ['src/templates/**/*.html'],
                tasks: ['ngtemplates']
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
        less: {
            // NOTE : that task is not consistent with the standard distribution workflow.
            development: {
                files: {
                    'distr/devel/css/style.css': 'src/less/index.less'
                }
            }
        },
        postcss: {
            options: {
                failOnError: true,
                processors: [
                    require('pixrem')(),
                    require('autoprefixer')({browsers: 'last 2 versions'}),
                    require('cssnano')()
                ]
            },
            dist: {
                src: 'distr/devel/css/style.css'
            }
        },
        ngtemplates: {
            // NOTE : that task is not consistent with the standard distribution workflow.
            options: {
                url: function (url) { return url.replace('.html', ''); },
                htmlmin: {
                    collapseWhitespace: true
                }
            },
            app: {
                cwd: 'src/templates',
                src: '**/*.html',
                dest: compiledTemplates
            }
        },
        concat: {
            testnet: generateConcatDirectives('testnet'),
            mainnet: generateConcatDirectives('mainnet'),
            devnet: generateConcatDirectives('devnet'),
            chrome_mainnet: generateConcatDirectives('chrome.mainnet'),
            chrome_testnet: generateConcatDirectives('chrome.testnet'),
            desktop_mainnet: generateConcatDirectives('desktop.mainnet'),
            desktop_testnet: generateConcatDirectives('desktop.testnet'),
            css: {
                src: ['<%= meta.stylesheets %>'],
                dest: '<%= meta.configurations.css.concat %>'
            },
            scriptsBundle: {
                // NOTE : that task is not consistent with the standard distribution workflow.
                src: ['<%= meta.dependencies %>', '<%= meta.application %>'],
                dest: 'distr/devel/js/bundle.js'
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
                    'distr/<%= pkg.name %>-<%= meta.configurations.devnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.devnet.name %>-<%= pkg.version %>.js'],
                    'distr/<%= pkg.name %>-<%= meta.configurations.chrome.mainnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.chrome.mainnet.name %>-<%= pkg.version %>.js'],
                    'distr/<%= pkg.name %>-<%= meta.configurations.chrome.testnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.chrome.testnet.name %>-<%= pkg.version %>.js'],
                    'distr/<%= pkg.name %>-<%= meta.configurations.desktop.mainnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.desktop.mainnet.name %>-<%= pkg.version %>.js'],
                    'distr/<%= pkg.name %>-<%= meta.configurations.desktop.testnet.name %>-<%= pkg.version %>.min.js': ['distr/<%= pkg.name %>-<%= meta.configurations.desktop.testnet.name %>-<%= pkg.version %>.js']
                }
            }
        },
        clean: ['build/**', 'distr/**'],
        copy: {
            options: {
                // if this line is not included copy corrupts binary files
                noProcess: ['**/*.{png,gif,jpg,ico,psd,woff,woff2,svg}']
            },
            testnet: generateCopyDirectives('testnet'),
            mainnet: generateCopyDirectives('mainnet'),
            devnet: generateCopyDirectives('devnet'),
            chrome_testnet: generateCopyDirectives('chrome.testnet', true),
            chrome_mainnet: generateCopyDirectives('chrome.mainnet', true),
            desktop_testnet: generateCopyDirectives('desktop.testnet', false, true),
            desktop_mainnet: generateCopyDirectives('desktop.mainnet', false, true),
            fonts: {
                // NOTE : that task is not consistent with the standard distribution workflow.
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['src/fonts/**/*.*'],
                        dest: 'distr/devel/fonts/'
                    }
                ]
            },
            img: {
                // NOTE : that task is not consistent with the standard distribution workflow.
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['src/img/**/*.*'],
                        dest: 'distr/devel/img/'
                    }
                ]
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
            devnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.devnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.devnet.name %>', src: '**/*', dest: '/'}]
            },
            chrome_mainnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.chrome.mainnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.chrome.mainnet.name %>', src: '**/*', dest: '/'}]
            },
            chrome_testnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.chrome.testnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.chrome.testnet.name %>', src: '**/*', dest: '/'}]
            },
            desktop_mainnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.desktop.mainnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.desktop.mainnet.name %>', src: '**/*', dest: '/'}]
            },
            desktop_testnet: {
                options: {
                    archive: 'distr/<%= pkg.name %>-<%= meta.configurations.desktop.testnet.name %>-v<%= pkg.version %>.zip'
                },
                files: [{expand: true, cwd: 'distr/<%= meta.configurations.desktop.testnet.name %>', src: '**/*', dest: '/'}]
            }
        },
        bump: {
            options: {
                files: ['package.json', 'bower.json', 'src/desktop/package.json'],
                updateConfigs: ['pkg'],
                commit: true, // debug
                commitFiles: ['package.json', 'bower.json', 'src/desktop/package.json'],
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
                    zip: "<%= compress.chrome_mainnet.options.archive %>"
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
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-aws');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-webstore-upload');
    grunt.loadNpmTasks('waves-grunt-github-releaser');

    grunt.registerTask('emptyChangelog', 'Creates an empty changelog', function() {
        grunt.file.write('distr/CHANGELOG.tmp', '');
    });

    grunt.registerTask('distr', ['clean', 'build', 'emptyChangelog', 'copy', 'compress']);
    grunt.registerTask('publish', ['bump', 'distr', 'conventionalChangelog', 'shell', 'github-release']);
    grunt.registerTask('deploy', ['webstore_upload', 's3']);
    grunt.registerTask('test', ['jshint', 'jscs', 'karma:development']);
    grunt.registerTask('styles', ['less', 'copy:fonts', 'copy:img']);

    grunt.registerTask('build-local', ['styles', 'concat:scriptsBundle', 'ngtemplates']);

    grunt.registerTask('build', [
        'build-local',
        'jscs',
        'jshint',
        'karma:development',
        'postcss',
        'concat',
        'karma:distr',
        'uglify',
        'karma:minified'
    ]);

    // Default task.
    grunt.registerTask('default', ['jasmine']);
};
