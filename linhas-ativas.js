"use strict"

function mostrar(elemento){
  document.getElementById(elemento).style.display = "block";
}

function esconder(elemento){
  document.getElementById(elemento).style.display = "none";
}

function mostrarStatusEspera(){
  esconder("semResultado");
  esconder("resultado");
  mostrar("statusEspera");
}

function mostrarResultado(){
  esconder("semResultado");
  esconder("statusEspera");
  mostrar("resultado");
}

function mostrarSemResultado(){
  esconder("statusEspera");
  esconder("resultado");
  mostrar("semResultado");
}

function buscarLinhasAtivas() {
  mostrarStatusEspera();
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if(this.readyState == 4 && this.status == 200) {
          apresentarLinhasAtivas(JSON.parse(this.responseText));
     }
  };
  xhttp.open("GET", "back-end/public/linhas-ativas", true);
  xhttp.send(); 
}

function apresentarLinhasAtivas(linhasAtivas){
  if(linhasAtivas.length === 0){
    mostrarSemResultado();
  } else {
    var botoes = "";
    for(var i in linhasAtivas) { 
      botoes += criarBotao(linhasAtivas[i]);
    }
    document.getElementById("resultado").innerHTML = botoes;
    mostrarResultado();
  }
}

function criarBotao(linha){
  return "<a href=\"mapa.html?linha=" + linha + 
    "\" class=\"w3-bar-item w3-button w3-round-large w3-white w3-border\" style=\"width:100px\"><i class=\"fa fa-bus fa-2x\"></i><br><b>" + linha + "</b></a>";
}