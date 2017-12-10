<?php

use Slim\Http\Request;
use Slim\Http\Response;

// Routes

// $app->get('/[{name}]', function (Request $request, Response $response, array $args) {
//     // Sample log message
//     $this->logger->info("Slim-Skeleton '/' route");

//     // Render index view
//     return $this->renderer->render($response, 'index.phtml', $args);
// });

define("MAXIMO_TEMPO_ATRAS_EM_MINUTOS", 5);

$app->get('/maximo-tempo-atras-em-minutos', function (Request $request, Response $response, array $args) {
  $response->getBody()->write(MAXIMO_TEMPO_ATRAS_EM_MINUTOS);
  return $response;
});

$app->get('/linhas-ativas', function (Request $request, Response $response, array $args) {
    
  $conn = criarConexao();

  $sqlConsultaLinhas = 
    "SELECT distinct linha FROM rastro WHERE TIMESTAMPDIFF(MINUTE, datahora, NOW()) <= " .
    MAXIMO_TEMPO_ATRAS_EM_MINUTOS . " ORDER BY linha";
  $stmt = $conn->prepare($sqlConsultaLinhas);
  $stmt->execute();
  $resultSet = $stmt->fetchAll();

  $response = $response->withJson(array_column($resultSet, 0));
  return $response;
});

$app->get('/linha/[{id}]', function (Request $request, Response $response, array $args) {
  $id = $args['id'];

  $conn = criarConexao();
  $sqlConsultaLinha = 
    "SELECT TIMESTAMPDIFF(SECOND, datahora, NOW()) AS segAtras, lat, lng FROM rastro " . 
    "WHERE TIMESTAMPDIFF(MINUTE, datahora, NOW()) <= " . MAXIMO_TEMPO_ATRAS_EM_MINUTOS . " AND linha = :linha " .
    " ORDER BY datahora";
  $this->logger->info($sqlConsultaLinha);
  $stmt = $conn->prepare($sqlConsultaLinha);
  $stmt->bindParam("linha", $id);
  $stmt->execute();
  $pontos = array();
  
  foreach ($stmt->fetchAll() as $row) {
    $this->logger->info($row["segAtras"]);
    $pontos[] = criarPonto($row["segAtras"], floatval($row["lat"]), floatval($row["lng"]));
  }
  
  $response = $response->withJson(criarColecaoPontos($pontos));
  return $response;
});

function criarPonto($segundosAtras, $latitude, $longitude){
  return array("type"=>"Feature", 
               "properties"=>array(
                 "segAtras"=>$segundosAtras), 
               "geometry"=>array(
                 "type"=>"Point", 
                 "coordinates"=>array($longitude, $latitude)
               ));
}

function criarColecaoPontos($pontos){
  return array("type"=>"FeatureCollection",
               "features"=> $pontos);
}

$app->post('/linhas-ativas','criarRastro');

function criarConexao(){
  return new PDO('mysql:host=localhost;dbname=radarcoletivo',
      'app',
      'p47ArJMX4FF9XUZM',
      array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8")
    );
}

function criarRastro(Request $request, Response $response, array $args) {
  $data = $request->getParsedBody();
  $linha = filter_var($data['linha'], FILTER_SANITIZE_STRING);
  $lat =  filter_var($data['lat'], FILTER_SANITIZE_STRING);
  $lng =  filter_var($data['lng'], FILTER_SANITIZE_STRING);
  
  $conn = criarConexao();
  
  $sqlConsultaLinha = "SELECT COUNT(*) FROM linha WHERE id = :linha";
  $stmt = $conn->prepare($sqlConsultaLinha);
  $stmt->bindParam("linha", $linha);
  $stmt->execute();
  $linhaExiste = $stmt->fetchColumn();
  
  if($linhaExiste){
    $sqlInsert = "INSERT INTO rastro (datahora, linha, lat, lng) values (NOW(), :linha, :lat, :lng) ";
    $stmt = $conn->prepare($sqlInsert);
    $stmt->bindParam("linha", $linha);
    $stmt->bindParam("lat", $lat);
    $stmt->bindParam("lng", $lng);
    $stmt->execute();

    $response->getBody()->write("Recebida a linha " . $linha);
    $response = $response->withStatus(201);
  } else {
    $response->getBody()->write("Nao existe a linha " . $linha);
    $response = $response->withStatus(404);
  }
  return $response;
}