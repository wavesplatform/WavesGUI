/*global module:false*/
module.exports = function (grunt) {

    function getFilesFrom(dist, extension, filter) {
        var fs = require('fs');
        var path = require('path');

        var files = [];

        function read(localPath) {
            var result = fs.readdirSync(localPath);
            var forRead = [];
            result.sort();
            result.forEach(function (itemName) {
                var itemPath = path.join(localPath, itemName);
                if (fs.statSync(itemPath).isDirectory()) {
                    forRead.push(itemPath);
                } else {
                    if (itemName.lastIndexOf(extension) === (itemName.length - extension.length)) {
                        if (!filter || filter(itemName, itemPath)) {
                            files.push(itemPath);
                        }
                    }
                }
            });

            forRead.forEach(read);
        }

        read(dist);

        return files;
    }

    var SOURCE_LIST = getFilesFrom('./src/js', '.js', function (name, path) {
        return name.indexOf('.spec') === -1 && path.indexOf('/test/') === -1;
    });

    var ES5_PROCESS = function (item) {
        return item.replace('src/js', 'tmp');
    };

    var MIN_PROCESS = function (item) {
        return item.replace('.js', '.min.js');
    };

    var GET_PROCESS_FUNC = function () {
        var processes = Array.prototype.slice.call(arguments);
        return function (item) {
            return processes.reduce(function (result, process) {
                return process(result);
            }, item);
        }
    };

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
            src: ['<%= meta.dependencies %>'].concat(
                SOURCE_LIST.map(GET_PROCESS_FUNC(ES5_PROCESS, MIN_PROCESS)), compiledTemplates),
            dest: 'dist/<%= pkg.name %>-<%= meta.configurations.' + target + '.name %>-<%= pkg.version %>.min.js',
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
                {expand: true, flatten: true, src: '<%= meta.configurations.css.bundle %>', dest: 'dist/<%= meta.configurations.' + target + '.name %>/css'},
                {expand: true, cwd: 'src', src: '<%= meta.fonts %>', dest: 'dist/<%= meta.configurations.' + target + '.name %>/'},
                {expand: true, src: '<%= meta.licenses %>', dest: 'dist/<%= meta.configurations.' + target + '.name %>'},
                {expand: true, cwd: 'src', src: '<%= meta.content %>', dest: 'dist/<%= meta.configurations.' + target + '.name %>'},
                {expand: true, flatten: true, src: 'dist/<%= pkg.name %>-<%= meta.configurations.' + target + '.name %>-<%= pkg.version %>.js', dest: 'dist/<%= meta.configurations.' + target + '.name %>/js'},
                isChrome ? {expand: true, dest: 'dist/<%= meta.configurations.' + target + '.name %>', flatten: true, src: 'src/chrome/*.*'} : {},
                isDesktop ? {expand: true, dest: 'dist/<%= meta.configurations.' + target + '.name %>', flatten: true, src: 'src/desktop/*.*'} : {}
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
                'dist/dev/css/style.css'
            ],
            fonts: ['fonts/**'],
            content: ['img/**', 'index.html'],
            licenses: ['3RD-PARTY-LICENSES.txt', 'LICENSE'],
            editor: "gedit --new-window -s ",
            configurations: {
                testnet: {
                    name: 'testnet',
                    code: 'T',
                    server: 'http://52.30.47.67:6869',
                    coinomat: 'https://test.coinomat.com',
                    matcher: 'http://52.30.47.67:6886',
                    datafeed: 'http://marketdata.wavesplatform.com'
                },
                mainnet: {
                    name: 'mainnet',
                    code: 'W',
                    server: 'https://nodes.wavesnodes.com',
                    coinomat: 'https://coinomat.com',
                    matcher: 'https://nodes.wavesnodes.com',
                    datafeed: 'https://marketdata.wavesplatform.com'
                },
                devnet: {
                    name: 'devnet',
                    code: 'D',
                    server: 'http://35.157.212.173:6869',
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
                    concat: 'dist/<%= pkg.name %>-styles-<%= pkg.version %>.css',
                    bundle: 'dist/<%= pkg.name %>-styles-<%= pkg.version %>.css'
                }
            },
            dependencies: [
                'bower_components/jquery/dist/jquery.min.js',
                'bower_components/lodash/lodash.js',

                // this library doesn't work properly being included after angular
                'bower_components/js-sha3/src/sha3.js',

                'bower_components/angular/angular.min.js',
                'node_modules/angular-ui-router/release/angular-ui-router.min.js',
                'bower_components/angular-sanitize/angular-sanitize.min.js',
                'bower_components/angular-animate/angular-animate.min.js',
                'bower_components/angular-mocks/angular-mocks.js',
                'bower_components/angular-aria/angular-aria.min.js',
                'bower_components/angular-material/angular-material.min.js',
                'bower_components/restangular/dist/restangular.min.js',
                'bower_components/decimal.js/decimal.min.js',
                'bower_components/Base58/Base58.js',
                'bower_components/cryptojslib/rollups/aes.js',
                'bower_components/cryptojslib/rollups/sha256.js',
                'bower_components/curve25519-js/axlsign.js',
                'bower_components/clipboard/dist/clipboard.js',
                'bower_components/ngclipboard/dist/ngclipboard.js',
                'bower_components/growl/javascripts/jquery.growl.js',
                'bower_components/jquery-validation/dist/jquery.validate.js',
                'bower_components/tooltipster/js/jquery.tooltipster.min.js',
                'bower_components/waves-angular-validate/src/angular-validate.js',
                'bower_components/qrious/dist/umd/qrious.js',

                'bower_components/d3/d3.min.js',
                'bower_components/techan/dist/techan.min.js',

                'src/js/vendor/jquery.modal.js',

                'bower_components/wavesplatform-core-js/dist/wavesplatform-core.js'
            ],
            application: SOURCE_LIST,
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
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-webstore-upload');
    grunt.loadNpmTasks('waves-grunt-github-releaser');

    grunt.registerTask('emptyChangelog', 'Creates an empty changelog', function() {
        grunt.file.write('dist/CHANGELOG.tmp', '');
    });

    grunt.registerTask('dist', ['clean', 'build', 'emptyChangelog', 'copy', 'compress']);
    grunt.registerTask('publish', ['bump', 'dist', 'conventionalChangelog', 'shell', 'github-release']);
    grunt.registerTask('test', [/*'eslint',*/ /*'karma:development'*/]);
    grunt.registerTask('styles', ['less', 'copy:fonts', 'copy:img']);

    grunt.registerTask('minBabel', ['babel', 'uglify']);

    grunt.registerTask('build-local', ['styles', 'concat:scriptsBundle', 'concat:vendorsBundle', 'ngtemplates']);

    grunt.registerTask('build', [
        'build-local',
        // 'karma:development',
        'postcss',
        'minBabel',
        'concat',
        // 'karma:minified'
    ]);

    // Default task.
    grunt.registerTask('default', ['test']);
};
