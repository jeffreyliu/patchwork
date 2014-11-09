
// global audio context 
var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// shared analyser settings
var bufferLength = 512;
var fftSize = bufferLength * 2;
var frequencyBinCount;
var smoothingTimeConstant = 0.0;
var minDecibels = -110;
var maxDecibles = -10;
var playheadFrame = 0;

var residual = {};


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

// Number of frames for the buffer
target.numFrames = null;

// audio source for target sample, e.g., a buffer source node
target.source = null;

// analyser node for target
target.analyser = audioContext.createAnalyser();
target.analyser.smoothingTimeConstant = smoothingTimeConstant;
target.analyser.fftSize = fftSize;
target.analyser.minDecibels = minDecibels;
target.analyser.maxDecibles = maxDecibles;
frequencyBinCount = target.analyser.frequencyBinCount;

// script processor node for target
target.spn = audioContext.createScriptProcessor(bufferLength, 1, 1);
target.processing = false; 

// callback function for target SPN
target.spn.onaudioprocess = function() {
  if (target.processing == false) return; 
  target.analyser.getByteFrequencyData(target.spectrum[playheadFrame]);
  target.drawSpectrum();
  // target.trends.volume.push(dsp.volume(target.spectrum[playheadFrame]));
  // target.trends.centroid.push(dsp.centroid(target.spectrum[playheadFrame]));
  playheadFrame = playheadFrame + 1;
}

// call this function when updating targetAudioBuffer, e.g., when loading a new target sample
target.processAudioBuffer = function() {
  target.numFrames = Math.ceil(target.audioBuffer.length/bufferLength);
  target.spectrum = [];
  for (var i=0; i<target.numFrames; ++i)
    target.spectrum[i] = new Uint8Array(frequencyBinCount);
  console.log('initializing attempt');
  attempt.spectrum = [];
  residual.spectrum = [];
  for (var i=0; i<target.numFrames; ++i){
    attempt.spectrum[i] = new Uint8Array(frequencyBinCount);
    residual.spectrum[i] = new Float32Array(frequencyBinCount);
  }
  console.log('done');
  initSpectrograms();
  target.playAudioBuffer(true);
}

// play the target audio without re-processing by creating a new buffersource
// and constructing the web audio graph, and connecting the relevant script processing nodes
// and setting the callback functions to clean up after playing the buffer
target.playAudioBuffer = function(process) {
  prompt.innerHTML = (process) ? 'Processing target sample' : 'Playing target sample';
  if (target.source) {
    target.source.stop(0.0);
    target.source.disconnect();
  }
  target.source = audioContext.createBufferSource();
  target.source.connect(audioContext.destination);
  target.source.connect(target.analyser);
  if (process) {
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
    playheadFrame = 0;
  }
  target.processing = process;
  target.source.start(0.0);
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

// is the user actively trying to input a sound?
attempt.stopped = false;

// analyser node for attempt
attempt.analyser = audioContext.createAnalyser();
attempt.analyser.smoothingTimeConstant = smoothingTimeConstant;
attempt.analyser.fftSize = fftSize;
attempt.analyser.minDecibels = minDecibels;
attempt.analyser.maxDecibles = maxDecibles;
frequencyBinCount = attempt.analyser.frequencyBinCount;

// script processor node for attempt
attempt.spn = audioContext.createScriptProcessor(bufferLength, 1, 1);

attempt.initialize = function() {
  attempt.spectrum = [];
  residual.spectrum = [];
  for (var i=0; i<target.numFrames; ++i){
    attempt.spectrum[i] = new Uint8Array(frequencyBinCount);
  }
  attempt.initSpectrogram();
}

// callback function for attempt SPN
attempt.spn.onaudioprocess = function() {
  if (target.processing == true) return; //Only do stuff if target audio is done processing
  // only do stuff if not stopped
  if (attempt.stopped == false) {
    attempt.analyser.getByteFrequencyData(attempt.spectrum[playheadFrame]);
    for (var i = 0; i < frequencyBinCount; ++i) {
      residual.spectrum[playheadFrame][i] = (attempt.spectrum[playheadFrame][i] - target.spectrum[playheadFrame][i]) / 255;
    }
    attempt.drawSpectrum();
    residual.drawSpectrum();
    // residual.drawSummary();
    playheadFrame = playheadFrame + 1;
    playheadFrame = playheadFrame % target.numFrames;
  }
}




