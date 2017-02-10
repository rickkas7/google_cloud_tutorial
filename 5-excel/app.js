
// [START app]
'use strict';

// [START setup]

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
// These environment variables are set automatically on Google App Engine
var Datastore = require('@google-cloud/datastore');

// Instantiate a datastore client
var datastore = Datastore();

// Excel workbook 
var XLSX = require('xlsx');

var colNames = ['a', 'b', 'c', 'published_at'];

const query = datastore.createQuery('ParticleEvent')
.limit(100)
.order('published_at', {
  descending: true
});

datastore.runQuery(query, function(err, entities, info) {
	if (err) {
		// Error handling omitted.
		console.log("error");
		return;
    }
	
	// console.log('got results ' + entities.length);
	
	// Prepare worksheet
	var ws_name = 'SheetJS';
	var wb = {'SheetNames':[], 'Sheets':{}};
	var ws = {};
	
	// Fill in cells
	for(var ii = 0; ii < entities.length; ii++) {
		var data = entities[ii].data;
		
		for(var jj = 0; jj < colNames.length; jj++) {
			var cell = {};
			var cell_ref = XLSX.utils.encode_cell({c:jj,r:ii});
			cell.v = data[colNames[jj]];
			
			if (typeof cell.v === 'number') {
				cell.t = 'n';
			}
			else if (typeof cell.v === 'boolean') {
				cell.t = 'b';
			}
			else if (cell.v instanceof Date || jj == 3) {
				cell.t = 'n';
				cell.z = 'm/d/yy';
				cell.v = datenum(cell.v);
			}
			else {
				cell.t = 's';
			}
						
			ws[cell_ref] = cell;
		}
	}
	// This is important, otherwise the sheet will probably show up as empty
	var range = {s:{c:0, r:0}, e:{c:colNames.length, r:entities.length}}; 
	ws['!ref'] = XLSX.utils.encode_range(range);
	
	// Create 
	wb.SheetNames.push(ws_name);
	wb.Sheets[ws_name] = ws;
	XLSX.writeFile(wb, 'out.xlsx', { bookType:'xlsx', bookSST:false, type:'binary' });
});

function datenum(v, date1904) {
	if(date1904) v+=1462;
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
