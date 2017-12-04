"use strict";

var contador;
var id;

function imprimir(texto){
	var saida = document.getElementById("saida");
	saida.innerHTML += '<br/>' + texto;
}

function iniciarSePossivel(){
	if(podeIniciar()){
		iniciar();
	}
}

function iniciar(){
	contador = 5;
	imprimir('Iniciado!');
	navigator.geolocation.getCurrentPosition(mostrarPosicao);
}

function podeIniciar(){
	if(navigator.geolocation) {
        return true;
	} else {
		imprimir('Geolocalização não suportada/autorizada');
	}
}

function mostrarPosicao(position) {
    imprimir('Contador: ' + contador);
    imprimir("Latitude: " + position.coords.latitude + 
		" Longitude: " + position.coords.longitude); 
	contador--;
	if(contador > 0){
		id = setInterval(
			function(){
				navigator.geolocation.getCurrentPosition(mostrarPosicao);
				clearInterval(id);
			}, 5000);
	} else {
		imprimir('Terminado!');
	}
}
