const Influx = require("influx");
const throttle = require("lodash/throttle");
const get = require("lodash/get");
const faker = require("faker");

const DEBUG = true;

const influx = new Influx.InfluxDB({
  // here we create an InfluxDB client, it works great with Graphana visualisation tool
  host: process.env.INFLUX_HOST,
  username: process.env.INFLUX_USER,
  password: process.env.INFLUX_PASSWORD,
  database: process.env.INFLUX_DB,
  schema: [
    {
      measurement: "RequestSent",
      fields: {
        test: Influx.FieldType.STRING
      },
      tags: []
    },
    {
      measurement: "Errors",
      fields: {
        step: Influx.FieldType.STRING,
        errorType: Influx.FieldType.STRING
      },
      tags: []
    }
  ]
});

let points = []; // this is an array for data points we send to DB later

sendPointsToInflux = () => {
  // here we send our data to DB
  influx
    .writePoints(points, {
      precision: "ms"
    })
    .catch(err => {
      console.log(`Error saving data to InfluxDB! ${err.stack}`);
    });
  points = []; // after sending points to DB we clean the array to avoid sending the same points again
  console.log("Sent requests reported to InfluxDB.");
};

const sendDataToDbEveryMs = 10000;
const throttledSendPointsToInflux = throttle(
  sendPointsToInflux,
  sendDataToDbEveryMs,
  {
    trailing: true,
    leading: false
  }
); // we create a throttled DB interface to prevent DB from choaking on connections

module.exports.writeDataToDB = (context, ee, next) => {
  sendPointsToInflux();
  return next(); // we need to call next to progress in the scenario
};

module.exports.generateNewUserEmailInFunction = (context, ee, next) => {
  // here we use faker to generate random user data
  const randomFirstName = faker.name.firstName();
  const randomLastName = faker.name.lastName();
  const randomString = faker.random.uuid().substring(0, 8);
  const newUserEmail = `${randomFirstName}.${randomLastName}-${randomString}@testDomain.com`;
  console.log("newUserEmail", newUserEmail);
  context.vars.firstName = randomFirstName; // context is shared between steps during the whole scenario run
  context.vars.lastName = randomLastName;
  context.vars.newUserEmail = newUserEmail;
  return next();
};

module.exports.logRequestSentToInflux = (requestParams, context, ee, next) => {
  // here we log request send timestamp
  points.push({
    measurement: "RequestSent",
    fields: { test: "A" },
    tags: {},
    timestamp: new Date().getTime()
  });

  throttledSendPointsToInflux();
  return next();
};

// --------- STEP HOOKS ---------

module.exports.logRequestToConsole = (requestParams, context, ee, next) => {
  // here we run a custom hook to log data used in request
  // requestParams holds data that will be sent over HTTP
  // context holds Artillery configuration and variables
  // ee is an EventEmitter which can be used to hook additional functions to HTTP engine

  if (DEBUG) {
    console.log("requestParams", requestParams);
  }
  return next();
};

module.exports.logResponseToConsole = (
  requestParams,
  response,
  context,
  ee,
  next
) => {
  // this is a hook after we get the response, we have an additional parameter response here

  const responseJSON = JSON.parse(response.body);

  const errors = get(responseJSON, "data.errors");
  if (errors) {
    const statusCode = get(responseJSON, "data.errors[0].statusCode");
    console.log("ERROR statusCode", statusCode);
  }

  if (DEBUG) {
    console.log("response.body", response.body);
  }
  return next();
};

module.exports.logErrorsInStep = (requestParams, context, ee, next) => {
  // here we define an EventEmitter with on error event handler to log errors to DB

  ee.on("error", handleStepErrors);
  return next();
};

// --------- END STEP HOOKS ---------

// --------- ERROR HANDLERS ---------

const handleStepErrors = error => {
  console.log("error in HTTP request", error);
  points.push({
    measurement: "Errors",
    fields: { step: "getReservation", errorType: error },
    tags: {},
    timestamp: new Date().getTime()
  });
};

// --------- END ERROR HANDLERS ---------
