/**
 * Simplified $http calls for Angular
 * @version v1.0.0 - 2016-08-25
 * @author Adam Hathaway <adamdhathaway@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */

 (function () {
	"use strict";

	var module = angular.module('httpSimple', []);

	module.provider('httpSimple', function httpSimpleProvider() {
		var provider = this;
		var _baseUrl = null;

		provider.setBaseUrl = function(url) {
			_baseUrl = url;
		};

		provider.$get = ['$http', function($http) {
			var _defaultHeaders = {};
			var ContentTypes = Object.freeze({
				JSON: 0,
				FORMURLENCODED: 1,
				TEXT: 2,
				UNDEFINED: 3,
			});
			var _defaultType = ContentTypes.JSON;

			return {
				setDefaultHeaders: setDefaultHeaders,
				clearDefaultHeaders: clearDefaultHeaders,
				get: get,
				post: post,
				patch: patch,
				ContentTypes: ContentTypes,
			}

			function setDefaultHeaders(headers) {
				_defaultHeaders = headers;
			};

			function clearDefaultHeaders() {
				_defaultHeaders = {};
			};

			/**
		     * Makes an $http GET request using default headers
		     * params: config {
		     * 		url: '/url relative to baseUrl'
		     * }
		     *
		     * Example: 
		     * 		httpSimple.get({
		     * 			url: '/api/users',
		     * 			type: httpSimple.ContentTypes.JSON, 
		     * 			responseType: 'arraybuffer'/'blob'/'document'/'json'
		     * 			shouldIncludeDefaultHeaders: true, // default: true
		     * 		}).then(success, failure);
		     */
            function get(config) {
            	var httpConfig = {
					method: 'GET',
					url: _baseUrl + config.url,
					headers: _getHeaders(config.type),
				};

				if (config.responseType) {
					httpConfig.responseType = config.responseType;
				}

                return $http(httpConfig);
            };

            /**
		     * Makes an $http POST request
		     * params: config {
		     * 		url: '/url relative to baseUrl',
		     * 		type: ContentTypes value, (default: httpSimple.ContentTypes.JSON)
		     * 		data: jsonObject to post, (default: null)
		     * }
		     *
		     * Example: 
		     * 		httpSimple.post({
		     * 			url: '/token', 
		     * 			type: httpSimple.ContentTypes.FORMURLENCODED, 
		     * 			data: {"username": credentials.email, "password": credentials.password, "grant_type": "password", "scope": "read"},
		     * 			shouldIncludeDefaultHeaders: true, // default: true
		     * 			transformRequest: angular.identity, // default: none
		     * 		}).then(success, failure);
		     */
            function post(config) {
            	return $http({
					method: 'POST',
					url: _baseUrl + config.url,
					headers: _getHeaders(config.type, config.shouldIncludeDefaultHeaders),
					data: _getFormattedData(config.type, config.data),
					transformRequest: config.transformRequest,
				});
            };

            /**
		     * Makes an $http PATCH request using default headers
		     * params: config {
		     * 		url: '/url relative to baseUrl',
		     * 		type: ContentTypes value, (default: httpSimple.ContentTypes.JSON)
		     * 		data: jsonObject to post, (default: null)
		     * }
		     *
		     * Example: 
		     * 		httpSimple.patch({
		     * 			url: '/api/users/1', 
		     * 			type: httpSimple.ContentTypes.JSON, 
		     * 			data: {"firstName": "Billy", "lastName": "Billyson", "email": "a@a.com", "phone": "(555) 555-5555"},
		     * 			shouldIncludeDefaultHeaders: true, // default: true
		     * 		}).then(success, failure);
		     */
            function patch(config) {
                return $http({
					method: 'PATCH',
					url: _baseUrl + config.url,
					headers: _getHeaders(config.type),
					data: _getFormattedData(config.type, config.data),
				});
            };

            /**
		     * Constructs a list of headers for the request
		     */
            function _getHeaders(type, shouldIncludeDefaultHeaders) {
            	var contentType = null;
            	
            	type = type || _defaultType;
            	switch(type) {
            		case ContentTypes.FORMURLENCODED:
            			contentType = 'application/x-www-form-urlencoded';
            			break;
            		case ContentTypes.TEXT:
            			contentType = 'application/text;charset=utf-8';
            			break;
            		case ContentTypes.UNDEFINED: // Used for file upload
            			// Will automatically be set to something like: multipart/form-data; boundary=----WebKitFormBoundaryoeoUqtuqjjPYDZ2F
            			contentType = undefined; 
            			break;
        			case ContentTypes.JSON:
        			default:
            			contentType = 'application/json;charset=utf-8';
            	}

            	var headers = shouldIncludeDefaultHeaders === false ? {} : angular.copy(_defaultHeaders);
            	headers['Content-Type'] = contentType;
            	return headers;
            };

            /**
		     * Formats data for the request
		     */
            function _getFormattedData(type, data) {
            	if (data) {
            		var dataFormatted = "";
            	
            		type = type || _defaultType;
	            	switch(type) {
	            		case ContentTypes.FORMURLENCODED:
							for (var key in data) {
							    dataFormatted += encodeURIComponent(key) + "=" + encodeURIComponent(data[key]) + "&";
							}
	            			break;
	            		case ContentTypes.UNDEFINED: // Used for file upload
	            			dataFormatted = data;
	            			break;
	        			case ContentTypes.JSON:
	        			default:
	            			dataFormatted = angular.toJson(data);
	            	}

	            	return dataFormatted;
            	}

            	return null;
            };
		}];
	});

	// module.factory('ContentTypes', [
	// 	function () {
	// 		return Object.freeze({
	// 			JSON: 0,
	// 			FORMURLENCODED: 1,
	// 		});
	// 	}
	// ]);
})();