(function () {
	'use strict';

	FakeData.$inject = [];
	function FakeData() {
		return {
			getFakeThing: getFakeThing,
		}

		function getFakeThing() {
			return {
				thingID: 1,
				firstName: "Billy",
				lastName: "Billyson",
			}
		}
	}

	angular.module('baseApp').factory('FakeData', FakeData);
}());