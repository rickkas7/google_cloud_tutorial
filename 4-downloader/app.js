'use strict';

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
// These environment variables are set automatically on Google App Engine
var Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
var datastore = Datastore();

const query = datastore.createQuery('ParticleEvent')
	.limit(100)
	.order('published_at', {
	  descending: true
	});

datastore.runQuery(query, function(err, entities, info) {
	if (err) {
		console.log("database query error", err);
		return;
    }
	
	for(var ii = 0; ii < entities.length; ii++) {
		var data = entities[ii].data;
		
		var csv = data.a + ',' + data.b + ',' + data.c  + ',' + data.published_at;
		console.log(csv);
	}
});


