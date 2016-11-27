# Angular Base Project

## Pattern Library

#### Validation

```html
<form name="formName">
	<input type="text" name="inputName" ng-model="ctrl.thing" placeholder="placeholder text&#42;" required>
	<div role="alert">
		<div class="error" ng-show="(formName['inputName'].$dirty || ctrl.hasAttemptedSubmit) && formName['inputName'].$error.required">inputName is required.</div>
	</div>
</form>
```

* Add required attribute to input tag

* Wrap error text in a `<div role="alert"></div>` for blind navigation purposes

* ctrl.hasAttemptedSubmit should get set to true when the user tries to submit the form

#### Date fields

```html
<form name="formName">
	<date-field date="ctrl.date" name="dateName" placeholder="Date Name&#42;" is-required="true" input-class="some-class"></date-field>
	<div role="alert">
		<div ng-show="formName['dateName'].$error.required">Date is required.</div>
	</div>
</form>
```

* "input-class" is for any classes you want included on the actual input tag inside the date-picker wrapper

* If date is required, as is-required="true" and include the `<div role="alert"></div>` section

## Structure

* Api is in the root git folder

* Angular development is located in app/

* Angular deployable is located in app/public/

## Development Setup

Install npm if you haven't already:

- Download Node/NPM from https://nodejs.org/en/ (puts them in /usr/local/bin/node and /usr/local/bin/npm)

Globally install grunt if you haven't already

`$ npm install -g grunt-cli`

Globally install bower if you haven't already

`$ npm install -g bower`

## Local Development

Install node packages from the package.json files in both the /app and the /app/public folders (will put in respective node_modules folders)

`$ cd {pathToProject}/app`
`$ npm install`

`$ cd {pathToProject}/app/public`
`$ npm install`

Install bower packages from the bower.json file in the /app/public folder (will put in bower_components folder)

`$ cd {pathToProject}/app/public`
`$ bower install`

Run "grunt" in the /app folder

`$ cd pathToProject/app`
`$ grunt`

Set up a local web server

* For Mac:
    - Download MAMP
    - Run MAMP
    - In the MAMP interface, click "Preferences"
        * On the "Ports" tab: set Apache Port to 8888
        * On the "Web Server" tab: set Web Server to "Apache" and click the little folder next to "Document Root". Navigate to onahealthcare > app > public.
    - In the MAMP interface, click "Start Servers"
    - Navigate to http://localhost:8888

* For Windows (simple):
    - `$ cd {pathToProject}/app/public`
    - `$ live-server --entry-file=index.html`
    - (I haven't tested this with Angular routing yet)

* For Windows if you have an MSDN account:
    - Download IIS (Internet Information Services)
    - Open IIS. Expand your computer in the "Connections" window and rclick > "Add Website" on the "Sites" folder
    - Set physical path for your new website to "C:\...\onahealthcare\app\public"
    - Click "Connect as..." and switch it from "pass-through authentication" to "Specific user" and enter your windows user/pw. Click "Test Settings..." to see if it worked
    - If you're getting permission errors, go give your user rights to your application folders
    - Set it up to run on Port 8888
    - Download and install the URL Rewrite module for IIS (needed for Angular routing)
    - Navigate to http://localhost:8888

## Deploying to Test and Production

Run grunt in your local project folder to prepare files for distribution, and push to Azure

Test: 

`$ git checkout development` `(development)$ cd {pathToProject}/app` `(development)$ grunt qa` `(development)$ git commit -am "grunt qa"` `(development)$ git push` `(development)$ git checkout test` `(test)$ git merge development` `(test)$ git push`

Production: 

`$ git checkout development` `(development)$ cd {pathToProject}/app` `(development)$ grunt dist` `(development)$ git commit -am "grunt dist"` `(development)$ git push` `(development)$ git checkout master` `(master)$ git merge development` `(master)$ git push`

## How deploy is set up

When you run "grunt qa" or "grunt dist" in the "Deploying to the Test server" section, the following things take place:

1. 'clean' - Deletes generated files from previous grunt runs.
2. 'ngconstant' - Sets up the module that holds Angular constant variables for the server, like apiUrl and enableDebug.
3. 'sass' - Generates a .css file from your sass file.
4. 'copy' - Copies index.html into index-optimized.html.
5. 'useminPrepare' - Prepares to modify .html files by generating subtasks called "generated" for each of the following optimization steps: concat, uglify, cssmin.
6. 'concat:generated' - Must run before cssmin (css) or uglify(js).
7. 'uglify:generated' - Bundles and minifies js files.
8. 'cssmin:generated' - Minifies css files.
9. 'usemin' - Modifies .html files to point to optimized versions of css and js files.

## How Azure servers are set up

There's a SQL database for Test and Production:

- OnaHealthcareTest (test)
    - Server: onacare.database.windows.net
    - Pricing Tier: S0 Standard (10 DTUs)
    - Overview > Server Name > Firewall: should have a rule for every IP that wishes to connect to database

- OnaHealthcare (production) (same as OnaHealthcareTest) 

There's an API App Service for Test and Production:

- onacare-api (test) (https://onacare-api.azurewebsites.net)
    - Pricing Tier: B1 Basic
    - Web.Test.config file has an xdt:Transform="Insert" with the connection string to the Azure SQL database
    - Application Settings > App settings: { "SCM_BUILD_ARGS" : "-p:Configuration=Test" }
    - Deployment Source: Continuous deployment set up with BitBucket repo: onahealthcare, branch: test

- ona-api (production) (https://ona-api.azurewebsites.net)
    - Pricing Tier: B1 Basic
    - Web.Release.config file has an xdt:Transform="Insert" with the connection string to the Azure SQL database
    - Application Settings > App settings: { "SCM_BUILD_ARGS" : "-p:Configuration=Release" }
    - Deployment Source: Continuous deployment set up with BitBucket repo: onahealthcare, branch: master

There's a front-end App Service for Test and Production:

- onacare (test)
    - Pricing Tier: B1 Basic
    - Application Settings > App settings: { "project" : "app/public/" }
    - Application Settings > Default documents: Removed "index.html" and added "index-optimized.html"
    - Deployment Source: Continuous deployment set up with BitBucket repo: onahealthcare, branch: test

- ona (production)
    - Pricing Tier: B1 Basic
    - Application Settings > App settings: { "project" : "app/public/" }
    - Application Settings > Default documents: Removed "index.html" and added "index-optimized.html"
    - Deployment Source: Continuous deployment set up with BitBucket repo: onahealthcare, branch: master