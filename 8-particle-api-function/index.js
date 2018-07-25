var Datastore = require('@google-cloud/datastore');

//Instantiate a datastore client
var datastore = Datastore();

//The config file must contain JSON with the key 'AUTH_TOKEN' set to your Particle auth token
const config = require("./config.json");

var Particle = require('particle-api-js');
var particle = new Particle();

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} event The Cloud Functions event.
 * @param {function} callback The callback function.
 */
exports.datastoreApiTest = (event, callback) => {
	const pubsubMessage = event.data;

	// console.log("event", event);

	if (!pubsubMessage.data) {
		console.log("no data");
		callback();
		return;
	}

	var jsonData = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

	// console.log("jsonData", jsonData);

	const datastoreKey = 'ParticleEvent';

	// Code adapted from this:
	// https://github.com/particle-iot/google-cloud-datastore-tutorial/blob/master/tutorial.js
	var key = datastore.key(datastoreKey);
	
	// You can uncomment some of the other things if you want to store them in the database
	var obj = {
			// device_id: pubsubMessage.attributes.device_id,
			// event: pubsubMessage.attributes.event,
			published_at: pubsubMessage.attributes.published_at
	}

	// Copy the data in jsonData, the Particle event data, as top-level 
	// elements in obj. This breaks the data out into separate columns.
	for (var prop in jsonData) {
		if (jsonData.hasOwnProperty(prop)) {
			obj[prop] = jsonData[prop];
		}
	}

	// Save the data in the cloud datastore
	datastore.save({
		key: key,
		data: obj
	}, function(err) {
		if (err) {
			console.log('There was an error storing the event', err);
			callback();
		}
		else {
			console.log('stored in datastore', obj);
			
			// Send this latest value out to all devices
			particle.publishEvent({ name: 'recent', data: JSON.stringify(obj), isPrivate:true, auth: config.AUTH_TOKEN }).then(
				function(data) {
					console.error('publish succeeded', data);
					callback();					
				},
				function(err) {
					console.error('error publishing', err);
					callback();
				});
		}
	});

};
