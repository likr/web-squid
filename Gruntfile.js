module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    typescript: {
      base: {
        src: ['ts/squid-hsi.ts'],
        dest: 'public/squid-hsi.js',
        options: {
          target: 'es5'
        }
      }
    },
    watch: {
      scripts: {
        files: ['ts/**/*.ts'],
        tasks: ['typescript'],
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-typescript');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('compile', ['typescript']);
};
