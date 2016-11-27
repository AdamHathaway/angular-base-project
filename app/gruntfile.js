module.exports = function (grunt) {
	// load all the tasks from the package.json file that match grunt-*
	require("matchdep").filterDev('grunt-*', './package.json').forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		sass: {
			all: {
				options: {
					outputStyle: 'nested',
					sourceMap: false
				},
				files: {
					'public/assets/site.css': 'site.scss'
				}
			}
		},

		watch: {
			grunt: {
				options: {
					reload: true
				},
				files: ['gruntfile.js']
			},

			sass: {
				files: '*.scss',
				tasks: ['sass']
			}
		},

		clean: {
			dev: ["public/assets/*.css"],
			qa: ["public/assets/*.css", "public/assets/*.min.css", "public/assets/js/*.min.js", "public/assets/js/*.min.js.map"],
			dist: ["public/assets/*.css", "public/assets/*.min.css", "public/assets/js/*.min.js", "public/assets/js/*.min.js.map"],
			node: ["node_modules"]
		},

		cssmin: {
			dist: {
				options: {
					banner: '/*! <%= pkg.name %> <%= grunt.template.today("dddd, mmmm dS, yyyy, h:MM:ss TT") %> */\n'
				},
				files: [{
					expand: true,
					cwd: 'public/assets',
					src: ['site.css'],
					dest: 'public/assets',
					ext: '.min.css'
				}]
			}
		},

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dddd, mmmm dS, yyyy, h:MM:ss TT") %> */',
				sourceMap: true,
				compress: {},
				mangle: false
			},
			build: {
				files: {
					src: ['public/**.js', 'public/components/**/**.js'],
					dest: "public/assets/js/optimized.min.js"
				}
			}
		},

		useminPrepare: {
			options: {
				staging: 'public/.tmp', /* root .tmp files directory */
				dest: 'public', /* root destination directory */
				root: 'public' /* root source directory */
			},
			html: "public/index-optimized.html"
		},

		usemin: {
			html: ["public/index-optimized.html"]
		},

		copy: {
			main: {
				src: 'public/index.html',
				dest: 'public/index-optimized.html'
			}
		},

		ngconstant: {
		    options: {
		      	name: 'config',
		      	dest: 'public/config.js',
		      	wrap: '(function () {\n"use strict";\n\n {%= __ngModule %}\n})();',
		    },
	      	dev: {
	      		constants: {
	      			ENV: {
	      				name: 'development',
	      				apiUrl: 'http://localhost:56402',
	      				enableDebug: true,
	      				useRealData: false,
	      				clientID: "local",
	      			}
	      		}
	      	},
	      	qa: {
	      		constants: {
	      			ENV: {
	      				name: 'qa',
	      				apiUrl: 'https://onacare-api.azurewebsites.net',
	      				enableDebug: false,
	      				useRealData: true,
	      				clientID: "onaqa",
	      			}
	      		}
	      	},
	      	dist: {
	      		constants: {
	      			ENV: {
	      				name: 'dist',
	      				apiUrl: 'https://ona-api.azurewebsites.net',
	      				enableDebug: false,
	      				useRealData: true,
	      				clientID: "onacustomdomain",
	      			}
	      		}
	      	},
		}
	});

	grunt.registerTask('build-watch',
		"Build task for sass.", [
			'clean:dev',
			'sass',
			'watch'
		]
	);

	grunt.registerTask('build-dev',
		"Build task for local development.", [
			'clean:dev',
			'ngconstant:dev',
			'sass',
			'watch'
		]
	);

	grunt.registerTask('build-qa',
		"Build task for QA deployment.", [
			'clean:qa',
			'ngconstant:qa',
			'sass',
			'copy',
			'useminPrepare', /* Prepares to modify .html files by generating subtasks called "generated" for each of the following optimization steps */
			'concat:generated',  /* Run before cssmin (css) or uglify(js) */
			'uglify:generated',
			'cssmin:generated',
			'filerev', /* Creates revved version of files (images, scripts, etc) for usemin */
			'usemin' /* Modifies .html files to point to optimized versions of css and js files */
		]
	);

	grunt.registerTask('build-dist',
		"Build task for distribution deployment.", [
			'clean:dist',
			'ngconstant:dist',
			'sass',
			'copy',
			'useminPrepare', /* Prepares to modify .html files by generating subtasks called "generated" for each of the following optimization steps */
			'concat:generated',  /* Run before cssmin (css) or uglify(js) */
			'uglify:generated',
			'cssmin:generated',
			'filerev', /* Creates revved version of files (images, scripts, etc) for usemin */
			'usemin' /* Modifies .html files to point to optimized versions of css and js files */
		]
	);

	/* Aliased tasks */
	grunt.registerTask('default', ['build-dev']);
	grunt.registerTask('watch', ['build-watch']);
	grunt.registerTask('dev', ['build-dev']);
	grunt.registerTask('qa', ['build-qa']);
	grunt.registerTask('dist', ['build-dist']);
};