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

$app->get('/linhas-ativas', function (Request $request, Response $response, array $args) {
    
    $data = array('178', 'T1');
    $response = $response->withJson($data);
    return $response;
});

$app->get('/linha/[{id}]', function (Request $request, Response $response, array $args) {
    $id = $args['id'];
    switch($id){
      case "178":
        $data = array(criarPonto(1, -30.037448, -51.232035), 
                      criarPonto(10, -30.037403, -51.233003),
                      criarPonto(20, -30.037336, -51.236372));
        break;
      case "T1":
        $data = array(criarPonto(1, -30.037448, -51.232035), 
                      criarPonto(30, -30.037403, -51.233003),
                      criarPonto(60, -30.037336, -51.236372));
        break;
      default:
        $data = array();
    }
    $response = $response->withJson($data);
    return $response;
});

function criarPonto($segundosAtras, $latitude, $longitude){
  return array('segAtras'=>$segundosAtras, 'lat'=>$latitude, 'lon'=>$longitude);
}
