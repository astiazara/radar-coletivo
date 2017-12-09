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
  linha = document.getElementById("linhaDigitada").value;
  maximoTempo = 60 * document.getElementById("maximoTempo").value;
  return true;
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
    console.warn("Latitude: " + position.coords.latitude + 
      " Longitude: " + position.coords.longitude); 
  	
    setTimeout(
			function(){
				navigator.geolocation.getCurrentPosition(recebeuGeoLocalizacao);
			}, 10000);
	}
}