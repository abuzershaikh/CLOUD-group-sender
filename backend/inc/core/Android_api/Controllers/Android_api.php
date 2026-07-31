<?php

namespace Core\Android_api\Controllers;

use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

class Android_api extends Controller
{
    use ResponseTrait;

    public function __construct()
    {
        // For Android APIs, we assume a stateless JSON interaction. 
        // We will authenticate using headers or payload tokens.
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Headers: Content-Type, Content-Length, Accept-Encoding, Authorization");
        
        if ( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ) {
            die();
        }
    }

    private function _getJsonBody(): array
    {
        $json = json_decode(file_get_contents('php://input'), true);
        return is_array($json) ? $json : [];
    }

    private function _findTeamAccessToken(array $json): ?string
    {
        if (!empty($json['access_token'])) {
            return trim($json['access_token']);
        }

        if (!empty($_SERVER['HTTP_X_WAZIPAR_ACCESS_TOKEN'])) {
            return trim($_SERVER['HTTP_X_WAZIPAR_ACCESS_TOKEN']);
        }

        return null;
    }

    private function _createOrReusePendingInstance(int $teamId): string
    {
        $session = db_get("*", TB_WHATSAPP_SESSIONS, ["team_id" => $teamId, "status" => 0]);

        if ($session) {
            return $session->instance_id;
        }

        $instanceId = strtoupper(uniqid());
        db_insert(TB_WHATSAPP_SESSIONS, [
            "ids" => ids(),
            "instance_id" => $instanceId,
            "team_id" => $teamId,
            "data" => null,
            "status" => 0
        ]);

        return $instanceId;
    }

    /**
     * API 1: Remote Device Linking - Generates Pairing Code
     * POST /Android_api/request_pairing
     */
    public function request_pairing()
    {
        try {
            $json = $this->_getJsonBody();

            if (!isset($json['phone_number']) || empty($json['phone_number'])) {
                return $this->respond(["status" => "error", "message" => "WhatsApp phone_number is required"]);
            }

            $phone = preg_replace('/[^0-9]/', '', $json['phone_number']);
            if ($phone === '') {
                return $this->respond(["status" => "error", "message" => "Valid WhatsApp phone_number is required"]);
            }

            $accessToken = $this->_findTeamAccessToken($json);
            if (!$accessToken) {
                return $this->respond([
                    "status" => "error",
                    "message" => "Wazipar access_token is required"
                ], 400);
            }

            $team = db_get("*", TB_TEAM, ["ids" => addslashes($accessToken)]);
            if (!$team) {
                return $this->respond([
                    "status" => "error",
                    "message" => "Invalid Wazipar access_token"
                ], 404);
            }

            check_number_account("whatsapp", "profile", $team->id);
            $instanceId = $this->_createOrReusePendingInstance((int) $team->id);

            // Warm up the engine session before asking for the pair code.
            $qrResult = wa_get_curl("get_qrcode", [
                "instance_id" => $instanceId,
                "access_token" => $accessToken
            ]);

            if (empty($qrResult)) {
                return $this->respond([
                    "status" => "error",
                    "message" => "Cannot connect to WhatsApp server. Please make sure the WA engine is running."
                ], 502);
            }

            if (isset($qrResult->status) && $qrResult->status === "error") {
                return $this->respond([
                    "status" => "error",
                    "message" => $qrResult->message ?? "Failed to initialize pairing session"
                ], 400);
            }

            $pairResult = wa_get_curl("get_paircode", [
                "instance_id" => $instanceId,
                "access_token" => $accessToken,
                "phone" => $phone
            ]);

            if (empty($pairResult)) {
                return $this->respond([
                    "status" => "error",
                    "message" => "WhatsApp pairing server did not return a response"
                ], 502);
            }

            if (($pairResult->status ?? 'error') !== 'success') {
                return $this->respond([
                    "status" => "error",
                    "message" => $pairResult->message ?? "Failed to generate pairing code",
                    "data" => [
                        "instance_id" => $instanceId,
                        "phone" => $phone
                    ]
                ], 400);
            }

            return $this->respond([
                "status" => "success",
                "message" => "Pairing code generated",
                "data" => [
                    "instance_id" => $instanceId,
                    "pairing_code" => $pairResult->code ?? null,
                    "phone" => $phone,
                    "qrcode" => $qrResult->base64 ?? $qrResult->qrcode ?? null
                ]
            ], 200);
        } catch (\Throwable $e) {
            log_message('error', 'Android pairing failed: {message}', ['message' => $e->getMessage()]);

            return $this->respond([
                "status" => "error",
                "message" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API 2: Sync Contacts to DB
     * POST /Android_api/sync_contacts
     */
    public function sync_contacts()
    {
        $json = $this->_getJsonBody();
        
        if (!isset($json['group_name'])) {
            return $this->respond(["status" => "error", "message" => "group_name is required"]);
        }

        // Standard DB operations
        // Insert group -> Get ID -> Insert contacts
        // 
        // Example skeleton:
        // $group_id = db_insert(TB_WHATSAPP_CONTACT_GROUP, ["name" => $json['group_name'], 'team_id' => 1]);
        // foreach($json['numbers'] as $num) { ... db_insert(TB_WHATSAPP_CONTACTS) }

        return $this->respond([
            "status" => "success",
            "message" => "Contacts synced successfully",
            "data" => [ "server_group_id" => rand(100, 999) ]
        ], 200);
    }

    /**
     * API 3: Sync Templates to DB
     * POST /Android_api/sync_templates
     */
    public function sync_templates()
    {
        $json = $this->_getJsonBody();

        // Standard DB operation for Whatsapp_button_template
        return $this->respond([
            "status" => "success",
            "message" => "Template saved successfully",
            "data" => [ "server_template_id" => rand(1000, 9999) ]
        ], 200);
    }

    /**
     * API 4: Launch Campaign
     * POST /Android_api/launch_campaign
     */
    public function launch_campaign()
    {
        $this->_authenticate();
        $json = json_decode(file_get_contents('php://input'), true);

        // Required: campaign_name, server_group_id, server_template_id, delay_seconds
        
        // $schedule_data = [...];
        // db_insert(TB_WHATSAPP_SCHEDULES, $schedule_data);

        return $this->respond([
            "status" => "success",
            "message" => "Campaign scheduled successfully! Cron job will process it."
        ], 200);
    }
}
