(function () {
	'use strict';

	AuthService.$inject = ['$q', '$rootScope', 'ENV', '$http', 'FakeData', 'localStorageService', 'CurrentUser', 'httpSimple'];
	function AuthService($q, $rootScope, ENV, $http, FakeData, localStorageService, CurrentUser, httpSimple) {

		// Keeps track of whether or not refreshToken is currently being called
		var _queryingRefreshToken = false;

		// An array of calls to refreshToken that need to wait in line
		var _deferredRefreshTokenCalls = [];

		// 
		var _loginNeededDeferred = null;

		return {
			getAuthTokenFromStorage: getAuthTokenFromStorage,
			setRequestHeadersFromStorage: setRequestHeadersFromStorage,
			login: login,
			register: register,
			signOutAndClearStorage: signOutAndClearStorage, 
			isAuthenticated: isAuthenticated,
			requestForgotPasswordEmail: requestForgotPasswordEmail,
			resetPassword: resetPassword,
			refreshToken: refreshToken,
			loginNeeded: loginNeeded,
		}

		function getAuthTokenFromStorage() {
			var authToken = localStorageService.get('authToken');
			return authToken;
		};

		function setRequestHeadersFromStorage () {
			var authToken = localStorageService.get('authToken');
			if (authToken) {
				_setDefaultRequestHeaders(authToken.token);
			}
		};

		function login(credentials) {
			return httpSimple.post({
				url: '/token',
				type: httpSimple.ContentTypes.FORMURLENCODED,
				data: {"username": credentials.email, "password": credentials.password, "grant_type": "password", "scope": "read", "client_id": ENV.clientID},
			}).then(function (res) {
				_storeTokenResponse(res).then(function() {
					if (_loginNeededDeferred) {
						_loginNeededDeferred.resolve();
						_loginNeededDeferred = null;
					}
				});
			});
		}

		function loginNeeded() {
			if (!_loginNeededDeferred) {
                _loginNeededDeferred = $q.defer();
            }
            return _loginNeededDeferred.promise;
		};

		function signOutAndClearStorage() {
			localStorageService.remove('authToken');
			localStorageService.remove('refreshToken');
			sessionStorage.clear();
			httpSimple.clearDefaultHeaders();
			CurrentUser.set(null);
		};

		function refreshToken() {
			var deferred = $q.defer();

			if (_queryingRefreshToken) {
				_deferredRefreshTokenCalls.push(deferred);
			} else {
				_queryingRefreshToken = true;

				var refreshTokenObj = localStorageService.get('refreshToken');
				var refreshToken = refreshTokenObj.token;
				httpSimple.post({
					url: '/token',
					type: httpSimple.ContentTypes.FORMURLENCODED,
					data: {"grant_type": "refresh_token", "refresh_token": refreshToken, "client_id": ENV.clientID},
					shouldIncludeDefaultHeaders: false, // Don't send the bearer token
				}).then(function (res) {
					_storeTokenResponse(res).then(function() {
						_resolveDeferredRefreshTokenCalls(deferred);
					});
				}, function(err) {
					signOutAndClearStorage();
					_rejectDeferredRefreshTokenCalls(deferred, err);
				});
			}

			return deferred.promise;
		};

		function _resolveDeferredRefreshTokenCalls(deferred) {
			deferred.resolve();

			_.each(_deferredRefreshTokenCalls, function (deferredCall) {
				deferredCall.resolve();
			});

			_queryingRefreshToken = false;
			_deferredRefreshTokenCalls = [];
		}

		function _rejectDeferredRefreshTokenCalls(deferred, err) {
			deferred.reject(err);

			_.each(_deferredRefreshTokenCalls, function (deferredCall) {
				deferred.reject(err);
			});

			_queryingRefreshToken = false;
			_deferredRefreshTokenCalls = [];
		}

		function _storeTokenResponse(res) {
			var deferred = $q.defer();

			if (res.data.access_token) {
				var loginData = res.data;
				_setDefaultRequestHeaders(loginData.access_token);
				localStorageService.set('authToken', { token: loginData.access_token });
				localStorageService.set('refreshToken', { token: loginData.refresh_token });
				deferred.resolve();
			} else {
				deferred.resolve();
			}

			return deferred.promise;
		};

		function register(userData) {
			var deferred = $q.defer();

			httpSimple.post({
      			url: '/api/register',
      			data: {
      				firstName: userData.firstName,
      				lastName: userData.lastName,
      				emailAddress: userData.email,
      				password: userData.password,
      			}
      		}).then(function() {
      			deferred.resolve();
      		}, function(err) {
      			deferred.reject(err);
      		});

			return deferred.promise;
		}

		function isAuthenticated() {
			var authTokenData = localStorageService.get('authToken');
			return !!authTokenData && !!authTokenData.token;
		};

		function requestForgotPasswordEmail(email) {
			var deferred = $q.defer();			

			if (!email || !email.trim().length) {
				deferred.reject('No email address provided');
			}

			httpSimple.post({
      			url: '/api/ForgotPassword?email=' + email
      		}).then(function() {
      			deferred.resolve();
      		}, function(err) {
      			deferred.reject(err);
      		});

			return deferred.promise;
		}

		function resetPassword(userData, recoveryToken) {
			var deferred = $q.defer();

			httpSimple.post({
      			url: '/api/ResetPassword?updatePasswordToken=' + recoveryToken + '&newPassword=' + userData.password
      		}).then(function() {
      			deferred.resolve();
      		}, function(err) {
      			deferred.reject(err);
      		});

			return deferred.promise;
		}

		function _setDefaultRequestHeaders(token) {
			httpSimple.setDefaultHeaders({'Authorization': 'Bearer ' + token});
		}
	}

	angular.module('baseApp').factory('AuthService', AuthService);
}());