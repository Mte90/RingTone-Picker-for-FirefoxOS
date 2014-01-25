//
// This app has role="system" in the manifest and has no launch_path
// property in the manifest. This means that the user will not see it
// on the homescreen and it can not be launched like an ordinary app.
//
// It does register to handle the "pick" activity in the manifest file
// though, so if we are running it means that the user has asked to
// pick a ringtone from us. We wait until we receive a system message
// named 'activity' before we do anything. This message will give us
// the Activity object we use to return a ringtone to the user
//

navigator.mozSetMessageHandler('activity', function(activity) {
  alert('Pick the ringtone :-D');
  var files = navigator.getDeviceStorage('sdcard').enumerate();
  var player = new Audio();  // So the user can preview the tones
  var selectedRadioButton = null;  // Which radio button was clicked on

  player.onerror = function(e) {
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

// Loop through the ringtones and create a labelled radio button for each.
  files.onsuccess = function(e) {
    var file = this.result;
    if (file.name.split('.').pop() === 'ogg') {
      var label = document.createElement('label');
      var radioButton = document.createElement('input');
      radioButton.type = 'radio';
      radioButton.name = 'ringtones';
      radioButton.dataset.blob = URL.createObjectURL(file); // Store ringtone blob in a data attribute
      URL.revokeObjectURL(e.target.dataset.blob); //Free memory
      radioButton.dataset.name = file.name.replace(/^.*[\\\/]/, ''); // Ditto for ringtone name.
      label.appendChild(document.createTextNode(radioButton.dataset.name));
      label.appendChild(radioButton);

      // We'll list the ringtones inside this element
      var container = document.getElementById('ringtones');
      container.appendChild(label);
      // Each radio button has this event handler.
      radioButton.onchange = radioButtonChangeHandler;
    }
    this.done = false;

    if (!this.done) {
      this.continue();
    }
  };
  files.onerror = function() {
    alert("No file found: " + this.error);
  };

// When the user clicks a radio button, this is how we handle it.
  function radioButtonChangeHandler(e) {
    var setButton = document.getElementById('set');
    player.type = "video/ogg"; //Set MimeType
    player.src = e.target.dataset.blob; //Set the blob for the player
    player.play();// Play the ringtone
    URL.revokeObjectURL(e.target.dataset.blob);
    setButton.disabled = false; // Enable the Set button
    selectedRadioButton = e.target.dataset;
  }

  // These are the Cancel and Set buttons
  var cancelButton = document.getElementById('cancel');
  var setButton = document.getElementById('set');

  // The Cancel and Set buttons also get event handlers
  cancelButton.onclick = cancelHandler;
  setButton.onclick = setHandler;

  // If the user clicks Cancel, we terminate the activity with an error.
  // Calling postError() will make this app exit.
  function cancelHandler() {
    activity.postError('canceled');
  }

  // If the user clicks the Set button, we get the ringtone audio file
  // as a Blob and pass it and the ringtone name back to the invoking app.
  function setHandler() {
    activity.postResult({// We post it to the invoking app
      blob: selectedRadioButton.blob,
      name: selectedRadioButton.name
    });
  }
});
