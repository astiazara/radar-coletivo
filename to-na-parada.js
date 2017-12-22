
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//--- Terceiros

function mostrar(elemento){
  document.getElementById(elemento).style.display = "block";
}

function mostrarErro(status, textoErro){
	document.getElementById("textoErro").innerHTML = "Erro ao processar requisição. Status: " + 
		status + " Resposta do servidor: " + textoErro;
	mostrar("erro");
}

//--- Minhas

var linhasRecentes = [];
var textoLimpo = false;
var idDigitacaoTimeout;
var map;
var marker;

function initMap() {	
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 19,
		center: {lat: -30.040301, lng: -51.228566},
		disableDefaultUI: true
	});
	
	marker = new google.maps.Marker({
    position: map.center,
		animation: google.maps.Animation.DROP,
		draggable: true,
    map: map
  });
	
	map.addListener('click', function(e) {
		e.stop();
    marker.setPosition(e.latLng);
  });
	
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
	marker.setPosition(centro);
}

function lerEApresentarLinhasRecentes(){
	lerLinhasRecentes();
	apresentarLinhas(linhasRecentes);
}

function lerLinhasRecentes(){
	var cookie = getCookie("parada");
	if(cookie !== ""){
		linhasRecentes = cookie.split("|");
	}
}

function adicionarLinhaRecente(linha){
	linhasRecentes = linhasRecentes.filter(function(valor){ return valor !== linha;});
	
	if(linhasRecentes.unshift(linha) > 6){
		linhasRecentes.pop();
	}
	
	setCookie("parada", linhasRecentes.join("|"), 30 * 4);
}

function onKeyUp(){
	clearTimeout(idDigitacaoTimeout);
	idDigitacaoTimeout = setTimeout(function(){
		pesquisarLinhas(document.getElementById("linhaDigitada").value);
	}, 600);
}

function onKeyDown(){
	clearTimeout(idDigitacaoTimeout);
}

function pesquisarLinhas(textoDigitado){
  if(textoDigitado == null ||
    textoDigitado === ""){
		textoLimpo = true;
    apresentarLinhas(linhasRecentes);
		return;
  }
  
	textoLimpo = false;
  var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200) {
				if(!textoLimpo){
					var linhas = JSON.parse(this.responseText);
					apresentarLinhas(linhas);
				}
			}
	};
	xmlhttp.open("GET", "back-end/public/linhas?q=" + textoDigitado, true);
	xmlhttp.send();
}

function apresentarLinhas(linhasAtivas){
  var botoes = "";
  for(var i in linhasAtivas) { 
    botoes += criarBotao(linhasAtivas[i]);
  }
  document.getElementById("resultado").innerHTML = botoes;
}

function criarBotao(linha){
  return "<button onclick=\"enviarLinha(this, '" + linha + "')\"" + 
    "\" class=\"w3-bar-item w3-button w3-round-large w3-white w3-border\" style=\"width:100px\"><i class=\"fa fa-map-marker fa-2x\"></i><br><b>" + linha + "</b></button>";
}

function enviarLinha(botao, linha){
	adicionarLinhaRecente(linha);
	
  botao.disabled = true;
  botao.firstElementChild.className = "fa fa-refresh fa-2x fa-spin";

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 201) {
				apresentarResposta(this.responseText);
				botao.firstElementChild.className = "fa fa-check fa-2x";
				botao.firstElementChild.style="color:green";
				botao.disabled = false;
				setTimeout(function(){ botao.firstElementChild.className = "fa fa-map-marker fa-2x";}, 10000);
		 } else if(this.readyState == 4 && this.status != 201){
				mostrarErro(this.status, this.responseText); 
		 }
	};
	xhttp.open("POST", "back-end/public/linhas-ativas", true);
	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send("linha=" + linha + "&caminho=" + marker.position.lat() + "," + marker.position.lng());
}

function apresentarResposta(responseText){
	console.warn("Foi! Resposta: " + responseText);
}
