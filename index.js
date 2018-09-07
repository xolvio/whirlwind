const {
  calculateTotalTime,
  generateArtilleryScript,
  generateLoadPhases,
  generateSoakPhases,
  generateSpikePhases,
  generateStressPhases
} = require('./generateArtilleryConfig')

const exec = require('child_process').exec

const JSONreplacer = null
const JSONspacer = 2

const saveScriptToFile = (script, fileName) => {
  const scriptData = JSON.stringify(script, JSONreplacer, JSONspacer)

  const fs = require('fs')
  fs.writeFileSync(fileName, scriptData)
}

class Whirlwind {
  executeArtillery (fileName, local = false) {
    if (process.env.TARGET_HOST) {
      console.log('Starting test on target:', process.env.TARGET_HOST)
    }
    let child

    // TODO: change back to a correct path before publishing npm package
    // const fullFilePath = `${__dirname}/../../${fileName}`
    const fullFilePath = `${__dirname}/../../Projects/artilleryExample/${fileName}`
    console.log('PINGWING: 25 fullFilePath', fullFilePath)

    if (local) {
      child = exec(`cd ${__dirname} && artillery run ${fullFilePath}`)
    } else {
      child = exec(`cd ${__dirname} && slsart invoke -p ${fullFilePath}`)
    }
    child.stdout.on('data', function (data) {
      console.log(data.toString())
    })
  }

  generatePhases (testParams) {
    switch (testParams.testType) {
      case 'load':
        this.phases = generateLoadPhases(testParams.startLoad, testParams.endLoad, testParams.rampUpTime)
        break

      case 'stress':
        this.phases = generateStressPhases(testParams.startLoad, testParams.endLoad, testParams.rampUpTimePerStep, testParams.flatDurationPerStep, testParams.numberOfSteps, testParams.rampUpType)
        break

      case 'soak':
        this.phases = generateSoakPhases(testParams.load, testParams.duration)
        break

      case 'spike':
        this.phases = generateSpikePhases(testParams.consistentLoad, testParams.spikeLoad, testParams.loadTestDuration, testParams.spikeDuration, testParams.numberOfSpikes)
        break

      default:
        throw 'You can start one of: load, stress, soak, or spike test.'
    }
  }

  runTest (scenarios, processorFilename = false, local = false) {
    if (!this.phases) {
      throw 'You need to generate phases by running whirlwind.generatePhases()'
    }
    const script = generateArtilleryScript({})
    script.config.phases = this.phases
    script.scenarios = scenarios

    if (processorFilename) {
      script.config.processor = processorFilename
    }

    const totalTime = calculateTotalTime(this.phases)
    console.log('Total load test duration: ', totalTime)

    const fileName = 'scriptLoadTest.json'
    saveScriptToFile(script, fileName)

    this.executeArtillery(fileName, local)
  }
}

module.exports = Whirlwind
