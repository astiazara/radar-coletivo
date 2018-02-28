
var map;
var MAXIMO_SEGUNDOS_ATRAS = 3 * 60;

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

	controlUI.addEventListener('click', function() {
		window.location.assign("linhas-ativas.html");
	});
}

function criarControle(){
	var centerControlDiv = document.createElement('div');
	var centerControl = new CenterControl(centerControlDiv, map);

	centerControlDiv.index = 1;
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
}

function initMap() {
	buscarMaximoTempoAtrasEmMinutos();
	
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 15,
		center: {lat: -30.040301, lng: -51.228566}
	});
		
	criarControle();
	
	definirEstilo();

	apresentarLinhaContinuamenteSeExiste();
	
	centralizarNaPosicaoUsuario();
}

function centralizarNaPosicaoUsuario(){
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(posicaoUsuarioRecebida);
	}
}

function posicaoUsuarioRecebida(position) {
	var centro = {lat: position.coords.latitude, lng: position.coords.longitude};
	map.setCenter(centro);
}

function apresentarLinhaContinuamenteSeExiste(){
	if(existeLinha()){
		apresentarLinha();
	
		setInterval(
			function(){
				apresentarLinha();
			}, 4000);
	}
}

function existeLinha(){
	var linha = obterLinha();
	return (linha !== null && linha !== '' && linha !== undefined);
}

function apresentarLinha(){
	var antigos = obterFeatures();
	map.data.loadGeoJson('back-end/public/linha-ativa/' + obterLinha(), 
											 null,
											 function(featuresNovas){ 
												setTimeout(function(){
													removerFeatures(antigos);
												}, 600);
											 });
}

function obterFeatures(){
	var features = [];
	map.data.forEach(
		function (feature) {
			features.push(feature);
		});
	return features;
}

function removerFeatures(features){
	for(var i in features){
		map.data.remove(features[i]);
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
		fillOpacity: 1,
		scale: calcularValorGrafico(2, 20, segundosAtras),
		strokeColor: 'red',
		strokeWeight: 0.0
	};
}

function obterLinha(){
	return getParameterByName('linha');
}

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function buscarMaximoTempoAtrasEmMinutos() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if(this.readyState == 4 && this.status == 200) {
				var maximoMinutosAtras = parseInt(this.responseText);
        MAXIMO_SEGUNDOS_ATRAS = maximoMinutosAtras * 60;
				console.warn("Exibindo dados de no máximo " + maximoMinutosAtras + " minuto(s) atrás.")
     }
  };
  xhttp.open("GET", "back-end/public/maximo-tempo-atras-em-minutos", true);
  xhttp.send();
}

function calcularValorGrafico(minimoGrafico, maximoGrafico, segAtras){
	// Descobrindo o intervalo gráfico.
	var intervaloGrafico = maximoGrafico - minimoGrafico;
	// Convertendo de seg para valor gráfico.
	var valor = (segAtras * intervaloGrafico) / MAXIMO_SEGUNDOS_ATRAS;
	// Invertendo porque queremos que zero seja o maior.
	valor = intervaloGrafico - valor;
	// Aplicando exponenciação para fazer melhor decaimento.
	valor = Math.pow(valor/(intervaloGrafico/Math.sqrt(Math.sqrt(intervaloGrafico))), 4);
	// Adicionando o valor mínimo gráfico.
	valor += minimoGrafico;
	return valor;
}
