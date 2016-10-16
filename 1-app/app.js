// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This code is a mix of these three sample programs:
// https://github.com/spark/google-cloud-datastore-tutorial/blob/master/tutorial.js
// https://cloud.google.com/appengine/docs/flexible/nodejs/writing-and-responding-to-pub-sub-messages
// https://cloud.google.com/appengine/docs/flexible/nodejs/using-cloud-datastore

// [START app]
'use strict';

// [START setup]

var express = require('express');

var app = express();

// I'm not really sure if this is needed
app.enable('trust proxy');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
// These environment variables are set automatically on Google App Engine
var Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
var datastore = Datastore();

//By default, the client will authenticate using the service account file
//specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
//the project specified by the GCLOUD_PROJECT environment variable. See
//https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
//These environment variables are set automatically on Google App Engine
var PubSub = require('@google-cloud/pubsub');

//Instantiate a pubsub client
var pubsub = PubSub();

//The following environment variables are set by app.yaml when running on GAE,
//but will need to be manually set when running locally.
var PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;

var topic = pubsub.topic(process.env.PUBSUB_TOPIC);

var subscription = pubsub.subscription(process.env.PUBSUB_SUBSCRIPTION_NAME);

// [END setup]

// This code from here:
// https://github.com/spark/google-cloud-datastore-tutorial/blob/master/tutorial.js
function storeEvent(message) {
    var key = datastore.key('ParticleEvent');

    // You can uncomment some of the other things if you want to store them in the database
    var obj = {
		// gc_pub_sub_id: message.id,
		// device_id: message.attributes.device_id,
		// event: message.attributes.event,
		published_at: message.attributes.published_at
	}

    // Copy the data in message.data, the Particle event data, as top-level 
    // elements in obj. This breaks the data out into separate columns.
    for (var prop in message.data) {
        if (message.data.hasOwnProperty(prop)) {
            obj[prop] = message.data[prop];
        }
    }
   
    datastore.save({
        key: key,
        data: obj
    }, function(err) {
		if(err) {
			console.log('There was an error storing the event', err);
		}
		console.log('stored in datastore', obj);
    });

};

subscription.on('message', function(message) {
	console.log('event received', message);
	// Called every time a message is received.
	// message.id = ID used to acknowledge its receival.
	// message.data = Contents of the message.
	// message.attributes = Attributes of the message.
	storeEvent(message);
	message.ack();
});

// [START listen]
var server = app.listen(process.env.PORT || 8080, function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
// [END listen]
// [END app]

module.exports = app;
