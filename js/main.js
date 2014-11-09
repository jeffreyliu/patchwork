
// global audio context 
var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// shared analyser settings
var bufferLength = 512;
var fftSize = bufferLength * 2;
var frequencyBinCount;
var smoothingTimeConstant = 0.0;


//   ______                      __ 
//  /_  __/___ __________ ____  / /_
//   / / / __ `/ ___/ __ `/ _ \/ __/
//  / / / /_/ / /  / /_/ /  __/ /_  
// /_/  \__,_/_/   \__, /\___/\__/  
//                /____/            

// target object
var target = {};

// audio buffer for target sample
target.audioBuffer = null;

// audio source for target sample, e.g., a buffer source node
target.source = null;

// analyser node for target
target.analyser = audioContext.createAnalyser();
target.analyser.smoothingTimeConstant = 0.8;
target.analyser.fftSize = bufferLength * 2;
frequencyBinCount = target.analyser.frequencyBinCount;

// script processor node for target
target.spn = audioContext.createScriptProcessor(bufferLength, 1, 1);
target.processing = false; 

// collection of time-series
target.trends = {
  volume: [], 
  centroid: []
};

// pre-allocate arrays for analyser output
target.freq = new Float32Array(frequencyBinCount);
target.ampl = new Float32Array(bufferLength);

// callback function for target SPN
target.spn.onaudioprocess = function() {
  if (target.processing == false) return; 
  target.analyser.getFloatFrequencyData(target.freq);
  target.trends.volume.push(dsp.volume(target.freq));
  target.trends.centroid.push(dsp.centroid(target.freq));
}

// call this function when updating targetAudioBuffer, e.g., when loading a new target sample
function processTargetAudioBuffer() {
  playTargetAudioBuffer(true);
}

// play the target audio without re-processing by creating a new buffersource
// and constructing the web audio graph, and connecting the relevant script processing nodes
// and setting the callback functions to clean up after playing the buffer
function playTargetAudioBuffer(process) {
  prompt.innerHTML = (process) ? 'Processing target sample' : 'Playing target sample';
  if (target.source) {
    target.source.stop(0.0);
    target.source.disconnect();
  }
  target.source = audioContext.createBufferSource();
  target.source.connect(audioContext.destination);
  target.source.connect(target.analyser);
  if (process) {
    // reset trends
    target.trends.volume = [];
    target.trends.centroid = [];
    target.source.connect(target.spn);
    target.spn.connect(audioContext.destination); // connect to destination, else it isn't called
  } else {
    target.processing = false;
  }
  target.source.buffer = target.audioBuffer;
  target.source.loop = false;
  target.source.onended = function() {
    target.processing = false;
    prompt.innerHTML = 'Ready';
    target.source.stop(0.0);
    target.source.disconnect();
    viz.stop();
  }
  target.processing = true;
  target.source.start(0.0);
  viz.analyser = target.analyser;
  viz.start();
}

//     ___   __  __                       __ 
//    /   | / /_/ /____  ____ ___  ____  / /_
//   / /| |/ __/ __/ _ \/ __ `__ \/ __ \/ __/
//  / ___ / /_/ /_/  __/ / / / / / /_/ / /_  
// /_/  |_\__/\__/\___/_/ /_/ /_/ .___/\__/  
//                             /_/           

// attempt object
var attempt = {};

// audio buffer for attempt sample
attempt.audioBuffer = null;

// audio source for attempt sample, e.g., a buffer source node
attempt.source = null;

// analyser node for attempt
attempt.analyser = audioContext.createAnalyser();
attempt.analyser.smoothingTimeConstant = 0.8;
attempt.analyser.fftSize = bufferLength * 2;
frequencyBinCount = attempt.analyser.frequencyBinCount;

// script processor node for attempt
attempt.spn = audioContext.createScriptProcessor(bufferLength, 1, 1);

// collection of time-series
attempt.trends = {
  volume: [], 
  centroid: []
};

// pre-allocate arrays for analyser output
attempt.freq = new Float32Array(frequencyBinCount);
attempt.ampl = new Float32Array(bufferLength);

// callback function for attempt SPN
attempt.spn.onaudioprocess = function() {

}
