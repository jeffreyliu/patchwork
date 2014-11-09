target.canvas = document.getElementById('target-spectrogram'); //document.createElement('canvas');

target.initSpectrogram = function() {
  target.width = target.analyser.frequencyBinCount;
  target.height = Math.floor(target.audioBuffer.length / bufferLength);
  target.canvas.width = target.width;
  target.canvas.height = target.height;
  target.context = target.canvas.getContext('2d');
  target.image = target.context.createImageData(target.canvas.width, target.canvas.height);
  // set alpha to 255 
  for (var i = 3; i < target.width * target.height * 4; i += 4)
    target.image.data[i] = 255;
}

target.drawSpectrum = function() {
  var y = playheadFrame;
  var base, intensity;
  for (var x = 0; x < target.width; ++x) {
    base = 4 * (y * target.width + x);
    intensity = target.spectrum[playheadFrame][x];
    target.image.data[base + 0] = intensity;
    target.image.data[base + 1] = intensity;
    target.image.data[base + 2] = intensity;
  }
  target.context.putImageData(target.image, 0, 0);
}

/*
var viz = {};
viz.analyser = null;
viz.frequency = new Uint8Array(frequencyBinCount);
viz.amplitude = new Float32Array(bufferLength);
viz.oscCanvas = document.querySelector('#osc');
viz.fftCanvas = document.querySelector('#fft');
viz.active = false;
viz.drawOsc = function(context, width, height) {
  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.moveTo(0, (viz.amplitude[0] + 0.5) * height);
  for (var i = 1; i < bufferLength; ++i)
    context.lineTo(i * width / bufferLength, (viz.amplitude[i] + 0.5) * height);
  context.stroke();
}
viz.drawFFT = function(context, width, height) {
  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.moveTo(0, height - viz.frequency[0]);
  for (var i = 1; i < frequencyBinCount; ++i)
    context.lineTo(i * 2, height - viz.frequency[i]);
  context.stroke();
}
viz.start = function() {
  viz.active = true;
  function draw() {
    if (viz.active)
      requestAnimationFrame(draw);
    viz.analyser.getFloatTimeDomainData(viz.amplitude);
    viz.analyser.getByteFrequencyData(viz.frequency);
    viz.drawOsc(viz.oscCanvas.getContext("2d"), viz.oscCanvas.width, viz.oscCanvas.height);
    viz.drawFFT(viz.fftCanvas.getContext("2d"), viz.fftCanvas.width, viz.fftCanvas.height);
  }
  draw();
}
viz.stop = function() {
  viz.active = false;
}
*/