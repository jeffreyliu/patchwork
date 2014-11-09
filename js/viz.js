target.canvas = document.createElement('canvas');
target.spectrogramCanvas = document.getElementById('target-spectrogram'); 

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

target.initSpectrogram = function() {
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