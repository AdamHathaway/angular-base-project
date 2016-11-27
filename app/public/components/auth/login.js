(function () {
	'use strict';

	Controller.$inject = ['AuthService', 'toastr', 'ENV', '$rootScope', 'CurrentUser', '$location'];
	function Controller(AuthService, toastr, ENV, $rootScope, CurrentUser, $location) {
		var model = this;
		model.hasError = hasError;
		model.login = login;

		function hasError(fieldName) {
			return model.loginForm[fieldName].$touched && model.loginForm[fieldName].$invalid;
		}

		function login(formValid) {
			$rootScope.showSpinner = true;

			if (formValid) {
				AuthService.login(model.credentials).then(_onLoginSuccess, _onLoginError);
			} else {
				$rootScope.showSpinner = false;	
				toastr.error('Please verify your credentials and try again', 'Form Has Invalid Information');
			}		
		}

		function _onSignInSuccess() {
			$rootScope.showSpinner = true;

			CurrentUser.getFromAPI().then(function (currentUser) {
                $rootScope.showSpinner = false; 
                $location.path('/');
            }, function (error) {
                AuthService.signOutAndClearStorage();
                $location.path('/signin');
                $rootScope.showSpinner = false; 
                toastr.error('Failed to get your user account');
            });
		}

		function _onSignInError(err) {
			$rootScope.showSpinner = false;	
			toastr.error('Please verify your credentials and try again');
		}
	}

	angular.module('baseApp').component('loginForm', {
		templateUrl: 'components/auth/login.html',
		controller: Controller,
		controllerAs: 'model',
		bindings: {}
	});

} ());