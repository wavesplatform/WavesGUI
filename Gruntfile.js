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
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-crx');

    grunt.registerTask('distr', ['clean', 'copy', 'compress']);
    // Default task.
    grunt.registerTask('default', ['jasmine']);
};
