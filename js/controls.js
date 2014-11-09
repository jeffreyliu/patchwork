
// event listeners
document.addEventListener('dragover', dragover, false);
document.addEventListener('drop', drop, false);
window.addEventListener( 'keypress', keypress, false )
var prompt = document.getElementById('prompt');

// stop event propagation (important!)
function dragover(evt) {
  prompt.innerHTML = "drop MP3 here";
  evt.stopPropagation();
  evt.preventDefault();
  return false;
}

// load user audio into targetAudioBuffer
function drop(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  prompt.innerHTML = "loading...";
  var droppedFiles = evt.dataTransfer.files;
  var reader = new FileReader();
  reader.onload = function(fileEvent) {
    var data = fileEvent.target.result;
    audioContext.decodeAudioData(data, function(buffer) {
      target.audioBuffer = buffer;
      target.processAudioBuffer();
    }, function(e) {
      prompt.innerHTML = 'Cannot decode mp3';
      console.log(e);
    });
  }
  reader.readAsArrayBuffer(droppedFiles[0]);
}

function keypress(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  if (evt.keyCode == 32){
    if (evt.stopPropagation) {
      evt.stopPropagation();
      evt.preventDefault();
     }
    if (attempt.stopped == false){
      attempt.stopped = true;
      playheadFrame = 0;
    } else {
      attempt.stopped = false;
    }
  }
}

// load sample audio asynchronously into targetAudioBuffer
function loadSampleAudio(url) {
  prompt.innerHTML = 'Loading';
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  request.onload = function() {
    audioContext.decodeAudioData(request.response, function(buffer) {
      target.audioBuffer = buffer;
      target.processAudioBuffer();
    }, function(e) {
      prompt.innerHTML = 'Error loading mp3';
      console.log(e);
    });
  };
  request.send();
}

// create a new audio source using getUserMedia()
function enableMicrophone() {
  // get focus away from button
  document.querySelector('body').focus();
  navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
  navigator.getUserMedia ({audio: true},
    function(stream) {
      if (attempt.source) {
        attempt.source.stop(0.0);
        target.source.disconnect();
      }
      attempt.source = audioContext.createMediaStreamSource(stream);
      attempt.source.connect(attempt.analyser);
      attempt.source.connect(attempt.spn);
      attempt.spn.connect(audioContext.destination); // connect to destination, else it isn't called
      attempt.source.connect(audioContext.destination);
      // viz.analyser = attempt.analyser;
      // viz.start();
    },
    function(e) { 
      console.log(e); 
    }
  );  
}

