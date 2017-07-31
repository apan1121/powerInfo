<?php
include("simple_html_dom.php");
$html = file_get_contents("https://zh.wikipedia.org/wiki/%E8%87%BA%E7%81%A3%E7%99%BC%E9%9B%BB%E5%BB%A0%E5%88%97%E8%A1%A8");
$html = str_get_html($html);

$base_url = "https://zh.wikipedia.org";
$table = $html->find('table.wikitable');
$electInfo = [];
$default =  [
    "name" => "",
    "url"  => "",
    "fullName" => "",
    "nickName" => "",
    "photo" => "",
    "location" => "",
    "org" => "",
    "amount" => "",
    "capacity" => "",
    "status" => "",
    "note" => "",
    "type" => "",
];

$transKeyword = [
    "商轉中" => "online",
    "部分運轉中" => "part-online",
    "部分商轉中" => "part-online",
    "計劃中" => "plane",
    "計畫改建" => "rebuild",
    "已取消" => "cancel",
    "已廢止" => "remove",
    "已拆除" => "remove",
    "已廢棄" => "remove",
    "停工中" => "cancel",
    "備役中" => "spare",
    "試俥中" => "test",
    "封存中" => "stop",


    "電廠名稱" => "name",
    "電廠照片" => "photo",
    "所在位置" => "location",
    "操作單位" => "org",
    "機組數量（容量*機組數）" => "amount",
    "機組數量" => "amount",
    "裝置容量 （MW）" => "capacity",
    "裝置容量（MW）" => "capacity",
    "當前狀態" => "status",
    "燃料" => "type",
    "備註" => "note",

    "煤" => "coal",
    "天然氣" => "lng",
    "重油" => "oil",
    "柴油" => "oil",
    "燃料油" => "oil",
    "燃煤" =>"coal",

    "elecMapping" => [
        "第一核能發電廠" => "核一",
        "第二核能發電廠" => "核二",
        "第三核能發電廠" => "核三",
        "第四核能發電廠" => "核四",
        "澎湖尖山"      => "尖山",
        "烏山頭水力發電廠" => "烏山頭",
        "協和發電廠珠山分廠" => "珠山",
    ],


    "elecShortName" => ["林口","台中","和平","麥寮","海湖","新桃","大潭","國光","通霄","星元","彰濱","嘉惠","森霸","南部","協和","望安","七美","塔山","協和珠山分廠","綠島","東引","蘭嶼","南竿","興達","大林","高原","彰工","深澳","海渡","北部","松山火力發電所","澎湖","台東火力","成功火力","關山火力","旭光","虎井","北竿","萬里","牡丹小型水力","八田水力","卓蘭景山分廠","光明抽蓄計畫","桂山","大甲溪","東部","大觀","明潭","萬大","卓蘭","石門","曾文","高屏","蘭陽","東興","烏山頭水力","西口","卑南上圳小型","名間","西寶","溪畔","谷園","仲岳","豐坪溪","東錦","關山水力","太平"],

];

foreach($table as $_table) {
    if (trim($_table->find("tr",0)->find("th",0)->innertext) == "電廠名稱") {
        $tr = $_table->find("tr");

        $column = [];
        foreach($tr AS $_tr) {
            if (count($_tr->find("td")) > 0) {
                $_electInfo = $default;
                $td = $_tr->find("td");
                foreach ($td AS $key => $_td) {
                    $columnType = $column[$key];
                    switch ($columnType) {
                        case "name":
                            $_electInfo[$columnType] = strip_tags($_td->innertext);
                            $_electInfo["url"] = $base_url.$_td->find("a",0)->href;
                            break;
                        case "photo":
                            $_electInfo["photo"] = urldecode(str_replace("100px","500px",$_td->find("img",0)->src));
                            break;
                        case "location":
                            $_electInfo["location"] = $_td->find("a",0)->innertext;
                            break;
                        case "org":
                            $_electInfo["org"] = $_td->innertext;
                            break;
                        case "amount":
                            $_electInfo["amount"] = $_td->innertext;
                            break;
                        case "status":
                            $_electInfo["status"] = $_td->innertext;
                            break;
                        case "type":
                            $_electInfo["type"] = $_td->innertext;
                            break;
                        case "note":
                            $_electInfo["note"] = $_td->innertext;
                            break;
                        case "capacity":
                            $_electInfo["capacity"] = $_td->innertext;
                            break;
                    }
                }

                $_electInfo["name"] = trim($_electInfo["name"]);
                /* format info */
                if (@preg_match("/(?P<name>.{1,})（(?P<fullName>.{1,})）/", $_electInfo["name"], $match)) {
                    $_electInfo["name"] = trim($match["name"]);
                    $_electInfo["fullName"] = trim($match["fullName"]);
                } else {
                    $_electInfo["fullName"] = $_electInfo["name"];
                }

                if (isset($transKeyword["elecMapping"][$_electInfo["name"]])) {
                    $_electInfo["nickName"] = $transKeyword["elecMapping"][$_electInfo["name"]];
                } else {
                    $shortName = str_replace(["發電廠","電廠","景山分廠"],"",$_electInfo["name"]);
                    $shortName = str_replace(["水力"],"",$shortName);
                    if (in_array($shortName, $transKeyword["elecShortName"])){
                        $_electInfo["nickName"] = $shortName;
                    } else {
                         // echo $_electInfo["name"]."\n";
                    }
                }

                if (isset($transKeyword[$_electInfo["status"]])) {
                    $_electInfo["status"] = $transKeyword[$_electInfo["status"]];
                } else {
                    // echo $_electInfo["status"]."\n";
                }

                if (empty($_electInfo["type"])) {
                    if (strpos($_electInfo["name"],"核") !== false) {
                        $_electInfo["type"] = ["nuclear"];
                    } else {
                        $_electInfo["type"] = ["water"];
                    }
                } else {
                    $tmpType = [];
                    $tmp = explode("<br />",$_electInfo["type"]);

                    foreach ($tmp AS $subType) {
                        $subType = trim($subType);
                        if (isset($transKeyword[$subType])) {
                            $tmpType[]=$transKeyword[$subType];
                        } else {
                            $tmpType[]=$_electInfo["type"]."\n";
                        }
                    }
                    $_electInfo["type"] = $tmpType;
                }

                if (strposa($_electInfo["note"],["風"])!==false) {
                    $_electInfo["type"][] = "wind";
                }


                $electInfo[] = $_electInfo;
            } else if (count($_tr->find("th")) > 0) {
                $th = $_tr->find("th");
                foreach ($th AS $_th) {
                    $str = strip_tags($_th->innertext);
                    if (isset($transKeyword[$str])) {
                        $column[] = $transKeyword[$str];
                    } else {
                        $column[] = $str;
                    }
                }
            }
        }
    }
}

save("log/powerPlant.log",$electInfo);

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


function strposa($haystack, $needles=array(), $offset=0) {
        $chr = array();
        foreach($needles as $needle) {
                $res = strpos($haystack, $needle, $offset);
                if ($res !== false) $chr[$needle] = $res;
        }
        if(empty($chr)) return false;
        return min($chr);
}