const {
  calculateTotalTime,
  generateArtilleryScript,
  generateLoadPhases,
  generateSoakPhases,
  generateSpikePhases,
  generateStressPhases
} = require("./generateArtilleryConfig");

const exec = require("child_process").exec;

const JSONreplacer = null;
const JSONspacer = 2;

const saveScriptToFile = (script, fileName) => {
  const scriptData = JSON.stringify(script, JSONreplacer, JSONspacer);

  const fs = require("fs");
  fs.writeFileSync(fileName, scriptData);
};

class Whirlwind {
  constructor(artilleryCommand) {
    this.artilleryCommand = artilleryCommand || 'artillery';
    this.runTest = this.runTest.bind(this);
    this.runTestAsync = this.runTestAsync.bind(this);
    this.prepareAndSaveScript = this.prepareAndSaveScript.bind(this);
  }

  executeArtillery(fileName, local = false) {
    if (process.env.TARGET_HOST) {
      console.log("Starting test on target:", process.env.TARGET_HOST);
    }
    let child;

    const fullFilePath = `${__dirname}/../../${fileName}`;

    if (local) {
      child = exec(`cd ${__dirname} && ${this.artilleryCommand} run ${fullFilePath}`);
    } else {
      child = exec(`cd ${__dirname} && slsart invoke -p ${fullFilePath}`);
    }
    child.stdout.on("data", function(data) {
      console.log(data.toString());
    });

    child.stderr.on("data", function(data) {
      console.log(data.toString());
    });
  }

  async executeArtilleryAsync(fileName, local = false) {
    if (process.env.TARGET_HOST) {
      console.log("Starting test on target:", process.env.TARGET_HOST);
    }

    const fullFilePath = `${__dirname}/../../${fileName}`;

    const processCommand = local ? `cd ${__dirname} && ${this.artilleryCommand} run ${fullFilePath}` : `cd ${__dirname} && slsart invoke -p ${fullFilePath}`;
    return new Promise(async resolve => {
      exec(processCommand, (err, stout, sterr) => {
        resolve(err ? sterr : stout)
      });
    });
  }

  generatePhases(testParams) {
    switch (testParams.testType) {
      case "load":
        this.phases = generateLoadPhases(
          testParams.startLoad,
          testParams.endLoad,
          testParams.rampUpTime
        );
        break;

      case "stress":
        this.phases = generateStressPhases(
          testParams.startLoad,
          testParams.endLoad,
          testParams.rampUpTimePerStep,
          testParams.flatDurationPerStep,
          testParams.numberOfSteps,
          testParams.rampUpType
        );
        break;

      case "soak":
        this.phases = generateSoakPhases(testParams.load, testParams.duration);
        break;

      case "spike":
        this.phases = generateSpikePhases(
          testParams.consistentLoad,
          testParams.spikeLoad,
          testParams.loadTestDuration,
          testParams.spikeDuration,
          testParams.numberOfSpikes
        );
        break;

      default:
        throw "You can start one of: load, stress, soak, or spike test.";
    }
  }

  // TODO config should be a separate class and this should be responsibility of that class
  // variables: array of { name: string, values: string[] } objects
  generateVariables(variables) {
    this.variables = {};
    variables.forEach(variable => {
      this.variables[variable.name] = variable.values;
    });
  }

  prepareAndSaveScript(scenarios, processorFilename, disableSslCertificateChecking, optionOverrides) {
    if (!this.phases) {
      throw "You need to generate phases by running whirlwind.generatePhases()";
    }
    const script = generateArtilleryScript(optionOverrides);
    script.config.phases = this.phases;
    if (this.variables) {
      script.config.variables = this.variables;
    }
    script.scenarios = scenarios;

    if (disableSslCertificateChecking) {
      script.config.tls = {
        "rejectUnauthorized": false
      }
    }

    if (processorFilename) {
      script.config.processor = processorFilename;
    }

    // script.config.http = {};
    // script.config.http.timeout = 60;

    const totalTime = calculateTotalTime(this.phases);
    console.log("Total load test duration: ", totalTime);

    const fileName = "scriptLoadTest.json";
    saveScriptToFile(script, fileName);
    return fileName;
  }

  runTest(scenarios, processorFilename = false, local = false, disableSslCertificateChecking = false, optionOverrides = {}) {
    const fileName = this.prepareAndSaveScript(scenarios, processorFilename, disableSslCertificateChecking, optionOverrides);
    this.executeArtillery(fileName, local);
  }

  async runTestAsync(scenarios, processorFilename = false, local = false, disableSslCertificateChecking = false, optionOverrides = {}) {
    const fileName = this.prepareAndSaveScript(scenarios, processorFilename, disableSslCertificateChecking, optionOverrides);
    return (await this.executeArtilleryAsync(fileName, local));
  }
}

module.exports = Whirlwind;
