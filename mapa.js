
var map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		center: {lat: -30.040301, lng: -51.228566}
	});

	map.data.setStyle(function(feature) {
		var segundosAtras = feature.getProperty('segAtras');
		return {
			icon: getCircle(segundosAtras)
		};
	});

	map.data.loadGeoJson('back-end/public/linha/178');
}

function getCircle(segundosAtras) {
	return {
		path: google.maps.SymbolPath.CIRCLE,
		fillColor: 'red',
		fillOpacity: 15/(14+segundosAtras),
		scale: 13,
		strokeColor: 'white',
		strokeWeight: 0.5
	};
}
