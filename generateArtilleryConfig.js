const warmUpPhase = {
  duration: 10,
  arrivalRate: 1
};

function generateScriptDefaults(options) {
  const defaults = {
    protocol: "https",
    host: `${process.env.TARGET_HOST}`,
    duration: 60,
    rate: 1,
    path: "/graphql",
    query: ""
  };
  return { ...defaults, ...options };
}

module.exports.generateArtilleryScript = function(options) {
  // fallback to defaults
  const opts = generateScriptDefaults(options);
  // extract and combine options into generated script

  let plugins = {};
  if (process.env.INFLUX_HOST) {
    plugins = {
      influxdb: {
        testName: "testRun1",
        measurementName: "Latency",
        errorMeasurementName: "ClientSideErrors",
        testRunId: "1227",
        tags: {
          environment: "myHostname",
          host: process.env.TARGET_HOST
        },
        influx: {
          matches: "show",
          host: process.env.INFLUX_HOST,
          username: process.env.INFLUX_USER,
          password: process.env.INFLUX_PASSWORD,
          database: process.env.INFLUX_DB
        }
      }
    };
  }

  return {
    config: {
      target: `${opts.protocol}://${opts.auth ? `${opts.auth}@` : ""}${
        opts.host
      }`,
      // processor: 'scenarioProcessor.js', // here we define an external js file with custom hooks and functions which can be run during the scenario
      phases: [
        {
          duration: opts.duration,
          arrivalRate: opts.rate,
          rampTo: opts.rampTo ? opts.rampTo : undefined
        }
      ],
      plugins
    },
    scenarios: []
  };
};

module.exports.calculateTotalTime = function(phases) {
  let totalTime = 0;
  phases.forEach(function(phase) {
    totalTime += phase.duration;
  });
  return totalTime;
};

function exponentialFunction(phase, noOfPhases, base = 2) {
  return Math.pow(phase, base) / Math.pow(noOfPhases, base);
}

module.exports.generateStressPhases = function(
  startLoad = 10,
  endLoad = 1000,
  rampUpTimePerStep = 20,
  flatDurationPerStep = 40,
  numberOfSteps = 6,
  rampUpType = "linear"
) {
  if (!(rampUpType === "linear" || rampUpType === "exponential")) {
    throw "rampUpType must me linear or exponential";
  }
  const phases = [];

  phases.push(warmUpPhase);

  for (let phase = 0; phase < numberOfSteps; phase += 1) {
    let startArrivalRateForThisPhase = 0;
    let rampToForThisPhase = 0;

    const totalRampUp = endLoad - startLoad;

    if (rampUpType === "linear") {
      startArrivalRateForThisPhase =
        (totalRampUp / numberOfSteps) * phase + startLoad;
      rampToForThisPhase =
        ((endLoad - startLoad) / numberOfSteps) * (phase + 1) + startLoad;
    } else if (rampUpType === "exponential") {
      startArrivalRateForThisPhase = Math.round(
        startLoad + totalRampUp * exponentialFunction(phase, numberOfSteps)
      );
      rampToForThisPhase = Math.round(
        startLoad + totalRampUp * exponentialFunction(phase + 1, numberOfSteps)
      );
    }

    const rampUpPhase = {
      duration: rampUpTimePerStep,
      arrivalRate: startArrivalRateForThisPhase,
      rampTo: rampToForThisPhase
    };

    const stationaryPhase = {
      duration: flatDurationPerStep,
      arrivalRate: rampToForThisPhase
    };

    phases.push(rampUpPhase);
    phases.push(stationaryPhase);
  }

  return phases;
};

module.exports.generateLoadPhases = function(
  startLoad = 10,
  endLoad = 1000,
  rampUpTime = 5 * 60
) {
  return [
    warmUpPhase,
    {
      duration: rampUpTime,
      arrivalRate: startLoad,
      rampTo: endLoad
    }
  ];
};

module.exports.generateSoakPhases = function(load = 10, duration = 5 * 60) {
  return [
    warmUpPhase,
    {
      duration: duration,
      arrivalRate: load
    }
  ];
};

module.exports.generateSpikePhases = function(
  consistentLoad = 30,
  spikeLoad = 300,
  loadTestDuration = 400,
  spikeDuration = 5,
  numberOfSpikes = 4
) {
  const phases = [];

  phases.push(warmUpPhase);

  for (let phase = 0; phase < numberOfSpikes; phase += 1) {
    const thisPhaseTotalDuration = loadTestDuration / numberOfSpikes;
    const prePostSpikeDuration = (thisPhaseTotalDuration - spikeDuration) / 2;

    const preSpikePhase = {
      duration: prePostSpikeDuration,
      arrivalRate: consistentLoad
    };

    const spikePhase = {
      duration: spikeDuration,
      arrivalRate: spikeLoad
    };

    const postSpikePhase = {
      duration: prePostSpikeDuration,
      arrivalRate: consistentLoad
    };

    phases.push(preSpikePhase);
    phases.push(spikePhase);
    phases.push(postSpikePhase);
  }

  return phases;
};
