"use strict"

var linha;
var contadorRegressivoTempo;
var relogio1Segundo;
var txtCronometro;
var maximoTempo;


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

function iniciarSeValido(){
  parar();
  if(validar()){
    iniciar();
  }
}

function validar(){
  var txtLinhaDigitada = document.getElementById("linhaDigitada");
	linha = txtLinhaDigitada.value;
	
	if(linha === null || linha === ""){
		txtLinhaDigitada.focus();
		return false;
	}
	
	if(linha.length < 2){
		mostrarAviso("Isto não parece ser um número de linha.");
		return false;
	}
	
	linha = linha.toUpperCase();
  maximoTempo = 60 * document.getElementById("maximoTempo").value;
	esconderAviso();
  return true;
}

function mostrarAviso(textoAviso){
	document.getElementById("textoAviso").innerHTML = textoAviso;
	mostrar("aviso");
}
function esconderAviso(){
	esconder("aviso");
}

function iniciar(){
  document.getElementById("tituloRastreando").innerHTML = "Rastreando linha " + linha;
  
  prepararCronometro();
  
  relogio1Segundo = setInterval(aCadaSegundo, 1000);
  
  esconder("formulario");
  mostrar("rastreador");
  
  navigator.geolocation.getCurrentPosition(recebeuGeoLocalizacao);
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
  txtCronometro.innerHTML = contadorRegressivoTempo;
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
	var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if(this.readyState == 4 && this.status == 201) {
          apresentarResposta(this.responseText);
     }
  };
  xhttp.open("POST", "back-end/public/linhas-ativas", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhttp.send("linha=" + linha + "&lat=" + position.coords.latitude + "&lng=" + position.coords.longitude); 
}

function apresentarResposta(responseText){
	console.warn("Foi! Resposta: " + responseText);
}