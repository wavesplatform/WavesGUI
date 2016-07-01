/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
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
			vendor: ['js/3rdparty/**/*.js', 'js/blake2b/**/*.js', 'js/crypto/**/*.js', 'js/axlsign/**/*.js', 'js/util/**/*.js' ],
			keepRunner: false
		}
	},
	clean: ['build/**', 'distr/**'],
	copy: {
		main: {
			expand: true,
			src: ['css/**', 'img/**', 'js/**', 'index.html', '3RD-PARTY-LICENSES.txt', 'LICENSE'],
			dest: 'distr/html'
		}
	},
	compress: {
		main: {
			options: {
				archive: 'distr/waves-lite-client.zip'
			},
			files: [{ expand: true, cwd: 'distr/html', src: '**/*', dest: '/' }]
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

  grunt.registerTask('distr', ['clean', 'copy', 'compress']);
  // Default task.
  grunt.registerTask('default', ['jasmine']);

};
