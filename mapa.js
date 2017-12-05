
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

	var linha = obterLinha();
	if(linha !== null && linha !== '' && linha !== undefined){
		map.data.loadGeoJson('back-end/public/linha/' + linha);
	}
}

function getCircle(segundosAtras) {
	return {
		path: google.maps.SymbolPath.CIRCLE,
		fillColor: 'red',
		fillOpacity: 15/(15+segundosAtras),
		scale: 13,
		strokeColor: 'white',
		strokeWeight: 0.5
	};
}

function obterLinha(){
	var url = new URL(window.location.href);
	return url.searchParams.get('linha');
}