(function () {
    'use strict';

    var app = angular.module('baseApp', [
        'config',
    	'ngRoute',
        'ngAnimate',
		'toastr',
    	'ui.bootstrap',
        'LocalStorageModule',
        'angularSpinner',
        'httpSimple',
    ]);

    app.config(HttpConfig);
    app.config(RouteConfig);
    app.config(HttpSimpleConfig);

    HttpConfig.$inject = ['$httpProvider', '$compileProvider'];
    function HttpConfig($httpProvider, $compileProvider) {
        // Initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }

        // disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

        // Allow blob file urls to be considered safe (otherwise will append "unsafe:blob" to blob urls)
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);

        // Interceptors
        $httpProvider.interceptors.push('HttpInterceptor');
    }

	RouteConfig.$inject = ['$routeProvider', '$locationProvider'];
	function RouteConfig($routeProvider, $locationProvider) {
		$routeProvider.caseInsensitiveMatch = true;
		$routeProvider
            .when('/', { template: '<base-main></base-main>' })
            .when('/some', {
                controller: 'someCtrl',
                controllerAs: 'ctrl',
                templateUrl: 'components/some/some.html'
            })
            .when('/login', { template: '<demo-login></demo-login>' })
            .when('/register', { template: '<demo-register></demo-register>' })
			.when('/forgotpassword', { template: '<demo-forgot-password></demo-forgot-password>' })
			.when('/resetpassword', { template: '<demo-reset-password></demo-reset-password>' })
			.otherwise({ redirectTo: '/' });

		$locationProvider.html5Mode(true);
	}

    HttpSimpleConfig.$inject = ['httpSimpleProvider', 'ENV'];
    function HttpSimpleConfig(httpSimpleProvider, ENV) {
        httpSimpleProvider.setBaseUrl(ENV.apiUrl);
    }

    app.run([
		'$rootScope', 'AuthService', 'CurrentUser', '$location', 'httpSimple', 'HttpInterceptor', 'toastr', 'enumsService', '$http', '$q', 'ENV',
		function ($rootScope, AuthService, CurrentUser, $location, httpSimple, HttpInterceptor, toastr, enumsService, $http, $q, ENV) {
            AuthService.setRequestHeadersFromStorage();

            var arrayContains = function(arr, value) {
                return arr.indexOf(value) > -1;
            };

            var pathIsUnauthenticated = function(path) {
                var unauthenticatedPages = ['/login', '/register', '/forgotpassword', '/resetpassword'];
                var isUnauthenticated = arrayContains(unauthenticatedPages, path);
                return isUnauthenticated;
            };

            /* Called on redirect and refresh */
            var intercept = function(nextPath) {
                if (!nextPath) { nextPath = $location.path(); } // For refresh, nextPath is $location.path()

                $rootScope.isAuthenticated = AuthService.isAuthenticated();

                var plannedNextPath = nextPath;

                if (AuthService.isAuthenticated()) {
                    // Authenticated users shouldn't be allowed to go to unauthenticated pages
                    if (pathIsUnauthenticated(plannedNextPath)) {
                        plannedNextPath = '/';
                    }
                    $location.path(plannedNextPath);
                } else {
                    // Unauthenticated users shouldn't be allowed to go to authenticated pages
                    if (!pathIsUnauthenticated(plannedNextPath)) {
                        plannedNextPath = '/login';
                    }
                    $location.path(plannedNextPath);
                }
            };

            intercept();

            $rootScope.$on('$routeChangeStart', function (event, next, current) {
                var nextPath = next && next.$$route ? next.$$route.originalPath : '';
                intercept(nextPath);
            });
		}
    ]);

    app.factory('HttpInterceptor', ['$injector', '$q', 
        function ($injector, $q) {
            return {
                responseError: function (rejection) {
                    if (rejection.status === 401) {
                        var deferred = $q.defer();

                        var AuthService = $injector.get('AuthService');
                        var CurrentUser = $injector.get('CurrentUser');
                        var $http = $injector.get('$http');
                        var $location = $injector.get('$location');
                        var $rootScope = $injector.get('$rootScope');

                        var logout = function() {
                            CurrentUser.resetQuerying(); // Stop querying CurrentUser.getFromAPIWithCaching() if that's what triggerred the 401
                            AuthService.signOutAndClearStorage();
                            $location.path('/signin'); // If you've been logged in before, you probably already have an account
                            $rootScope.showSpinner = false;
                        };

                        var retry = function () {
                            var authToken = AuthService.getAuthTokenFromStorage();
                            angular.extend(rejection.config.headers, { 'Authorization': 'Bearer ' + authToken.token, 'Retry': true });
                            $http(rejection.config).then(function (newResponse) {
                                deferred.resolve(newResponse);
                            }, function(error) {
                                logout();
                                deferred.reject();
                            });
                        };

                        if (AuthService.isAuthenticated()) {
                            AuthService.refreshToken().then(retry)
                            .catch(function() {
                                logout();
                                AuthService.loginNeeded().then(retry);
                            });
                        } else {
                            logout();
                            AuthService.loginNeeded().then(retry);
                        }

                        return deferred.promise;
                    } else {
                        return $q.reject(rejection);
                    }
                }
            };
        }
    ]);
})();