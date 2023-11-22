/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 99.97777777777777, "KoPercent": 0.022222222222222223};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7733478260869565, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, ""], "isController": true}, {"data": [0.643, 500, 1500, "/ru/index.html-9"], "isController": false}, {"data": [0.721, 500, 1500, "/ru/signup.html-10"], "isController": false}, {"data": [0.475, 500, 1500, "/ru/index.html"], "isController": false}, {"data": [0.998, 500, 1500, "/-0"], "isController": false}, {"data": [0.971, 500, 1500, "/-1"], "isController": false}, {"data": [0.96, 500, 1500, "/-2"], "isController": false}, {"data": [0.998, 500, 1500, "/ru/index.html-0"], "isController": false}, {"data": [0.969, 500, 1500, "/-3"], "isController": false}, {"data": [0.964, 500, 1500, "/-4"], "isController": false}, {"data": [0.495, 500, 1500, "/ru/doc.html"], "isController": false}, {"data": [0.964, 500, 1500, "/-5"], "isController": false}, {"data": [0.963, 500, 1500, "/-6"], "isController": false}, {"data": [0.729, 500, 1500, "/ru/doc.html-2"], "isController": false}, {"data": [0.89, 500, 1500, "/ru/index.html-4"], "isController": false}, {"data": [0.971, 500, 1500, "/-7"], "isController": false}, {"data": [0.75, 500, 1500, "/ru/doc.html-1"], "isController": false}, {"data": [0.902, 500, 1500, "/ru/index.html-3"], "isController": false}, {"data": [0.727, 500, 1500, "/-8"], "isController": false}, {"data": [0.965, 500, 1500, "/ru/doc.html-0"], "isController": false}, {"data": [0.903, 500, 1500, "/ru/index.html-2"], "isController": false}, {"data": [0.696, 500, 1500, "/-9"], "isController": false}, {"data": [0.908, 500, 1500, "/ru/index.html-1"], "isController": false}, {"data": [0.741, 500, 1500, "/ru/doc.html-6"], "isController": false}, {"data": [0.645, 500, 1500, "/ru/index.html-8"], "isController": false}, {"data": [0.714, 500, 1500, "/ru/doc.html-5"], "isController": false}, {"data": [0.628, 500, 1500, "/ru/index.html-7"], "isController": false}, {"data": [0.741, 500, 1500, "/ru/doc.html-4"], "isController": false}, {"data": [0.879, 500, 1500, "/ru/index.html-6"], "isController": false}, {"data": [0.731, 500, 1500, "/ru/doc.html-3"], "isController": false}, {"data": [0.885, 500, 1500, "/ru/index.html-5"], "isController": false}, {"data": [0.992, 500, 1500, "/ru/signup.html-0"], "isController": false}, {"data": [0.457, 500, 1500, "/ru/signup.html"], "isController": false}, {"data": [0.675, 500, 1500, "/-11"], "isController": false}, {"data": [0.714, 500, 1500, "/ru/signup.html-7"], "isController": false}, {"data": [0.726, 500, 1500, "/ru/signup.html-8"], "isController": false}, {"data": [0.815, 500, 1500, "/ru/signup.html-5"], "isController": false}, {"data": [0.678, 500, 1500, "/-10"], "isController": false}, {"data": [0.826, 500, 1500, "/ru/signup.html-6"], "isController": false}, {"data": [0.831, 500, 1500, "/ru/signup.html-3"], "isController": false}, {"data": [0.809, 500, 1500, "/ru/signup.html-4"], "isController": false}, {"data": [0.878, 500, 1500, "/ru/signup.html-1"], "isController": false}, {"data": [0.439, 500, 1500, "/"], "isController": false}, {"data": [0.844, 500, 1500, "/ru/signup.html-2"], "isController": false}, {"data": [0.662, 500, 1500, "/ru/index.html-10"], "isController": false}, {"data": [0.702, 500, 1500, "/ru/signup.html-9"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 22500, 5, 0.022222222222222223, 430.7044000000022, 95, 3187, 283.0, 876.0, 1063.0, 1448.0, 50.59556602946236, 398.74158725739426, 60.10095326262697], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["", 500, 2, 0.4, 4401.740000000004, 2993, 7831, 4246.0, 5266.9, 5745.75, 6747.93, 1.1242195106047626, 199.3483799750929, 30.047098298100295], "isController": true}, {"data": ["/ru/index.html-9", 500, 0, 0.0, 527.4440000000002, 110, 2879, 571.0, 772.0, 847.8, 1116.7400000000002, 1.1378557790557162, 2.191261324509641, 0.8245009649017007], "isController": false}, {"data": ["/ru/signup.html-10", 500, 0, 0.0, 450.9759999999999, 106, 1665, 534.5, 760.4000000000002, 847.9, 1148.98, 1.1369734675871603, 2.986776003720177, 0.8249719593918556], "isController": false}, {"data": ["/ru/index.html", 500, 0, 0.0, 1109.8160000000003, 673, 3187, 1049.0, 1346.5000000000002, 1529.7499999999995, 2143.8900000000003, 1.1356796474850375, 52.21353723041805, 9.084328117724553], "isController": false}, {"data": ["/-0", 500, 0, 0.0, 158.0579999999999, 96, 837, 140.0, 233.4000000000002, 288.4999999999999, 402.8600000000001, 1.1343064169982622, 0.48850500966429067, 0.5051208263195387], "isController": false}, {"data": ["/-1", 500, 0, 0.0, 189.6619999999999, 99, 767, 153.0, 267.9000000000004, 547.75, 714.7700000000002, 1.1351871696605336, 5.642678411691519, 0.5055130364894563], "isController": false}, {"data": ["/-2", 500, 0, 0.0, 333.34000000000015, 212, 1068, 296.0, 437.7000000000001, 680.0999999999998, 815.98, 1.1365005330187499, 18.65903023546018, 0.5538220370862854], "isController": false}, {"data": ["/ru/index.html-0", 500, 0, 0.0, 170.74200000000002, 99, 727, 157.0, 231.90000000000003, 267.0, 401.7800000000002, 1.1378454214238087, 6.371489889105585, 0.8189375738177217], "isController": false}, {"data": ["/-3", 500, 0, 0.0, 200.00600000000009, 101, 710, 164.0, 275.90000000000003, 555.9499999999998, 686.7000000000003, 1.1367744253036893, 2.1103595532249155, 0.5528453748058958], "isController": false}, {"data": ["/-4", 500, 0, 0.0, 207.59600000000012, 112, 765, 164.0, 323.80000000000007, 565.5999999999999, 700.97, 1.1367744253036893, 4.712507261146642, 0.5595061624541595], "isController": false}, {"data": ["/ru/doc.html", 500, 0, 0.0, 929.1680000000001, 299, 2290, 885.0, 1219.6000000000001, 1326.5, 1728.6800000000012, 1.1360563847504879, 48.086027230703515, 5.62702928071726], "isController": false}, {"data": ["/-5", 500, 0, 0.0, 205.54200000000006, 104, 823, 162.0, 306.50000000000017, 582.0, 740.7900000000002, 1.1367744253036893, 3.067292712025482, 0.5606162937288702], "isController": false}, {"data": ["/-6", 500, 0, 0.0, 202.78000000000017, 108, 825, 161.0, 302.70000000000044, 579.6999999999999, 700.98, 1.1367795943515695, 0.7859765164071398, 0.5550681613044773], "isController": false}, {"data": ["/ru/doc.html-2", 500, 0, 0.0, 452.4679999999998, 107, 1633, 530.5, 722.7, 849.1499999999999, 1198.2300000000007, 1.1381018282467767, 2.112823804196409, 0.8057849858192513], "isController": false}, {"data": ["/ru/index.html-4", 500, 0, 0.0, 314.584, 115, 2550, 197.0, 655.4000000000002, 750.9, 1119.5200000000004, 1.1378687263607774, 3.0702454013035423, 0.8356223459211958], "isController": false}, {"data": ["/-7", 500, 0, 0.0, 198.6899999999998, 98, 825, 162.0, 274.80000000000007, 569.55, 705.8200000000002, 1.1367795943515695, 0.686064247372334, 0.5506276160140415], "isController": false}, {"data": ["/ru/doc.html-1", 500, 0, 0.0, 484.9499999999999, 134, 2009, 496.0, 789.0, 855.8499999999999, 1100.91, 1.1365237828966808, 18.65941195122949, 0.805777603889639], "isController": false}, {"data": ["/ru/index.html-3", 500, 0, 0.0, 299.53799999999984, 98, 2687, 191.0, 641.7, 738.9, 936.5600000000004, 1.1364927832708263, 4.71133971189908, 0.8335020314808501], "isController": false}, {"data": ["/-8", 500, 0, 0.0, 435.39200000000045, 103, 1506, 530.0, 722.0, 770.95, 1155.5900000000004, 1.1373924595429503, 5.438157697189731, 0.5531459422386613], "isController": false}, {"data": ["/ru/doc.html-0", 500, 0, 0.0, 203.34399999999997, 115, 984, 164.0, 288.4000000000002, 549.8499999999999, 668.97, 1.1379334673060335, 13.119572768569368, 0.7945531534412247], "isController": false}, {"data": ["/ru/index.html-2", 500, 0, 0.0, 295.79799999999966, 108, 2630, 190.0, 625.0, 712.4999999999999, 916.97, 1.1378661368761933, 2.1123862560562925, 0.8278420624734024], "isController": false}, {"data": ["/-9", 500, 0, 0.0, 471.3640000000001, 102, 1858, 542.0, 735.0, 849.8, 1195.93, 1.1368131943086583, 5.435388085288273, 0.5495337218581894], "isController": false}, {"data": ["/ru/index.html-1", 500, 0, 0.0, 371.1240000000002, 130, 2427, 280.5, 728.4000000000002, 819.55, 1417.5000000000014, 1.136100267665223, 18.65245869139427, 0.8276667965607973], "isController": false}, {"data": ["/ru/doc.html-6", 500, 0, 0.0, 435.03399999999976, 100, 1558, 510.5, 718.8000000000001, 765.9, 1008.9200000000001, 1.1369243467801167, 2.1894675896976463, 0.8016204866945743], "isController": false}, {"data": ["/ru/index.html-8", 500, 0, 0.0, 529.1219999999997, 104, 2742, 571.0, 760.9000000000001, 835.8, 1091.98, 1.1378557790557162, 5.353700335439884, 0.8245009649017007], "isController": false}, {"data": ["/ru/doc.html-5", 500, 0, 0.0, 465.27799999999996, 105, 1422, 548.0, 732.9000000000001, 838.8499999999999, 1026.8100000000002, 1.1369217615920544, 5.3493057103032395, 0.8049494894084369], "isController": false}, {"data": ["/ru/index.html-7", 500, 0, 0.0, 545.5200000000007, 115, 2751, 583.0, 767.7, 865.55, 1117.6900000000003, 1.1378946218548593, 5.353883093844445, 0.8278627864080763], "isController": false}, {"data": ["/ru/doc.html-4", 500, 0, 0.0, 444.6439999999998, 99, 1481, 521.0, 715.2000000000003, 785.5999999999999, 1145.940000000001, 1.1381329157144289, 1.9883982287237434, 0.8091413697657268], "isController": false}, {"data": ["/ru/index.html-6", 500, 0, 0.0, 325.5279999999996, 101, 2201, 222.5, 654.9000000000001, 735.6499999999999, 953.5900000000004, 1.1378868530828767, 0.6867324953175956, 0.825634699063064], "isController": false}, {"data": ["/ru/doc.html-3", 500, 0, 0.0, 447.90000000000026, 101, 1235, 525.0, 716.9000000000001, 830.9, 1097.7000000000003, 1.1380992377011305, 4.717999281290331, 0.8124517019136], "isController": false}, {"data": ["/ru/index.html-5", 500, 0, 0.0, 315.53999999999985, 106, 2636, 201.0, 646.3000000000002, 732.5999999999999, 1046.7800000000002, 1.1368674753583976, 0.7860372778845169, 0.8293359414967997], "isController": false}, {"data": ["/ru/signup.html-0", 500, 0, 0.0, 172.26, 101, 2213, 151.0, 217.0, 264.79999999999995, 615.4100000000005, 1.1374545586903804, 3.096897763309356, 0.8219886459285952], "isController": false}, {"data": ["/ru/signup.html", 500, 2, 0.4, 1133.4679999999996, 442, 3135, 1067.0, 1452.2000000000003, 1711.6499999999999, 2372.8500000000013, 1.1353676093245473, 48.92203453688923, 9.102370739816887], "isController": false}, {"data": ["/-11", 500, 0, 0.0, 490.3619999999999, 104, 1853, 547.5, 766.7, 870.9, 1354.6000000000022, 1.1368028556487733, 2.9863278141554694, 0.5484185651274356], "isController": false}, {"data": ["/ru/signup.html-7", 500, 2, 0.4, 458.28599999999983, 95, 1523, 545.0, 737.0, 836.75, 1089.6600000000003, 1.1364307890920828, 5.3398174877947335, 0.825701312748026], "isController": false}, {"data": ["/ru/signup.html-8", 500, 1, 0.2, 449.8519999999998, 108, 1698, 538.5, 746.9000000000001, 819.6499999999999, 1085.92, 1.1375425440911489, 5.348633950042545, 0.824842763181843], "isController": false}, {"data": ["/ru/signup.html-5", 500, 0, 0.0, 387.6559999999997, 100, 1427, 289.5, 732.9000000000003, 848.95, 1121.1000000000008, 1.1373795230740182, 0.7863913108753955, 0.8319309206859763], "isController": false}, {"data": ["/-10", 500, 0, 0.0, 489.95400000000024, 108, 1627, 555.5, 744.9000000000001, 886.9, 1163.5100000000014, 1.136725321693266, 2.18908431091711, 0.5494912443732096], "isController": false}, {"data": ["/ru/signup.html-6", 500, 0, 0.0, 375.1560000000001, 105, 1608, 277.0, 715.6000000000001, 799.6999999999999, 1206.8000000000002, 1.1373795230740182, 0.6864263137302181, 0.8274880319239684], "isController": false}, {"data": ["/ru/signup.html-3", 500, 0, 0.0, 369.99, 112, 1662, 251.0, 706.9000000000001, 791.9, 1078.8400000000001, 1.1373717613339096, 4.714983522326608, 0.8363681018402674], "isController": false}, {"data": ["/ru/signup.html-4", 500, 0, 0.0, 390.8040000000001, 107, 1463, 281.5, 721.0, 857.95, 1061.88, 1.1373821103442627, 3.0689323934386703, 0.8374864367183341], "isController": false}, {"data": ["/ru/signup.html-1", 500, 0, 0.0, 390.646, 127, 1601, 278.0, 744.0, 853.75, 1066.8700000000001, 1.1371441307442836, 18.669596802805565, 0.8306482517546134], "isController": false}, {"data": ["/", 500, 0, 0.0, 1229.2880000000007, 541, 2923, 1128.5, 1586.8000000000006, 2055.5999999999995, 2612.5600000000004, 1.1319669737315745, 51.990889363811924, 6.5176535909388305], "isController": false}, {"data": ["/ru/signup.html-2", 500, 0, 0.0, 355.6840000000002, 106, 1717, 217.0, 723.0, 824.75, 1122.8200000000002, 1.1373821103442627, 2.1114876872699644, 0.8297113636984027], "isController": false}, {"data": ["/ru/index.html-10", 500, 0, 0.0, 508.7640000000003, 99, 2590, 560.0, 749.5000000000002, 871.95, 1410.4900000000023, 1.1376279547042054, 2.9884953106975707, 0.8232249164412266], "isController": false}, {"data": ["/ru/signup.html-9", 500, 0, 0.0, 458.5799999999997, 105, 1280, 550.5, 717.6000000000001, 775.95, 1008.3400000000006, 1.136616791921837, 2.1888753063182254, 0.8258231378807098], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 3, 60.0, 0.013333333333333334], "isController": false}, {"data": ["Assertion failed", 2, 40.0, 0.008888888888888889], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 22500, 5, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 3, "Assertion failed", 2, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/ru/signup.html", 500, 2, "Assertion failed", 2, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": ["/ru/signup.html-7", 500, 2, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 2, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["/ru/signup.html-8", 500, 1, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
