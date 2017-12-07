
var map;

function CenterControl(controlDiv, map) {
	// Set CSS for the control border.
	var controlUI = document.createElement('div');
	controlUI.style.backgroundColor = '#fff';
	controlUI.style.border = '2px solid #fff';
	controlUI.style.borderRadius = '3px';
	controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
	controlUI.style.cursor = 'pointer';
	controlUI.style.marginBottom = '22px';
	controlUI.style.textAlign = 'center';
	//controlUI.title = 'Click to recenter the map';
	controlDiv.appendChild(controlUI);

	// Set CSS for the control interior.
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = 'Voltar';
	controlUI.appendChild(controlText);

	// Setup the click event listeners: simply set the map to Chicago.
	controlUI.addEventListener('click', function() {
		window.location.assign("index.html")
	});
}

function criarControle(){
	var centerControlDiv = document.createElement('div');
	var centerControl = new CenterControl(centerControlDiv, map);

	centerControlDiv.index = 1;
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		center: {lat: -30.040301, lng: -51.228566}
	});
	
	criarControle();
	
	definirEstilo();

	apresentarLinha();
}

function apresentarLinha(){
	var linha = obterLinha();
	if(linha !== null && linha !== '' && linha !== undefined){
		map.data.loadGeoJson('back-end/public/linha/' + linha);
	}
}

function definirEstilo(){
	map.data.setStyle(function(feature) {
		var segundosAtras = feature.getProperty('segAtras');
		return {
			icon: getCircle(segundosAtras)
		};
	});
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