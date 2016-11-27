(function () {
	'use strict';
	angular.module('baseApp').factory('enumsService', [
	function () {
		var service = {};

		service.SomeEnum = Object.freeze({
			ValueOne: 0,
			ValueTwo: 1,
			ValueThree: 2
		});

		return service;
	}
	]);
})();