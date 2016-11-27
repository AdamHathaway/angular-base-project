(function () {
	'use strict';

	CurrentUser.$inject = ['$q', '$rootScope', '$http', 'ENV', 'FakeData', 'httpSimple'];
	function CurrentUser($q, $rootScope, $http, ENV, FakeData, httpSimple) {
		var _currentUser;
		var _querying = false;
		var _deferredCalls = [];
		var _useRealData = true;//TODO: ENV.useRealData;

		return {
			getCachedOrFromAPI: getCachedOrFromAPI,
			getFromAPI: getFromAPI,
			patchToAPI: patchToAPI,
			set: set,
			resetQuerying: resetQuerying
		}

		function getCachedOrFromAPI() {
			if (_currentUser) {
				set(_currentUser);
				deferred.resolve(_currentUser);
			} else {
				getFromAPI();
			}
		};

		function getFromAPI() {
			var deferred = $q.defer();

			if (_querying) {
				_deferredCalls.push(deferred);
			} else {
				_querying = true;
				if (_useRealData) {
					httpSimple.get({
						url: '/api/CurrentUser'
					}).then(function (res) {
						var newCurrentUser = res.data;
						set(newCurrentUser);
						_resolveDeferredCalls(deferred);
					}, function (err) {
						set(null);
						_rejectDeferredCalls(deferred, err);
					});
				} else {
					var fakeUser = FakeData.getFakeCurrentUser();
					set(fakeUser);
					_resolveDeferredCalls(deferred);
				}
			}

			return deferred.promise;
		}

		function patchToAPI(fullObject) {
			var deferred = $q.defer();

			// Make sure only the appropriate fields are used
			var patchObject = {
			  //"userID": fullObject.userID,
			  "alternateEmailAddress": fullObject.alternateEmailAddress,
			  "mailingStreet": fullObject.mailingStreet,
			  "mailingCity": fullObject.mailingCity,
			  "mailingState": fullObject.mailingState,
			  "mailingZip": fullObject.mailingZip,
			  "billingStreet": fullObject.billingStreet,
			  "billingCity": fullObject.billingCity,
			  "billingState": fullObject.billingState,
			  "billingZip": fullObject.billingZip,
			  "otherPhoneNumber": fullObject.otherPhoneNumber,
			  "firstName": fullObject.firstName,
			  "lastName": fullObject.lastName,
			  "emailAddress": fullObject.emailAddress,
			  "mobile": fullObject.mobile,
			  //"password": fullObject.password,
			  //"wantsFutureUpdates": fullObject.wantsFutureUpdates
			}

			httpSimple.patch({
      			url: '/api/CurrentUser', 
      			data: patchObject,
      		})
			.then(function (responseForPatch) {
				getFromAPIWithCaching(false).then(function (responseForGet) {
					deferred.resolve(responseForGet);
				}, function (err) {
					deferred.reject("Failed to get user.");
				});
			})
			.catch(function (err) {
				deferred.reject("Failed to patch user.");
			});

			return deferred.promise;
		}

		function set(newCurrentUser) {
			_currentUser = newCurrentUser;
			$rootScope.currentUser = newCurrentUser;
		}

		function _resolveDeferredCalls(deferred) {
			_querying = false;
			deferred.resolve(_currentUser);

			_.each(_deferredCalls, function (deferredCall) {
				deferredCall.resolve(_currentUser);
			});
			_deferredCalls = [];
		}

		function _rejectDeferredCalls(deferred, error) {
			_querying = false;
			deferred.reject(error);

			_.each(_deferredCalls, function (deferredCall) {
				deferred.reject(error);
			});
			_deferredCalls = [];
		}

		function resetQuerying() {
			_querying = false;
			_deferredCalls = [];
		}
	}

	angular.module('baseApp').factory('CurrentUser', CurrentUser);
}());