
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

function esconder(elemento){
  document.getElementById(elemento).style.display = "none";
}

function mostrarSe(elemento, se){
  if(se){
    mostrar(elemento);
  } else {
    esconder(elemento);
  }
}

//--- Minhas

var linhaAtual;
var contadorRegressivoTempo;
var relogio1Segundo;
var txtCronometro;
var maximoTempo;
var caminho = [];
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
		draggable: false,
    map: map
  });
	
	centralizarNaPosicaoUsuario();
}

function centralizarNaPosicaoUsuario(){
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(centralizarNaPosicaoUsuarioRecebida);
	}
}

function centralizarNaPosicaoUsuarioRecebida(position) {
	var centro = {lat: position.coords.latitude, lng: position.coords.longitude};
	map.setCenter(centro);
	marker.setPosition(centro);
}

function apresentar(){
	parar();
	lerEApresentarMaximoTempo();
	lerEApresentarLinhasRecentes();	
}

function lerEApresentarMaximoTempo(){
	var valor = lerMaximoTempo();
	if(valor !== ""){
		document.getElementById("maximoTempo").value = valor;
	}
}

function lerEApresentarLinhasRecentes(){
	lerLinhasRecentes();
	apresentarLinhas(linhasRecentes);
}

function lerLinhasRecentes(){
	var cookie = getCookie("bus");
	if(cookie !== ""){
		linhasRecentes = cookie.split("|");
	}
}

function adicionarLinhaRecente(linha){
	linhasRecentes = linhasRecentes.filter(function(valor){ return valor !== linha;});
	
	if(linhasRecentes.unshift(linha) > 6){
		linhasRecentes.pop();
	}
	
	setCookie("bus", linhasRecentes.join("|"), 30 * 4);
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

function apresentarLinhas(linhas){
  var botoes = "";
  for(var i in linhas) { 
    botoes += criarBotao(linhas[i]);
  }
  document.getElementById("resultado").innerHTML = botoes;
}

function criarBotao(linha){
  return "<button onclick=\"iniciar('" + linha + "')\"" + 
    "\" class=\"w3-bar-item w3-button w3-round-large w3-white w3-border\" style=\"width:100px\"><i class=\"fa fa-crosshairs fa-2x\"></i><br><b>" + linha + "</b></button>";
}

function iniciar(linha){
	adicionarLinhaRecente(linha);
	
	var maximoTempoEmMinutos = document.getElementById("maximoTempo").value;
	salvarMaximoTempo(maximoTempoEmMinutos);
	
	maximoTempo = 60 * maximoTempoEmMinutos;
	linhaAtual = linha;
  document.getElementById("tituloRastreando").innerHTML = linhaAtual;
  
  prepararCronometro();
  
  relogio1Segundo = setInterval(aCadaSegundo, 1000);
  
  esconder("formulario");
  mostrar("rastreador");
  
  navigator.geolocation.getCurrentPosition(recebeuGeoLocalizacao);
}

function salvarMaximoTempo(valor){
	setCookie("maximoTempo", valor, 30 * 3);
}
function lerMaximoTempo(){
	return getCookie("maximoTempo");
}

function prepararCronometro(){
  mostrarSe("cronometro", maximoTempo > 0);
  txtCronometro = document.getElementById("cronometro");
  contadorRegressivoTempo = maximoTempo;
  apresentarCronometro();
}

function aCadaSegundo(){
  if(contadorRegressivoTempo > 0) {
    contadorRegressivoTempo--;
  }
  
  apresentarCronometro();
  
  if(contadorRegressivoTempo === 0){
    parar();
  }
}

function apresentarCronometro(){
	var textoSegundos = contadorRegressivoTempo < 2 ? "segundo restante" : "segundos restantes"; 
  txtCronometro.innerHTML = contadorRegressivoTempo + " " + textoSegundos;
}

function parar(){
  contadorRegressivoTempo = 0;
  clearInterval(relogio1Segundo);
  
  mostrar("formulario");
  esconder("rastreador");
}

function ativo(){
  return contadorRegressivoTempo !== 0;
}

function recebeuGeoLocalizacao(position) {
  if(ativo()){
		centralizarNaPosicaoUsuarioRecebida(position);
    enviarRastreamento(position);
    solicitarGeoLocalizacaoNovamente();
	}
}

function solicitarGeoLocalizacaoNovamente(){
	setTimeout(
			function(){
				navigator.geolocation.getCurrentPosition(recebeuGeoLocalizacao);
			}, 5000);
}

function enviarRastreamento(position){
	adicionarPonto(position.coords.latitude, position.coords.longitude);
	
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
