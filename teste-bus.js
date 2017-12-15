
var map;
var caminho = [];
var linhaAtual = '178';

function initMap() {	
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		center: {lat: -30.040301, lng: -51.228566}
	});
	
	centralizarNaPosicaoUsuario();
	
	map.addListener('click', function(e) {
			placeMarker(e.latLng, map);
		});
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

function placeMarker(latLng, map) {
	var marker = new google.maps.Marker({
		position: latLng,
		map: map
	});
	enviarRastreamento(latLng);
}

function enviarRastreamento(latLng){
	console.warn(latLng.lat() + ", " + latLng.lng())
	adicionarPonto(latLng.lat(), latLng.lng());
	
	var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if(this.readyState == 4 && this.status == 201) {
          apresentarResposta(this.responseText);
     }
  };
  xhttp.open("POST", "back-end/public/linhas-ativas", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send("linha=" + linhaAtual + "&caminho=" + toStringCaminho()); 
}

function adicionarPonto(lat, lng){
	if(caminho.push({"lat": lat, "lng": lng}) > 100){
		caminho.shift();
	}
}

function toStringCaminho(){
	var texto = "";
	var separador = "";
	caminho.forEach(function(item, index) {
    	texto += separador + item.lat + "," + item.lng; 
			separador = "|";
		});
	return texto;
}

function apresentarResposta(responseText){
	console.warn("Foi! Resposta: " + responseText);
}
