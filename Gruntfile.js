module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['lib/d3.v3.js', 'lib/nv.d3.js', 'lib/xapiwrapper.min.js','src/dashboard.js', 'src/chart.js'],
				dest: 'dist/xapidashboard.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> v<%= pkg.version %> | Built on <%= grunt.template.today("mm-dd-yyyy") %> */\n'
			},
			build: {
				files: [{
					src: 'dist/xapidashboard.js',
					dest: 'dist/xapidashboard.min.js'
				},{
					src: 'src/xapicollection.js',
					dest: 'dist/xapicollection.min.js'
				}]
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'uglify']);

};
