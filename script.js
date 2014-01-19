if (navigator.mozApps) {
	var checkIfInstalled = navigator.mozApps.getSelf();
	checkIfInstalled.onsuccess = function() {
		if (!checkIfInstalled.result) {
			navigator.mozApps.install('manifest.webapp');
		}
	};
	checkIfInstalled.onerror = function() {
		// Display error name from the DOMError object
		navigator.mozApps.install('manifest.webapp');
	};
}

var files = navigator.getDeviceStorage('sdcard').enumerate();
var player = new Audio();          // So the user can preview the tones
var selectedRadioButton = null;    // Which radio button was clicked on

// Loop through the ringtones and create a labelled radio button for each.
files.onsuccess = function(e) {
	var file = this.result;
	if (file != null && file.name.split('.').pop() === 'ogg') {
		var label = document.createElement('label');
		var radioButton = document.createElement('input');
		radioButton.type = 'radio';
		radioButton.name = 'ringtones';
		radioButton.dataset.url = file.name;   // Store ringtone url in a data attribute
		radioButton.dataset.name = file.name.replace(/^.*[\\\/]/, ''); // Ditto for ringtone name.
		label.appendChild(document.createTextNode(radioButton.dataset.name));
		label.appendChild(radioButton);

		// We'll list the ringtones inside this element
		var container = document.getElementById('ringtones');
		container.appendChild(label);
		// Each radio button has this event handler.
		radioButton.onchange = radioButtonChangeHandler;
		this.done = false;
	}
	else {
		this.done = true;
	}

	if (!this.done) {
		this.continue();
	}
}
files.onerror = function() {
	console.warn("No file found: " + this.error);
}

// When the user clicks a radio button, this is how we handle it.
function radioButtonChangeHandler(e) {
	console.log('play');
	var setButton = document.getElementById('set');
	var button = e.target;
	var player = new Audio(); 
	player.src = button.dataset.url;  // Play the ringtone
	console.log(player.play());
	if (button.checked) {
		selectedRadioButton = button;     // Remember most recent selection
		setButton.disabled = false;       // Enable the Set button
	}
}
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
		// This is a normal XHR, but it gets data from within our packaged app.
		var xhr = new XMLHttpRequest();
		xhr.open('GET', selectedRadioButton.dataset.url);
		xhr.responseType = 'blob';         // We want the result as a Blob.
		xhr.overrideMimeType('audio/ogg'); // Important! Set Blob type correctly.
		xhr.send();
		xhr.onload = function() {          // When we get the blob
			activity.postResult({// We post it to the invoking app
				blob: xhr.response,
				name: selectedRadioButton.dataset.name
			});
		}
	}
});
