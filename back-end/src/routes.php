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
define("LIMITE_PONTOS_SNAP", 100);

function limparDadosAntigos($conexao){
  if(random_int(0, 3) == 0){
    $conexao->exec("DELETE FROM rastro WHERE TIMESTAMPDIFF(HOUR, datahora, NOW()) > 12");
  }
}

$app->get('/maximo-tempo-atras-em-minutos', function (Request $request, Response $response, array $args) {
  $response->getBody()->write(MAXIMO_TEMPO_ATRAS_EM_MINUTOS);
  return $response;
});

$app->get('/linhas', function (Request $request, Response $response, array $args) {
  $q = filter_var($request->getQueryParam("q"), FILTER_SANITIZE_STRING);
  $q = str_replace("%", "", trim($q));
  
  if(!ehStringVazia($q)){
    $conexao = criarConexao($this);

    $sql = "SELECT id "
      . "FROM linha "
      . "WHERE id like :q "
      . "order by length(id), id "
      . "limit 0, 6";
    $stmt = $conexao->prepare($sql);
    $q = $q . "%";
    $stmt->bindParam("q", $q, PDO::PARAM_STR, 7);
    $stmt->execute();
    $resultSet = $stmt->fetchAll();
    $linhas = array_column($resultSet, 0);
  }
  
  $response = $response->withJson($linhas);
  return $response;
});

function ehStringVazia($q){
  return ($q == null || $q == "");
}

$app->get('/linhas-ativas', function (Request $request, Response $response, array $args) {
    
  $conexao = criarConexao($this);
  limparDadosAntigos($conexao);
  
  $sqlConsultaLinhas = 
    "SELECT distinct linha FROM rastro WHERE TIMESTAMPDIFF(MINUTE, datahora, NOW()) <= " .
    MAXIMO_TEMPO_ATRAS_EM_MINUTOS . " ORDER BY linha";
  $stmt = $conexao->prepare($sqlConsultaLinhas);
  $stmt->execute();
  $resultSet = $stmt->fetchAll();
  
  $response = $response->withJson(array_column($resultSet, 0));
  return $response;
});

$app->get('/linha-ativa/[{id}]', function (Request $request, Response $response, array $args) {
  $id = filter_var($args['id'], FILTER_SANITIZE_STRING);

  if(!ehStringVazia($id)){    
    $conexao = criarConexao($this);
    $sqlConsultaLinha = 
      "SELECT TIMESTAMPDIFF(SECOND, datahora, NOW()) AS segAtras, lat, lng FROM rastro " . 
      "WHERE TIMESTAMPDIFF(MINUTE, datahora, NOW()) <= " . MAXIMO_TEMPO_ATRAS_EM_MINUTOS . " AND linha = :linha " .
      " ORDER BY datahora";
    $stmt = $conexao->prepare($sqlConsultaLinha);
    $stmt->bindParam("linha", $id);
    $stmt->execute();
    $pontos = array();

    foreach ($stmt->fetchAll() as $row) {
      $pontos[] = criarPonto($row["segAtras"], floatval($row["lat"]), floatval($row["lng"]));
    }

    $response = $response->withJson(criarColecaoPontos($pontos));
  } else {
    $response->getBody()->write("Necessario id");
    $response = $response->withStatus(400);
  }
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

function criarConexao($isso){
  $db = $isso->get('settings')['db'];
  
  return new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['dbname'] ,
      $db['username'],
      $db['password'],
      array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8")
    );
}

$app->post('/linhas-ativas', function (Request $request, Response $response, array $args) {
  $data = $request->getParsedBody();
  
  $linha = filter_var($data['linha'], FILTER_SANITIZE_STRING);
  $caminhoString =  filter_var($data['caminho'], FILTER_SANITIZE_STRING);
  
  if(ehStringVazia($linha) || ehStringVazia($caminhoString)){
    $response->getBody()->write("Necessario parametros linha e caminho.");
    return $response->withStatus(400);
  }
  
  if(parseCaminho($caminhoString) == null){
    $response->getBody()->write("Caminho mal formado.");
    return $response->withStatus(400);
  }
  
  $conexao = criarConexao($this);
  
  $sqlConsultaLinha = "SELECT COUNT(*) FROM linha WHERE id = :linha";
  $stmt = $conexao->prepare($sqlConsultaLinha);
  $stmt->bindParam("linha", $linha);
  $stmt->execute();
  $linhaExiste = $stmt->fetchColumn();
  
  if($linhaExiste){
    $ajustado = snapToRoad($this, $caminhoString);
    $lat = $ajustado["lat"];
    $lng = $ajustado["lng"];
    
    $sqlInsert = "INSERT INTO rastro (datahora, linha, lat, lng) values (NOW(), :linha, :lat, :lng) ";
    $stmt = $conexao->prepare($sqlInsert);
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
});

function parseCaminho($caminhoString){
  if(ehStringVazia($caminhoString)){
    return null;
  }
  
  $pontos = explode("|", $caminhoString);
  $totalPontos = count($pontos);
  if($totalPontos == 0 || $totalPontos > LIMITE_PONTOS_SNAP){
    return null;
  }
  
  $caminho = array();
  foreach($pontos as $pontoString) {
    if(ehStringVazia($pontoString)){
      return null;
    }

    $pontos = explode(",", $pontoString);
    $totalCoordenadas = count($pontos);
    if($totalCoordenadas != 2){
      return null;
    }
    
    array_push($caminho, array("lat" => $pontos[0], "lng" => $pontos[1]));
  }
  
  return $caminho;
}

function snapToRoad($isso, $caminhoString){
  $resultadoJson = callAPI("GET", 
    "https://roads.googleapis.com/v1/snapToRoads",
     array("path"=>$caminhoString, "key"=>"AIzaSyAFtfPIazR_sUwJYjYEDzALPJvdQ50xPd4"));
  $resultado = json_decode($resultadoJson);
  
  $totalSnappedPoints = count($resultado->snappedPoints);
  if($totalSnappedPoints > 0){
    $ultimo = $totalSnappedPoints - 1;
    $lat = $resultado->snappedPoints[$ultimo]->location->latitude;
    $lng = $resultado->snappedPoints[$ultimo]->location->longitude;
  } else {
    $isso->logger->info("Falhou snaptoRoad");
    $caminho = parseCaminho($caminhoString);
    $ultimo = count($caminho) - 1;
    $lat = $caminho[$ultimo];
    $lng = $caminho[$ultimo];
  }
  
  return array("lat"=>$lat, "lng"=>$lng);
}

$app->get('/teste', function (Request $request, Response $response, array $args) {
  $c = filter_var($request->getQueryParam("c"), FILTER_SANITIZE_STRING);
  
  if($c == null || $c == ""){
    $response->getBody()->write("Necessario parametro c");
    return $response->withStatus(400);
  } else {
    $ajustado = snapToRoad($this, $c);
    $response->getBody()->write($ajustado["lat"] . ", " . $ajustado["lng"]);
    return $response;
  }
});


// Method: POST, PUT, GET etc
// Data: array("param" => "value") ==> index.php?param=value

function callAPI($method, $url, $data = false){
    $curl = curl_init();

    switch ($method)
    {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);

            if ($data)
                curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
            break;
        case "PUT":
            curl_setopt($curl, CURLOPT_PUT, 1);
            break;
        default:
            if ($data)
                $url = sprintf("%s?%s", $url, http_build_query($data));
    }

    // Optional Authentication:
    //curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    //curl_setopt($curl, CURLOPT_USERPWD, "username:password");

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

    $result = curl_exec($curl);

    curl_close($curl);

    return $result;
}
