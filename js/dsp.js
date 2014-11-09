
function sum(array) {
  var n = array.length;
  var total = 0;
  for (var i = 0; i < n; ++i)
    total += array[i];
  return total;
}

function mean(array) {
  return sum(array) / array.length;
}

function variance(array) {
  var n = array.length;
  var mu = mean(array);
  var sum = 0;
  for (var i = 0; i < n; ++i)
    sum += (array[i] - mu) * (array[i] - mu);
  return sum / n;
}

function centroid(array) {
  var n = array.length;
  var c = 0;
  for (var i = 0; i < n; ++i)
    c += i * array[i];
  return c / sum(array);
}

function spread(array) {
  var n = array.length;
  var mu = centroid(array);
  var total = 0;
  for (var i = 0; i < n; ++i)
    total += array[i] * (i - mu) * (i - mu);
  return total / sum(array);
}

function rms(array) {
  var n = array.length;
  var total = 0;
  for (var i = 0; i < n; ++i)
    total += Math.pow(array[i],2);
  return Math.sqrt(total/n);
}

var dsp = {
  
  // average abs value of buffer amplitude to get volume in dB
  // input: Float32Array, output: float
  volume: function(amplitude) {
    return mean(Math.abs(amplitude));
  },

  // get rms estimate of energy, normalized by buffer length
  // input buffer, output: float
  rms: function(buffer) {
    return rms(buffer);
  },

  // "center of mass" of fft bins
  // input: Float32Array, output: float
  centroid: function(freq) {
    return centroid(freq);
  },

  // spread around centroid
  // input: Float32Array, output: float
  spread: function(freq) {
    return spread(freq);
  }

};