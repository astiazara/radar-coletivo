"use strict"

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

//-------------------------------

var linhasRecentes = [];

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
	if(linhasRecentes.find(function(valor){ return valor === linha;})){
		return;
	}
	
	if(linhasRecentes.push(linha) === 7){
		linhasRecentes.shift();
	}
	
	setCookie("parada", linhasRecentes.join("|"), 30 * 4);
}

function pesquisarLinhas(textoDigitado){
  if(textoDigitado == null ||
    textoDigitado === ""){
    apresentarLinhas(linhasRecentes);
		return;
  }
  
  var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var linhas = JSON.parse(this.responseText);
  			apresentarLinhas(linhas);
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
  
  navigator.geolocation.getCurrentPosition(function(position){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 201) {
          apresentarResposta(this.responseText);
          botao.firstElementChild.className = "fa fa-check fa-2x";
          botao.firstElementChild.style="color:green";
          botao.disabled = false;
          setTimeout(function(){ botao.firstElementChild.className = "fa fa-map-marker fa-2x";}, 10000);
       }
    };
    xhttp.open("POST", "back-end/public/linhas-ativas", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("linha=" + linha + "&lat=" + position.coords.latitude + "&lng=" + position.coords.longitude);
  });
}

function apresentarResposta(responseText){
	console.warn("Foi! Resposta: " + responseText);
}
