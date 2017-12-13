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

$app->get('/linhas', function (Request $request, Response $response, array $args) {
  $q = $request->getQueryParam("q");
  $q = filter_var($q, FILTER_SANITIZE_STRING);
  $q = str_replace("%", "", trim($q));
  
  if(validarParametro($q)){
    $conn = criarConexao($this);

    $sql = "SELECT id "
      . "FROM linha "
      . "WHERE id like :q "
      . "order by length(id), id "
      . "limit 0, 5";
    $stmt = $conn->prepare($sql);
    $q = $q . "%";
    $stmt->bindParam("q", $q, PDO::PARAM_STR, 7);
    $stmt->execute();
    $resultSet = $stmt->fetchAll();
    $linhas = array_column($resultSet, 0);
  }
  
  $response = $response->withJson($linhas);
  return $response;
});

function validarParametro($q){
  return ($q != null && $q != "");
}

$app->get('/linhas-ativas', function (Request $request, Response $response, array $args) {
    
  $conn = criarConexao($this);

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

  $conn = criarConexao($this);
  $sqlConsultaLinha = 
    "SELECT TIMESTAMPDIFF(SECOND, datahora, NOW()) AS segAtras, lat, lng FROM rastro " . 
    "WHERE TIMESTAMPDIFF(MINUTE, datahora, NOW()) <= " . MAXIMO_TEMPO_ATRAS_EM_MINUTOS . " AND linha = :linha " .
    " ORDER BY datahora";
  $stmt = $conn->prepare($sqlConsultaLinha);
  $stmt->bindParam("linha", $id);
  $stmt->execute();
  $pontos = array();
  
  foreach ($stmt->fetchAll() as $row) {
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
  $lat =  filter_var($data['lat'], FILTER_SANITIZE_STRING);
  $lng =  filter_var($data['lng'], FILTER_SANITIZE_STRING);
  
  $conn = criarConexao($this);
  
  $sqlConsultaLinha = "SELECT COUNT(*) FROM linha WHERE id = :linha";
  $stmt = $conn->prepare($sqlConsultaLinha);
  $stmt->bindParam("linha", $linha);
  $stmt->execute();
  $linhaExiste = $stmt->fetchColumn();
  
  if($linhaExiste){
    $ajustados = snapToRoad($lat, $lng);
    $lat = $ajustados["lat"];
    $lng = $ajustados["lng"];
    
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
});

function snapToRoad($lat, $lng){
  $resultadoJson = callAPI("GET", 
    "https://roads.googleapis.com/v1/snapToRoads",
     array("path"=>$lat . "," . $lng, "key"=>"AIzaSyAFtfPIazR_sUwJYjYEDzALPJvdQ50xPd4"));
  $resultado = json_decode($resultadoJson);
  
  if(count($resultado->snappedPoints) > 0){
    $lat = $resultado->snappedPoints[0]->location->latitude;
    $lng = $resultado->snappedPoints[0]->location->longitude;
  }
  
  return array("lat"=>$lat, "lng"=>$lng);
}

$app->get('/teste', function (Request $request, Response $response, array $args) {
  $resultado = callAPI("GET", 
    "https://roads.googleapis.com/v1/snapToRoads",
     array("path"=>"-35.27801,149.12958", "key"=>"AIzaSyAFtfPIazR_sUwJYjYEDzALPJvdQ50xPd4"));
  $obj = json_decode($resultado);
  $response->getBody()->write($obj->snappedPoints[0]->location->latitude . ", " . $obj->snappedPoints[0]->location->longitude);
  return $response;
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
