target.canvas    = document.createElement('canvas');
attempt.canvas   = document.createElement('canvas');
residual.canvas  = document.createElement('canvas');
target.spectrogramCanvas   = document.getElementById('target-spectrogram'); 
attempt.spectrogramCanvas  = document.getElementById('attempt-spectrogram'); 
residual.spectrogramCanvas = document.getElementById('residual-spectrogram'); 

target.fftCanvas = document.getElementById('target-fft');
target.oscCanvas = document.getElementById('target-osc');

var cmap = {
  interp: function (x, y0, x0, y1, x1) { return (x-x0)*(y1-y0)/(x1-x0) + y0; },
  jet: {
    base: function (x) {
      if      (x <= -0.75) return 0;
      else if (x <= -0.25) return cmap.interp(x, 0.0, -0.75, 1.0, -0.25);
      else if (x <=  0.25) return 1.0;
      else if (x <=  0.75) return cmap.interp(x, 1.0, 0.25, 0.0, 0.75);
      else return 0.0;
    },
    r: function(x) { return cmap.jet.base(x - 0.5); },
    g: function(x) { return cmap.jet.base(x); },
    b: function(x) { return cmap.jet.base(x + 0.5); }
  }
};

function initSpectrograms() {
  target.width = Math.floor(target.audioBuffer.length / bufferLength);
  target.height = target.analyser.frequencyBinCount;
  target.canvas.width = target.width;
  target.canvas.height = target.height;
  target.context = target.canvas.getContext('2d');
  target.image = target.context.createImageData(target.width, target.height);
  for (var i = 3; i < target.width * target.height * 4; i += 4)
    target.image.data[i] = 255; // set alpha to 255
  target.spectrogramCanvas.width = 800;
  target.spectrogramCanvas.height = 180;
  target.spectrogramContext = target.spectrogramCanvas.getContext('2d');
  target.spectrogramContext.setTransform(1, 0, 0, 1, 0, 0);
  target.spectrogramContext.scale(target.spectrogramCanvas.width / target.width, 
                                  target.spectrogramCanvas.height / target.height);
  // now do it for attempt
  attempt.width = Math.floor(target.audioBuffer.length / bufferLength);
  attempt.height = attempt.analyser.frequencyBinCount;
  attempt.canvas.width = attempt.width;
  attempt.canvas.height = attempt.height;
  attempt.context = attempt.canvas.getContext('2d');
  attempt.image = attempt.context.createImageData(attempt.width, attempt.height);
  for (var i = 3; i < attempt.width * attempt.height * 4; i += 4)
    attempt.image.data[i] = 255; // set alpha to 255
  attempt.spectrogramCanvas.width = 800;
  attempt.spectrogramCanvas.height = 180;
  attempt.spectrogramContext = attempt.spectrogramCanvas.getContext('2d');
  attempt.spectrogramContext.setTransform(1, 0, 0, 1, 0, 0);
  attempt.spectrogramContext.scale(attempt.spectrogramCanvas.width / attempt.width, 
                                   attempt.spectrogramCanvas.height / attempt.height);

  // now do it for residual
  residual.width = Math.floor(target.audioBuffer.length / bufferLength);
  residual.height = attempt.analyser.frequencyBinCount;
  residual.canvas.width = residual.width;
  residual.canvas.height = residual.height;
  residual.context = residual.canvas.getContext('2d');
  residual.image = residual.context.createImageData(residual.width, residual.height);
  for (var i = 3; i < residual.width * residual.height * 4; i += 4)
    residual.image.data[i] = 255; // set alpha to 255
  residual.spectrogramCanvas.width = 800;
  residual.spectrogramCanvas.height = 180;
  residual.spectrogramContext = residual.spectrogramCanvas.getContext('2d');
  residual.spectrogramContext.setTransform(1, 0, 0, 1, 0, 0);
  residual.spectrogramContext.scale(residual.spectrogramCanvas.width / residual.width, 
                                   residual.spectrogramCanvas.height / residual.height);
  
}

target.drawSpectrum = function() {
  var x = playheadFrame;
  var y, h, h0 = 0;
  var base, intensity;
  for (var i = 1; i < target.height; ++i) {
    h = Math.floor(target.height * (Math.log(i) / Math.log(target.height)));
    for (var hi = h0; hi <= h; ++hi) {
      y = target.height - hi;
      base = 4 * (y * target.width + x);
      intensity = (target.spectrum[playheadFrame][i] / 255) * 2 - 1;
      target.image.data[base + 0] = cmap.jet.r(intensity) * 255;
      target.image.data[base + 1] = cmap.jet.g(intensity) * 255;
      target.image.data[base + 2] = cmap.jet.b(intensity) * 255;
    }
    h0 = h;
  }
  target.context.putImageData(target.image, 0, 0);
  target.spectrogramContext.drawImage(target.canvas, 0, 0);
}

attempt.drawSpectrum = function() {
  var x = playheadFrame;
  var y, h, h0 = 0;
  var base, intensity;
  for (var i = 1; i < attempt.height; ++i) {
    h = Math.floor(attempt.height * (Math.log(i) / Math.log(attempt.height)));
    for (var hi = h0; hi <= h; ++hi) {
      y = attempt.height - hi;
      base = 4 * (y * attempt.width + x);
      intensity = (attempt.spectrum[playheadFrame][i] / 255) * 2 - 1;
      attempt.image.data[base + 0] = cmap.jet.r(intensity) * 255;
      attempt.image.data[base + 1] = cmap.jet.g(intensity) * 255;
      attempt.image.data[base + 2] = cmap.jet.b(intensity) * 255;
    }
    h0 = h;
  }
  attempt.context.putImageData(attempt.image, 0, 0);
  attempt.spectrogramContext.drawImage(attempt.canvas, 0, 0);
}

residual.drawSpectrum = function() {
  var x = playheadFrame;
  var y, h, h0 = 0;
  var base, intensity, diff, fade, error;
  for (var i = 1; i < residual.height; ++i) {
    h = Math.floor(residual.height * (Math.log(i) / Math.log(residual.height)));
    diff = attempt.spectrum[playheadFrame][i] - target.spectrum[playheadFrame][i];
    intensity = (diff / 255);
    fade = Math.abs(intensity);
    for (var hi = h0; hi <= h; ++hi) {
      y = residual.height - hi;
      base = 4 * (y * residual.width + x);
      residual.image.data[base + 0] = fade * cmap.jet.r(intensity) * 255;
      residual.image.data[base + 1] = fade * 255;
      residual.image.data[base + 2] = fade * cmap.jet.b(intensity) * 255;
    }
    h0 = h;
  }
  residual.context.putImageData(residual.image, 0, 0);
  residual.spectrogramContext.drawImage(residual.canvas, 0, 0);
  var ctx = residual.spectrogramContext;
  ctx.beginPath();
  ctx.moveTo(0, residual.height - residual.error[0]);
  for (var i = 1; i < target.numFrames ; ++i) {
    var x = i * residual.spectrogramCanvas.width / residual.width;
    var y = residual.error[i] * residual.spectrogramCanvas.height / residual.height;
    ctx.lineTo(x, residual.spectrogramCanvas.height - y);
  }
  ctx.strokeStyle = 'rgb(255,255,255)';
  ctx.stroke();
}

target.drawFFT = function() {

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