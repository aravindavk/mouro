# Howto run lambda-mouro instance

Here are the steps to run your own instance of `lambda-mouro`.

## Get the code

You can clone the repo from github:

```
git clone git@github.com:uport-project/lambda-mouro.git
```

Then install the dependencies:

```
npm install
```

and finally run the tests to check everything is ok:
```
npm test
```

THis is a serverless application, so it runs on different platforms. 

## AWS Lambda 

Amazon Web Services provide a serverless platform called Lambda Functions. To deploy an instance on your AWS account:

* Change the file `serverless.yml` and change (or confirm) the region on the provider section:
```
provider:
  name: aws
  runtime: nodejs8.10
  stage: develop
  region: us-west-2
```

* Finally deploy the functions:
```
sls deploy
```
This will deploy the lambda function on `develop` stage. 
If you want to create it on `master`:
```
sls deploy --stage master
```

## Express Server
Using Sqlite

```
INFURA_PROJECT_ID=<your project id> PORT=3000 SQLITE_FILE=./mouro.sqlite npm start 
```

Using Postgresql
```
INFURA_PROJECT_ID=<your project id> PORT=3000 PG_URL=postgres://..... npm start 
```


