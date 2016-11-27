(function () {
"use strict";

 angular.module('config', [])

.constant('ENV', {name:'qa',apiUrl:'https://onacare-api.azurewebsites.net',enableDebug:false,useRealData:true,clientID:'onaqa'})

;
})();