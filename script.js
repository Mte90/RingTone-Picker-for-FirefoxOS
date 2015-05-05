'use strict';
var storages = navigator.getDeviceStorages('sdcard');

if (storages.length === 1) {
  var files = storages[0].enumerate();
} else if (storages.length > 1) {
  var files = storages[storages.length - 1].enumerate();
}

var player = new Audio();  // So the user can preview the tones
var selectedRadioButton = null;  // Which radio button was clicked on
var setButton = document.getElementById('set');

if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
  var ffversion = new Number(RegExp.$1); //gets browser version
  //Gecko 26 it'us used in Firefox 1.2 so the prior version not working
  if (ffversion < 26) {
    setButton.style.display = 'none';
    document.getElementById('cancel').style.display = 'none';
    document.getElementById('deprecated').style.display = 'block';
    throw new Error('This is not an error. This is just to abort javascript');
  }
}

document.getElementById('permission').style.display = 'none';

player.onerror = function (e) {
  switch (e.target.error.code) {
    case e.target.error.MEDIA_ERR_ABORTED:
      alert('You aborted the video playback.');
      break;
    case e.target.error.MEDIA_ERR_NETWORK:
      alert('A network error caused the audio download to fail.');
      break;
    case e.target.error.MEDIA_ERR_DECODE:
      alert('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
      break;
    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
      alert('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
      break;
    default:
      alert('An unknown error occurred.');
      break;
  }
};

// Loop through the ringtones and create a labelled radio button for each
files.onsuccess = function () {
  var files = this.result;
  if (this.result) {
    if (files !== null && files.name.split('.').pop() === 'ogg') {
      document.getElementById('ogg').style.display = 'none';
      var label = document.createElement('label');
      var radioButton = document.createElement('input');
      radioButton.type = 'radio';
      radioButton.name = 'ringtones';
      radioButton.dataset.blob = window.URL.createObjectURL(files); // Store ringtone blob in a data attribute
      radioButton.dataset.name = files.name.replace(/^.*[\\\/]/, ''); // Ditto for ringtone name.
      radioButton.dataset.mimetype = 'audio/' + files.name.split('.').pop(); //Set the mimetype
      var text = document.createElement('span');
      text.innerHTML = radioButton.dataset.name;
      label.appendChild(text);
      label.appendChild(radioButton);

      // We'll list the ringtones inside this element
      var container = document.getElementById('ringtones');
      container.appendChild(label);
      // Each radio button has this event handler.
      radioButton.onchange = radioButtonChangeHandler;
    }

    this.continue();

  } else {
    var child = document.getElementById('ringtones').childElementCount;
    if (child > 0) {
      var nodeList = document.querySelectorAll('.alert');
      for (var i = 0, length = nodeList.length; i < length; i++) {
        nodeList[i].style.display = 'none';
      }
      document.querySelector('.spinner').style.display = 'none';
    } else {
      document.getElementById('ogg').style.display = 'block';
      document.querySelector('.spinner').style.display = 'none';
      document.querySelector('#set').style.display = 'none';
    }
  }
};

files.onerror = function () {
  document.getElementById('ogg').style.display = 'none';
};

// When the user clicks a radio button, this is how we handle it.
function radioButtonChangeHandler(e) {
  player.type = e.target.dataset.mimetype; //Set MimeType
  player.src = e.target.dataset.blob; //Set the blob for the player
  player.play();// Play the ringtone
  setButton.disabled = false; // Enable the Set button
  selectedRadioButton = e.target.dataset;
}

// This app has role="system" in the manifest and has no launch_path
// property in the manifest. This means that the user will not see it
// on the homescreen and it can not be launched like an ordinary app.
//
// It does register to handle the "pick" activity in the manifest file
// though, so if we are running it means that the user has asked to
// pick a ringtone from us. We wait until we receive a system message
// named 'activity' before we do anything. This message will give us
// the Activity object we use to return a ringtone to the user
navigator.mozSetMessageHandler('activity', function (activity) {

  // If the user clicks Cancel, we terminate the activity with an error.
  // Calling postError() will make this app exit.
  document.getElementById('cancel').addEventListener('click', function () {
    player.stop();// Stop the ringtone
    activity.postError('canceled');
  });

  // If the user clicks the Set button, we get the ringtone audio file
  // as a Blob and pass it and the ringtone name back to the invoking app.
  document.getElementById('set').addEventListener('click', function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', selectedRadioButton.blob);
    xhr.responseType = 'blob'; // We want the result as a Blob.
    xhr.overrideMimeType(selectedRadioButton.mimetype); // Important! Set Blob type correctly.
    xhr.send();
    xhr.onload = function () { // When we get the blob
      player.stop();// Stop the ringtone
      activity.postResult({// We post it to the invoking app
        blob: xhr.response,
        name: selectedRadioButton.name
      });
    };
  });

});
