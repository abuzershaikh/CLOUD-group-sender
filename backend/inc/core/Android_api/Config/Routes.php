<?php

$routes->group('Android_api', ['namespace' => 'Core\Android_api\Controllers'], static function ($routes) {
    $routes->post('request_pairing', 'Android_api::request_pairing');
    $routes->post('sync_contacts', 'Android_api::sync_contacts');
    $routes->post('sync_templates', 'Android_api::sync_templates');
    $routes->post('launch_campaign', 'Android_api::launch_campaign');
});
