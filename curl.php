<?php
$data = @json_decode(file_get_contents("http://data.taipower.com.tw/opendata01/apply/file/d006001/001.txt"),true);

// $loaction = [];

// $loaction[] = [
//         "id" => count($loaction) + 1,
//         "loc"=> "新北市",
//         "realName" => "金山核能發電廠",
//         "fullName" => "第一核能發電廠",
//         "nickName" => "核一",
//         "org" => "台灣電力公司",
//         "amount" => "2",
//     ];
// $loaction[] = [
//         "id" => count($loaction) + 1,
//         "loc"=> "新北市",
//         "realName" => "國聖核能發電廠",
//         "fullName" => "第二核能發電廠",
//         "nickName" => "核二",
//         "org" => "台灣電力公司",
//         "amount" => "2",
//     ];
// $loaction[] = [
//         "id" => count($loaction) + 1,
//         "loc"=> "屏東縣",
//         "realName" => "馬鞍山核能發電廠",
//         "fullName" => "第三核能發電廠",
//         "nickName" => "核二",
//         "org" => "台灣電力公司",
//         "amount" => "2",
//     ];

$mappingNameStorage = [
    "大潭CC" => "大潭",
    "澎湖尖山" => "尖山",
    "金門塔山" => "塔山",
    "馬祖珠山" => "珠山",
    "離島其他" => "離島",
    "嘉南西口&amp;嘉南烏山頭" => "烏山頭",
    "后里示範" => "后里",
    "澎湖湖西" => "湖西",
    "苗栗竹南" => "竹南",
    "苗栗大鵬" => "大鵬",
    "鹿威鹿港" => "鹿威",
];

$getTime = "";
// print_r($data);
if (!empty($data)) {
    $getTime = $data[""];
    $aaData = $data["aaData"];
    $elecInfo = array_map(function($item) use ($mappingNameStorage){
        $elecData = [
            "type" => "",
            "name" => "",
            "mappingName" => "",
            "capacity" => "",
            "used" => "",
            "percent" => "",
            "gov"  => true,
            "note" => "",
        ];

        list($elecData["type"], $elecData["name"], $elecData["capacity"], $elecData["used"], $elecData["percent"], $elecData["note"] ) = $item;

        $elecData["name"] = trim($elecData["name"]);
        /* 小計資料不處理 */
        if (strpos($elecData["name"],"小計")!==false) {
            return $elecData = false;
        }

        if (!is_numeric($elecData["used"])) {
            $elecData["used"] = 0;
        }



        /* 移除所有網頁標籤 */
        $elecData["type"] = strip_tags($elecData["type"]);
        $tryMappingName = str_replace(["CC","Gas1","Gas2","Gas1&2","Gas3&4","&amp;"],"",$elecData["name"]);

        if (preg_match("/(?P<mappingName>.{1,})#(?P<pid>[0-9]{1,})/", $tryMappingName, $match)) {
            $tryMappingName = trim($match["mappingName"]);
            $tryMappingName = str_replace(["CC","Gas1","Gas2","Gas1&2","Gas3&4","&amp;"],"",$tryMappingName);
            $tryMappingName = htmlspecialchars($tryMappingName );

            if (isset($mappingNameStorage[$tryMappingName])) {
                $elecData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $elecData["mappingName"] = $tryMappingName;
            }

            $elecData["pid"] = $match["pid"];
        } else if (preg_match("/(?P<mappingName>.{1,})\(/", $elecData["name"], $match)) {
            $tryMappingName = trim($match["mappingName"]);
            if (isset($mappingNameStorage[$tryMappingName])) {
                $elecData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $elecData["mappingName"] = $tryMappingName;
            }
        } else {
            $tryMappingName = trim($elecData["name"]);
            $tryMappingName = str_replace(["CC","Gas1&amp;2","Gas1&2","Gas3&amp;4","Gas3&4","&amp;","Gas1","Gas2","生水池"],"",$tryMappingName);
            if (isset($mappingNameStorage[$tryMappingName])) {
                $elecData["mappingName"] = $mappingNameStorage[$tryMappingName];
            } else {
                $elecData["mappingName"] = $tryMappingName;
            }
        }
        if (strpos($elecData["mappingName"],"台中Gas3") !== false ) {
            echo $elecData["name"];exit();
        }

        // echo $elecData["type"]."\n";
        /* 類型正規化成英文 */
        if (preg_match("/\((?P<type>[a-zA-Z-\s]{1,})\)/", $elecData["type"], $match)) {
            $elecData["type"] = strtolower($match["type"]);
        }

        if (strpos(strtolower($elecData["type"]), "ipp-") !== false) {
            $elecData["type"] = str_replace(["IPP-","ipp-"],"",$elecData["type"]);
            $elecData["gov"] = false;
        }


        $elecData["percent"] = ($elecData["used"] / $elecData["capacity"]) * 100 ;
        if (!is_numeric($elecData["percent"])) {
            $elecData["percent"] = 0;
        } else {
            $elecData["percent"] = round($elecData["percent"],2);
        }
        $elecData["percent"] = $elecData["percent"]."";


        return $elecData;
    },$aaData);

    /* 移除小計資料 */
    $elecInfo = array_filter($elecInfo, function($item){
        return ($item !== false);
    });
    $elecInfo = array_values($elecInfo);

    $output = [
        "time" => $getTime,
        "info" => $elecInfo
    ];

    save("log/powerInfo.log",$output);
    save("log/history/".str_replace(" ","/",str_replace(":","_",$getTime)).".log",$output);
}


function save($path, $data) {
    $dir = dirname(__FILE__)."/";

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


