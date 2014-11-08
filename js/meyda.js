// Meyda Javascript DSP library

var Meyda = function(audioContext,source,bufSize,callback){
	//default buffer size
	var bufferSize = bufSize ? bufSize : 256;

	//callback controllers
	var EXTRACTION_STARTED = false;
	var _featuresToExtract;

	//utilities
	var mu = function(i, amplitudeSpect){
		var numerator = 0;
		var denominator = 0;
		for(var k = 0; k < amplitudeSpect.length; k++){
			numerator += Math.pow(k,i)*Math.abs(amplitudeSpect[k]);
			denominator += amplitudeSpect[k];
		}
		return numerator/denominator;
	}

	var isPowerOfTwo = function(num) {
		while (((num % 2) == 0) && num > 1) {
			num /= 2;
		}
		return (num == 1);
	}

	var hanning = function(sig){
		var hann = Float32Array(sig.length);
		var hanned = Float32Array(sig.length);
		for (var i = 0; i < sig.length; i++) {
			//According to the R documentation http://rgm.ogalab.net/RGM/R_rdfile?f=GENEAread/man/hanning.window.Rd&d=R_CC
			hann[i] = 0.5 - 0.5*Math.cos(2*Math.PI*i/(sig.length-1));
			hanned[i] = sig[i]*hann[i];
		};
		return hanned;
	}

	var self = this;

	if (isPowerOfTwo(bufferSize) && audioContext) {
			self.featureInfo = {
				"buffer": {
					"type": "array"
				},
				"rms": {
					"type": "number"
				},
				"energy": {
					"type": "number"
				},
				"zcr": {
					"type": "number"
				},
				"complexSpectrum": {
					"type": "multipleArrays",
					"arrayNames": {
						"1": "real",
						"2": "imag"
					}
				},
				"amplitudeSpectrum": {
					"type": "array"
				},
				"powerSpectrum": {
					"type": "array"
				},
				"spectralCentroid": {
					"type": "number"
				},
				"spectralFlatness": {
					"type": "number"
				},
				"spectralSlope": {
					"type": "number"
				},
				"spectralRolloff": {
					"type": "number"
				},
				"spectralSpread": {
					"type": "number"
				},
				"spectralSkewness": {
					"type": "number"
				},
				"spectralKurtosis": {
					"type": "number"
				},
				"loudness": {
					"type": "multipleArrays",
					"arrayNames": {
						"1": "total",
						"2": "specific"
					}
				},
				"perceptualSpread": {
					"type": "number"
				},
				"perceptualSharpness": {
					"type": "number"
				},
				"mfcc": {
					"type": "array"
				}
			}

			self.featureExtractors = {
				"buffer" : function(bufferSize,m){
					return m.signal;
				},
				"rms": function(bufferSize, m){
					
					var rms = 0;
					for(var i = 0 ; i < m.signal.length ; i++){
						rms += Math.pow(m.signal[i],2);
					}
					rms = rms / m.signal.length;
					rms = Math.sqrt(rms);

					return rms;
				},
				"energy": function(bufferSize, m) {
					var energy = 0;
					for(var i = 0 ; i < m.signal.length ; i++){
						energy += Math.pow(Math.abs(m.signal[i]),2);
					}
					return energy;
				},
				"complexSpectrum": function(bufferSize, m) {
					return m.complexSpectrum;
				},
				"spectralSlope": function(bufferSize, m) {
					//linear regression
					var ampSum =0;
					var freqSum=0;
					var freqs = new Float32Array(m.ampSpectrum.length);
					var powFreqSum=0;
					var ampFreqSum=0;

					for (var i = 0; i < m.ampSpectrum.length; i++) {
						ampSum += m.ampSpectrum[i];
						var curFreq = i * m.audioContext.sampleRate / bufferSize;
						freqs[i] = curFreq;
						powFreqSum += curFreq*curFreq;
						freqSum += curFreq;
						ampFreqSum += curFreq*m.ampSpectrum[i];
					};
					return (m.ampSpectrum.length*ampFreqSum - freqSum*ampSum)/(ampSum*(powFreqSum - Math.pow(freqSum,2)));
				},
				"spectralCentroid": function(bufferSize, m){
					return mu(1,m.ampSpectrum);
				},
				"spectralRolloff": function(bufferSize, m){
					var ampspec = m.ampSpectrum;
					//calculate nyquist bin
					var nyqBin = m.audioContext.sampleRate/(2*(ampspec.length-1));
					var ec = 0;
					for(var i = 0; i < ampspec.length; i++){
						ec += ampspec[i];
					}
					var threshold = 0.99 * ec;
					var n = ampspec.length - 1;
					while(ec > threshold && n >= 0){
						ec -= ampspec[n];
		            	--n;
					}
					return (n+1) * nyqBin;
				},
				"spectralFlatness": function(bufferSize, m){
					var ampspec = m.ampSpectrum;
					var numerator = 0;
					var denominator = 0;
					for(var i = 0; i < ampspec.length;i++){
						numerator += Math.log(ampspec[i]);
						denominator += ampspec[i];
					}
					return Math.exp(numerator/ampspec.length)*ampspec.length/denominator;
				},
				"spectralSpread": function(bufferSize, m){
					var ampspec = m.ampSpectrum;
					return Math.sqrt(mu(2,ampspec)-Math.pow(mu(1,ampspec),2));
				},
				"spectralSkewness": function(bufferSize, m, spectrum){
					var ampspec = m.ampSpectrum;
					var mu1 = mu(1,ampspec);
					var mu2 = mu(2,ampspec);
					var mu3 = mu(3,ampspec);
					var numerator = 2*Math.pow(mu1,3)-3*mu1*mu2+mu3;
					var denominator = Math.pow(Math.sqrt(mu2-Math.pow(mu1,2)),3);
					return numerator/denominator;
				},
				"spectralKurtosis": function(bufferSize, m){
					var ampspec = m.ampSpectrum;
					var mu1 = mu(1,ampspec);
					var mu2 = mu(2,ampspec);
					var mu3 = mu(3,ampspec);
					var mu4 = mu(4,ampspec);
					var numerator = -3*Math.pow(mu1,4)+6*mu1*mu2-4*mu1*mu3+mu4;
					var denominator = Math.pow(Math.sqrt(mu2-Math.pow(mu1,2)),4);
					return numerator/denominator;
				},
				"amplitudeSpectrum": function(bufferSize, m){
					return m.ampSpectrum;
				},
				"zcr": function(bufferSize, m){
					var zcr = 0;
					for(var i = 0; i < m.signal.length; i++){
						if((m.signal[i] >= 0 && m.signal[i+1] < 0) || (m.signal[i] < 0 && m.signal[i+1] >= 0)){
							zcr++;
						}
					}
					return zcr;
				},
				"powerSpectrum": function(bufferSize, m){
					var powerSpectrum = new Float32Array(m.ampSpectrum.length);
					for (var i = 0; i < powerSpectrum.length; i++) {
						powerSpectrum[i] =  Math.pow(m.ampSpectrum[i],2);
					}
					return powerSpectrum;
				},
				"loudness": function(bufferSize, m){
					var barkScale = Float32Array(m.ampSpectrum.length);
					var NUM_BARK_BANDS = 24;
					var specific = Float32Array(NUM_BARK_BANDS);
					var tot = 0;
					var normalisedSpectrum = m.ampSpectrum;
					var bbLimits = new Int32Array(NUM_BARK_BANDS+1);

					for(var i = 0; i < barkScale.length; i++){
						barkScale[i] = i*m.audioContext.sampleRate/(bufferSize);
						barkScale[i] = 13*Math.atan(barkScale[i]/1315.8) + 3.5* Math.atan(Math.pow((barkScale[i]/7518),2));
					}


					bbLimits[0] = 0;
					var currentBandEnd = barkScale[m.ampSpectrum.length-1]/NUM_BARK_BANDS;
					var currentBand = 1;
					for(var i = 0; i<m.ampSpectrum.length; i++){
						while(barkScale[i] > currentBandEnd) {
							bbLimits[currentBand++] = i;
							currentBandEnd = currentBand*barkScale[m.ampSpectrum.length-1]/NUM_BARK_BANDS;
						}
					}

					bbLimits[NUM_BARK_BANDS] = m.ampSpectrum.length-1;

					//process

					for (var i = 0; i < NUM_BARK_BANDS; i++){
						var sum = 0;
						for (var j = bbLimits[i] ; j < bbLimits[i+1] ; j++) {

							sum += normalisedSpectrum[j];
						}
						specific[i] = Math.pow(sum,0.23);
					}

					//get total loudness
					for (var i = 0; i < specific.length; i++){
						tot += specific[i];
					}
					return {
						"specific": specific,
						"total": tot
					};
				},
				"perceptualSpread": function(bufferSize, m) {
					var loudness = m.featureExtractors["loudness"](bufferSize, m);

					var max = 0;
					for (var i=0; i<loudness.specific.length; i++) {
						if (loudness.specific[i] > max) {
							max = loudness.specific[i];
						}
					}

					var spread = Math.pow((loudness.total - max)/loudness.total, 2);

					return spread;
				},
				"perceptualSharpness": function(bufferSize,m) {
					var loudness = m.featureExtractors["loudness"](bufferSize, m);
					var spec = loudness.specific;
					var output = 0;

					for (var i = 0; i < spec.length; i++) {
						if (i < 15) {
							output += (i+1) * spec[i+1];
						}
						else {
							output += 0.066 * Math.exp(0.171 * (i+1));
						}
					};
					output *= 0.11/loudness.total;

					return output;
				},
				"mfcc": function(bufferSize, m){
					//used tutorial from http://practicalcryptography.com/miscellaneous/machine-learning/guide-mel-frequency-cepstral-coefficients-mfccs/
					var powSpec = m.featureExtractors["powerSpectrum"](bufferSize,m);
					var freqToMel = function(freqValue){
						var melValue = 1125*Math.log(1+(freqValue/700));
						return melValue
					};
					var melToFreq = function(melValue){
						var freqValue = 700*(Math.exp(melValue/1125)-1);
						return freqValue;
					};
					var numFilters = 26; //26 filters is standard
					var melValues = Float32Array(numFilters+2); //the +2 is the upper and lower limits
					var melValuesInFreq = Float32Array(numFilters+2);
					//Generate limits in Hz - from 0 to the nyquist.
					var lowerLimitFreq = 0;
					var upperLimitFreq = audioContext.sampleRate/2;
					//Convert the limits to Mel
					var lowerLimitMel = freqToMel(lowerLimitFreq);
					var upperLimitMel = freqToMel(upperLimitFreq);
					//Find the range
					var range = upperLimitMel-lowerLimitMel;
					//Find the range as part of the linear interpolation
					var valueToAdd = range/(numFilters+1);

					var fftBinsOfFreq = Array(numFilters+2);

					for (var i = 0; i < melValues.length; i++) {
						//Initialising the mel frequencies - they are just a linear interpolation between the lower and upper limits.
						melValues[i] = i*valueToAdd;
						//Convert back to Hz
						melValuesInFreq[i] = melToFreq(melValues[i]);
						//Find the corresponding bins
						fftBinsOfFreq[i] = Math.floor((bufferSize+1)*melValuesInFreq[i]/audioContext.sampleRate);
					};

					var filterBank = Array(numFilters);
					for (var j = 0; j < filterBank.length; j++) {
						//creating a two dimensional array of size numFiltes * (buffersize/2)+1 and pre-populating the arrays with 0s.
						filterBank[j] = Array.apply(null, new Array((bufferSize/2)+1)).map(Number.prototype.valueOf,0);
						//creating the lower and upper slopes for each bin
						for (var i = fftBinsOfFreq[j]; i < fftBinsOfFreq[j+1]; i++) {
							filterBank[j][i] = (i - fftBinsOfFreq[j])/(fftBinsOfFreq[j+1]-fftBinsOfFreq[j]);
						}
						for (var i = fftBinsOfFreq[j+1]; i < fftBinsOfFreq[j+2]; i++) {
							filterBank[j][i] = (fftBinsOfFreq[j+2]-i)/(fftBinsOfFreq[j+2]-fftBinsOfFreq[j+1])
						}
					}

					var mfcc_result = new Float32Array(numFilters);
					for (var i = 0; i < mfcc_result.length; i++) {
						mfcc_result[i] = 0;
						for (var j = 0; j < (bufferSize/2); j++) {
							//point multiplication between power spectrum and filterbanks. 
							filterBank[i][j] = filterBank[i][j]*powSpec[j];

							//summing up all of the coefficients into one array
							mfcc_result[i] += filterBank[i][j];
						}
						//log each coefficient
						mfcc_result[i] = Math.log(mfcc_result[i]);
					}


					//dct
					for (var k = 0; k < mfcc.length; k++) {
						var v = 0;
						for (var n = 0; n < mfcc.length-1; n++) {
							v += mfcc[n]*Math.cos(Math.PI*k*(2*n+1)/(2*mfcc.length));
						}
						mfcc[k] = v;
					}

					return mfcc_result;
				}
			}

			//create nodes
			window.spn = audioContext.createScriptProcessor(bufferSize,1,0);

			window.spn.onaudioprocess = function(e) {
				//this is to obtain the current amplitude spectrum
				var inputData = e.inputBuffer.getChannelData(0);
				self.signal = inputData;
				var hannedSignal = hanning(self.signal);

				//create complexarray to hold the spectrum
				var data = new complex_array.ComplexArray(bufferSize);
				//map time domain
				data.map(function(value, i, n) {
					value.real = hannedSignal[i];
				});
				//transform
				var spec = data.FFT();
				//assign to meyda
				self.complexSpectrum = spec;
				self.ampSpectrum = new Float32Array(bufferSize/2);
				//calculate amplitude
				for (var i = 0; i < bufferSize/2; i++) {
					self.ampSpectrum[i] = Math.sqrt(Math.pow(spec.real[i],2) + Math.pow(spec.imag[i],2));

				}
				//call callback if applicable
				if (typeof callback === "function" && EXTRACTION_STARTED) {
					callback(self.get(_featuresToExtract));
				}

			}

			self.start = function(features) {
				_featuresToExtract = features;
				EXTRACTION_STARTED = true;
			}

			self.stop = function() {
				EXTRACTION_STARTED = false;
			}

			self.audioContext = audioContext;

			self.get = function(feature) {
				if(typeof feature === "object"){
					var results = {};
					for (var x = 0; x < feature.length; x++){
						try{
							results[feature[x]] = (self.featureExtractors[feature[x]](bufferSize, self));
						} catch (e){
							console.error(e);
						}
					}
					return results;
				}
				else if (typeof feature === "string"){
					return self.featureExtractors[feature](bufferSize, self);
				}
				else{
					throw "Invalid Feature Format";
				}
			}
			source.connect(window.spn, 0, 0);
			return self;
	}
	else {
		//handle errors
		if (typeof audioContext == "undefined") {
			throw "AudioContext wasn't specified: Meyda will not run."
		}
		else {
			throw "Buffer size is not a power of two: Meyda will not run."
		}
	}


}
