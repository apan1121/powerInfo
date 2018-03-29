<?php
$dir = dirname(__FILE__)."/";
$data = @json_decode(file_get_contents("http://data.taipower.com.tw/opendata01/apply/file/d006001/001.txt"),true);

$getTime = "";
$summaryDays = 15;

$mappingNameStorage = [
    "大潭CC" => ["大潭"],
    "澎湖尖山" => ["尖山"],
    "金門塔山" => ["塔山"],
    "馬祖珠山" => ["珠山","南竿","北竿"],
    "離島其他" => ["離島","蘭嶼","綠島","旭光","東引","七美","望安","虎井"],
    "嘉南西口嘉南烏山頭" => ["烏山頭"],
    "后里示範" => ["后里"],
    "澎湖湖西" => ["湖西"],
    "苗栗竹南" => ["竹南"],
    "苗栗大鵬" => ["大鵬"],
    "鹿威鹿港" => ["鹿威"],

    "青山" => ["大甲溪"],
    "德基" => ["大甲溪"],
    "谷關" => ["大甲溪"],
    "天輪" => ["大甲溪"],
    "馬鞍" => ["大甲溪"],
    "松林" => ["萬大"],
    "大觀一" => ["大觀"],
    "大觀二" => ["大觀"],
    "鉅工" => ["明潭"],
    "水里" => ["明潭"],
    "立霧#1" => ["東部"],
    "龍澗" => ["東部"],
    "碧海" => ["東部"],
    "烏來桂山粗坑" => ["桂山"],
    "翡翠" => ["桂山"],
    "義興" => ["石門"],
    "后里" => ["大甲溪"],
    "卑南" => ["卑南上圳小型"],
    "北部小水力"=> ["蘭陽","桂山"],
    "中部小水力"=> ["大甲溪","明潭"],
    "南部小水力"=> ["高屏","明潭"],
    "東部小水力"=> ["東部","東興"],
    "台中2" => ["台中"],
    "台中Gas34" => ["台中"],
];


$summaryInfo = [
    "nuclear" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "coal" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "co-gen" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "lng" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "oil" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "diesel" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "hydro" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "wind" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "solar" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "pumping gen" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],
    "pumping load" => [
        "cap" => 0,
        "used" => 0,
        "limit" => 0,
        "fix" => 0,
        "break" => 0,
    ],

];

if (!empty($data)) {
    $getTime = $data[""];
    $aaData = $data["aaData"];

    $powerInfo = [];

    foreach($aaData AS $item) {
        $powerData = [
            "type" => "",
            "name" => "",
            "mappingName" => "",
            "capacity" => "",
            "used" => "",
            "percent" => "",
            "gov"  => true,
            "status" => "online",
            "note" => "",
            "noteId" => "",
        ];

        list($powerData["type"], $powerData["name"], $powerData["capacity"], $powerData["used"], $powerData["percent"], $powerData["note"] ) = $item;

        $powerData["name"] = trim($powerData["name"]);
        /* 小計資料不處理 */
        if (strpos($powerData["name"],"小計")!==false) {
            continue;
        }

        if (!is_numeric($powerData["used"])) {
            $powerData["used"] = 0;
        }

        /* 移除所有網頁標籤 */
        $powerData["type"] = strip_tags($powerData["type"]);

        $tryMappingName = str_replace(["CC","Gas1","Gas2","Gas1&2","Gas3&4","&amp;","生水池"],"",$powerData["name"]);

        if (preg_match("/(?P<mappingName>.{1,})#(?P<pid>[0-9]{1,})/", $tryMappingName, $match)) {
            $tryMappingName = trim($match["mappingName"]);
            $tryMappingName = htmlspecialchars($tryMappingName);

            if (isset($mappingNameStorage[$tryMappingName])) {
                $powerData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $powerData["mappingName"] = [$tryMappingName];
            }

            $elecData["pid"] = $match["pid"];
        } else if (preg_match("/(?P<mappingName>.{1,})\#/", $tryMappingName, $match)) {
            $tryMappingName = trim($match["mappingName"]);
            $tryMappingName = htmlspecialchars($tryMappingName);

            if (isset($mappingNameStorage[$tryMappingName])) {
                $powerData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $powerData["mappingName"] = [$tryMappingName];
            }
        } else if (preg_match("/(?P<mappingName>.{1,})\(/", $tryMappingName, $match)) {
            $tryMappingName = trim($match["mappingName"]);

            if (isset($mappingNameStorage[$tryMappingName])) {
                $powerData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $powerData["mappingName"] = [$tryMappingName];
            }
        } else {
            $tryMappingName = trim($tryMappingName);
            if (isset($mappingNameStorage[$tryMappingName])) {
                $powerData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $powerData["mappingName"] = [$tryMappingName];
            }
        }

        /* 類型正規化成英文 */
        if (preg_match("/\((?P<type>[a-zA-Z-\s]{1,})\)/", $powerData["type"], $match)) {
            $powerData["type"] = strtolower($match["type"]);
        }

        /* 政府民間？ */
        if (strpos(strtolower($powerData["type"]), "ipp-") !== false) {
            $powerData["type"] = str_replace(["IPP-","ipp-"],"",$powerData["type"]);
            $powerData["gov"] = false;
        }

        /* 可發電量與使用量數字化 */
        if (is_numeric($powerData["capacity"])) {
            $powerData["capacity"] = floatval($powerData["capacity"]);
        } else {
            $powerData["capacity"] = 0;
        }

        if (is_numeric($powerData["used"])) {
            $powerData["used"] = floatval($powerData["used"]);
        } else {
            $powerData["used"] = 0;
        }

        /* 機組平均發電量 */
        if (is_numeric($powerData["capacity"]) && $powerData["capacity"]> 0) {
            $powerData["percent"] = ($powerData["used"] / $powerData["capacity"]) * 100 ;
        } else {
            $powerData["percent"] = 0;
        }
        if (!is_numeric($powerData["percent"])) {
            $powerData["percent"] = 0;
        } else {
            $powerData["percent"] = round($powerData["percent"],2);
        }
        $powerData["percent"] = $powerData["percent"]."";


        /* 根據備註設定狀態 */
        $powerData["note"] = trim($powerData["note"]);
        if (!empty($powerData["note"])) {
            if (strpos($powerData["note"],"停機") !== false) {
                $powerData["status"] = "fix";
            } else if (strpos($powerData["note"],"修") !== false && strpos($powerData["note"],"部分") === false) {
                $powerData["status"] = "fix";
            } else if ((strpos($powerData["note"],"環保限制") !== false || strpos($powerData["note"],"水文限制") !== false) && (int)$powerData["used"] <= 0) {
                $powerData["status"] = "limit";
            } else if (strpos($powerData["note"],"故障") !== false && (int)$powerData["used"] <= 0) {
                $powerData["status"] = "break";
            }
        }

        /* 取得 noteid */
        if (preg_match("/\(註(?P<noteId>[0-9]{1,})\)/", $powerData["name"], $match)) {
            $powerData["noteId"] = $match["noteId"];
        }


        switch ($powerData["status"]) {
            case "fix":
                $summaryInfo[$powerData["type"]]["fix"] += round($powerData["capacity"],4);
                break;
            case "limit":
                $summaryInfo[$powerData["type"]]["limit"] += round($powerData["capacity"],4);
                break;
            case "break":
                $summaryInfo[$powerData["type"]]["break"] += round($powerData["capacity"],4);
                break;
            default:
                $summaryInfo[$powerData["type"]]["cap"] += round($powerData["capacity"],4);
                $summaryInfo[$powerData["type"]]["used"] += round($powerData["used"],4);
                break;
        }

        $powerInfo[] = $powerData;
    }

    /* 儲存當前資料與歷史資料 */
    if (1) {
        $output = [
            "time" => $getTime,
            "info" => $powerInfo
        ];
        save("log/powerInfo.log",$output);
        save("log/history/".str_replace(" ","/",str_replace(":","_",$getTime)).".log",$output);
    }

    /* 儲存 summary 資料 */
    if (1) {
        /* 重新把數字變成文字避免 json 數字溢位問題 */
        foreach ($summaryInfo AS $key => &$item) {
            foreach (["cap","used","fix","limit","break"] AS $type) {
                $item[$type] = round($item[$type],4)."";
            }
        }

        /* 嘗試取出本日 summary 資料，並加入剛剛計入的結果 */
        list($date, $time) = explode(" ",$getTime);
        $dateSummaryFile = "log/history/{$date}/summary.log";
        $summaryData =  @json_decode(file_get_contents($dateSummaryFile),true) ;
        if (empty($summaryData)) {
            $summaryData = [];
        }
        $summaryData[$date." ".$time] = $summaryInfo;
        save($dateSummaryFile, $summaryData);

        /* 從歷史資料夾中取出倒數 $summaryDays 天的 summary 紀錄並合併資料 */
        $folderNames = array_reverse(scandir($dir."log/history/"));
        $totleSummary = [];
        for ($i = 0; $i < $summaryDays; $i++) {
            if (strpos($folderNames[$i],".") !== false) {
                break;
            }

            $summaryData =  @json_decode(file_get_contents($dir."log/history/".$folderNames[$i]."/summary.log"),true) ;
            $totleSummary = array_merge($totleSummary, $summaryData);
        }
        krsort($totleSummary);
        save("log/summary.log", $totleSummary);

    }

}



 /* 儲存判斷資料夾是否存在 */
function save($path, $data) {
    global $dir;

    $path = explode("/",$path);
    $checkPath = [];
    for ($i = 0; $i < count($path) -1 ; $i++) {
        $checkPath[] = $path[$i];
        $folderPath = $dir.implode("/",$checkPath);
        if (!file_exists($folderPath)) {
            mkdir($folderPath, 0777, true);
        }
    }

    $file = fopen(implode("/",$path),"w");
    fwrite($file,json_encode($data));
}