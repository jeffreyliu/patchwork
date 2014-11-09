
var viz = {};
viz.analyser = null;
viz.frequency = new Float32Array(frequencyBinCount);
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
  function normalize(db) {
    return (db + 110) / 100;
  }
  context.clearRect(0, 0, width, height);
  context.beginPath();
  context.moveTo(0, height * (1 - normalize(viz.frequency[0])));
  for (var i = 1; i < frequencyBinCount; ++i)
    context.lineTo(i * 2, height * (1 - normalize(viz.frequency[i])));
  context.stroke();
}
viz.start = function() {
  viz.active = true;
  function draw() {
    if (viz.active)
      requestAnimationFrame(draw);
    viz.analyser.getFloatTimeDomainData(viz.amplitude);
    viz.analyser.getFloatFrequencyData(viz.frequency);
    viz.drawOsc(viz.oscCanvas.getContext("2d"), viz.oscCanvas.width, viz.oscCanvas.height);
    viz.drawFFT(viz.fftCanvas.getContext("2d"), viz.fftCanvas.width, viz.fftCanvas.height);
  }
  draw();
}
viz.stop = function() {
  viz.active = false;
}