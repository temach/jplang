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

    var data = {"OkPercent": 99.97714285714285, "KoPercent": 0.022857142857142857};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8478611111111111, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, ""], "isController": true}, {"data": [0.478, 500, 1500, "/ru/index.html"], "isController": false}, {"data": [0.984, 500, 1500, "/-0"], "isController": false}, {"data": [0.948, 500, 1500, "/-1"], "isController": false}, {"data": [0.972, 500, 1500, "/-2"], "isController": false}, {"data": [0.98, 500, 1500, "/ru/index.html-0"], "isController": false}, {"data": [0.94, 500, 1500, "/-3"], "isController": false}, {"data": [0.909, 500, 1500, "/-4"], "isController": false}, {"data": [0.906, 500, 1500, "/ru/doc.html"], "isController": false}, {"data": [0.912, 500, 1500, "/-5"], "isController": false}, {"data": [0.901, 500, 1500, "/-6"], "isController": false}, {"data": [0.979, 500, 1500, "/ru/doc.html-2"], "isController": false}, {"data": [0.902, 500, 1500, "/ru/index.html-4"], "isController": false}, {"data": [0.904, 500, 1500, "/-7"], "isController": false}, {"data": [0.977, 500, 1500, "/ru/doc.html-1"], "isController": false}, {"data": [0.922, 500, 1500, "/ru/index.html-3"], "isController": false}, {"data": [0.91, 500, 1500, "/-8"], "isController": false}, {"data": [0.982, 500, 1500, "/ru/doc.html-0"], "isController": false}, {"data": [0.926, 500, 1500, "/ru/index.html-2"], "isController": false}, {"data": [0.669, 500, 1500, "/-9"], "isController": false}, {"data": [0.939, 500, 1500, "/ru/index.html-1"], "isController": false}, {"data": [0.65, 500, 1500, "/ru/index.html-7"], "isController": false}, {"data": [0.971, 500, 1500, "/ru/doc.html-4"], "isController": false}, {"data": [0.892, 500, 1500, "/ru/index.html-6"], "isController": false}, {"data": [0.973, 500, 1500, "/ru/doc.html-3"], "isController": false}, {"data": [0.914, 500, 1500, "/ru/index.html-5"], "isController": false}, {"data": [0.985, 500, 1500, "/ru/signup.html-0"], "isController": false}, {"data": [0.494, 500, 1500, "/ru/signup.html"], "isController": false}, {"data": [0.655, 500, 1500, "/ru/signup.html-7"], "isController": false}, {"data": [0.918, 500, 1500, "/ru/signup.html-5"], "isController": false}, {"data": [0.917, 500, 1500, "/ru/signup.html-6"], "isController": false}, {"data": [0.924, 500, 1500, "/ru/signup.html-3"], "isController": false}, {"data": [0.924, 500, 1500, "/ru/signup.html-4"], "isController": false}, {"data": [0.948, 500, 1500, "/ru/signup.html-1"], "isController": false}, {"data": [0.393, 500, 1500, "/"], "isController": false}, {"data": [0.925, 500, 1500, "/ru/signup.html-2"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 17500, 4, 0.022857142857142857, 377.8092000000003, 94, 17486, 185.0, 817.0, 1082.9500000000007, 2140.9900000000016, 41.39689688860923, 351.12822991895666, 46.98276129721316], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["", 500, 2, 0.4, 4059.577999999998, 1920, 22814, 3410.0, 5262.0, 7825.65, 19035.800000000014, 1.1826397939368423, 175.54501308147442, 23.48882471918218], "isController": true}, {"data": ["/ru/index.html", 500, 0, 0.0, 1076.6819999999996, 384, 11256, 881.5, 1428.1000000000004, 1889.5999999999997, 5711.87, 1.2020097603192537, 47.858535095679976, 6.9643788163809885], "isController": false}, {"data": ["/-0", 500, 0, 0.0, 169.84800000000007, 94, 1942, 126.0, 253.0, 366.6499999999999, 1067.4500000000005, 1.1896943913047617, 0.4275464218751487, 0.5297857836279016], "isController": false}, {"data": ["/-1", 500, 0, 0.0, 221.06399999999985, 104, 2804, 139.0, 455.4000000000002, 636.95, 1802.2600000000016, 1.1907114977483646, 0.47558691658113394, 0.5302387138410686], "isController": false}, {"data": ["/-2", 500, 0, 0.0, 224.47199999999984, 113, 3514, 160.0, 280.90000000000003, 397.84999999999974, 1967.2200000000025, 1.1921054011911516, 6.711413708854482, 0.5436652562072929], "isController": false}, {"data": ["/ru/index.html-0", 500, 0, 0.0, 205.56200000000007, 118, 1806, 163.5, 277.7000000000001, 461.24999999999983, 1199.0500000000018, 1.2033549536106665, 6.786498883888281, 0.8649113729076666], "isController": false}, {"data": ["/-3", 500, 0, 0.0, 244.8119999999999, 112, 1619, 170.0, 530.0, 644.95, 1118.5500000000004, 1.201258919347476, 5.93708143634529, 0.5900715199529106], "isController": false}, {"data": ["/-4", 500, 0, 0.0, 293.1439999999998, 116, 7143, 178.5, 600.8000000000001, 751.55, 1178.4900000000005, 1.2012012012012012, 3.834694069069069, 0.5912162162162162], "isController": false}, {"data": ["/ru/doc.html", 500, 0, 0.0, 480.9559999999999, 266, 11159, 354.5, 704.2000000000006, 933.7999999999997, 2409.720000000002, 1.2028801762941186, 37.671058958570406, 4.240622496505633], "isController": false}, {"data": ["/-5", 500, 0, 0.0, 305.19799999999975, 108, 8041, 174.0, 601.0, 767.6999999999999, 1252.930000000001, 1.2012040869767855, 0.5724488226998743, 0.5806601787631922], "isController": false}, {"data": ["/-6", 500, 0, 0.0, 309.33599999999996, 109, 7080, 184.0, 622.7, 810.3999999999999, 1337.3800000000006, 1.2012416033211928, 11.233485931058341, 0.5748128765892426], "isController": false}, {"data": ["/ru/doc.html-2", 500, 0, 0.0, 206.532, 108, 5622, 156.0, 270.90000000000003, 445.24999999999983, 1018.5000000000005, 1.2034563265699088, 2.2929133722049726, 0.8544069818518786], "isController": false}, {"data": ["/ru/index.html-4", 500, 0, 0.0, 342.682, 119, 11090, 189.5, 609.4000000000002, 727.8, 4108.060000000012, 1.202894645675353, 11.24894445994842, 0.8657552283815775], "isController": false}, {"data": ["/-7", 500, 0, 0.0, 310.1779999999998, 114, 10129, 181.0, 625.3000000000002, 732.6499999999999, 1404.5500000000013, 1.2012214019214738, 11.233297016406283, 0.5712840065778884], "isController": false}, {"data": ["/ru/doc.html-1", 500, 0, 0.0, 207.854, 116, 4560, 159.0, 280.0, 477.24999999999983, 815.96, 1.2034244646566268, 5.947784390260926, 0.8579100187493531], "isController": false}, {"data": ["/ru/index.html-3", 500, 0, 0.0, 282.916, 112, 5107, 178.5, 573.9000000000001, 721.0499999999997, 1470.4600000000014, 1.202894645675353, 0.5732544795796605, 0.8716287373936641], "isController": false}, {"data": ["/-8", 500, 0, 0.0, 293.6740000000001, 111, 7458, 178.0, 585.9000000000003, 756.3999999999999, 1351.7700000000002, 1.2012646914671765, 4.274813023150773, 0.5806894748791528], "isController": false}, {"data": ["/ru/doc.html-0", 500, 0, 0.0, 215.82199999999995, 122, 3946, 172.0, 274.30000000000024, 388.74999999999994, 1215.840000000002, 1.2033375771038552, 13.910065332205404, 0.8390459277853053], "isController": false}, {"data": ["/ru/index.html-2", 500, 0, 0.0, 290.4280000000001, 114, 7078, 178.5, 574.7, 681.6499999999999, 1401.7200000000003, 1.2026747486409775, 3.8393981965892143, 0.8820397814739982], "isController": false}, {"data": ["/-9", 500, 2, 0.4, 593.0559999999998, 96, 16922, 531.5, 820.8000000000001, 1072.5499999999997, 2718.090000000004, 1.2017179760185162, 3.9669977825299045, 0.5774160990552093], "isController": false}, {"data": ["/ru/index.html-1", 500, 0, 0.0, 280.88999999999993, 118, 8087, 175.5, 551.1000000000004, 669.8499999999999, 1486.1300000000008, 1.2027239291547496, 5.944322075636903, 0.8809013152988889], "isController": false}, {"data": ["/ru/index.html-7", 500, 0, 0.0, 591.0980000000005, 106, 6068, 554.0, 798.1000000000004, 1083.8, 3593.0000000000045, 1.2028454511993574, 3.972679019488502, 0.8704184368542224], "isController": false}, {"data": ["/ru/doc.html-4", 500, 0, 0.0, 227.26199999999986, 111, 6948, 163.0, 317.1000000000003, 522.6499999999999, 1050.5700000000004, 1.2034331541020222, 4.282529700730243, 0.8485143918570899], "isController": false}, {"data": ["/ru/index.html-6", 500, 0, 0.0, 325.8779999999997, 108, 7103, 186.0, 628.9000000000001, 759.4499999999998, 2498.6400000000067, 1.2027094638802294, 4.279954381230035, 0.871494552928838], "isController": false}, {"data": ["/ru/doc.html-3", 500, 0, 0.0, 237.31400000000002, 115, 10936, 167.0, 309.5000000000005, 499.29999999999984, 1044.810000000001, 1.2033868118432516, 11.253546982627908, 0.8426058047769642], "isController": false}, {"data": ["/ru/index.html-5", 500, 0, 0.0, 310.38599999999997, 115, 11079, 189.0, 607.5000000000002, 736.75, 1354.7100000000003, 1.202648713526671, 11.24664461008926, 0.862054839578688], "isController": false}, {"data": ["/ru/signup.html-0", 500, 0, 0.0, 184.00600000000003, 114, 4194, 149.0, 231.90000000000003, 293.6499999999999, 649.9300000000001, 1.2029438441754663, 3.0837183505474597, 0.8681401375445992], "isController": false}, {"data": ["/ru/signup.html", 500, 0, 0.0, 1010.5859999999999, 360, 10393, 853.0, 1335.8000000000002, 1828.55, 5315.340000000007, 1.201954859383301, 44.158929457870286, 6.9840150520807045], "isController": false}, {"data": ["/ru/signup.html-7", 500, 0, 0.0, 557.2320000000005, 107, 5148, 537.0, 849.6000000000001, 1165.6499999999999, 2844.3000000000006, 1.2028396638784844, 3.972659905504916, 0.8727635451774549], "isController": false}, {"data": ["/ru/signup.html-5", 500, 0, 0.0, 293.762, 120, 4366, 185.0, 584.0, 719.5999999999999, 1743.780000000001, 1.2028165151518797, 11.248213817475, 0.8645243702654135], "isController": false}, {"data": ["/ru/signup.html-6", 500, 0, 0.0, 296.40999999999985, 108, 5991, 183.5, 553.0, 695.8499999999997, 1727.9500000000019, 1.2028367702389315, 4.280407412842448, 0.8739360908767236], "isController": false}, {"data": ["/ru/signup.html-3", 500, 0, 0.0, 294.1839999999999, 112, 5118, 177.5, 568.8000000000001, 707.9499999999998, 2150.820000000003, 1.2028309830015924, 0.5732241403366964, 0.8739318860870946], "isController": false}, {"data": ["/ru/signup.html-4", 500, 0, 0.0, 306.19399999999996, 120, 6133, 186.5, 570.0, 714.75, 1719.1400000000008, 1.2028136216237022, 11.248186758465403, 0.8680461585741366], "isController": false}, {"data": ["/ru/signup.html-1", 500, 0, 0.0, 257.584, 119, 5118, 173.0, 418.9000000000004, 611.8, 1529.3500000000006, 1.2028309830015924, 5.944851176729551, 0.8833290031417945], "isController": false}, {"data": ["/", 500, 2, 0.4, 1491.3539999999994, 640, 17486, 1175.5, 1966.4, 2775.5999999999995, 6465.840000000002, 1.1871859893058285, 48.15561659917515, 5.617133408838362], "isController": false}, {"data": ["/ru/signup.html-2", 500, 0, 0.0, 284.9660000000001, 115, 4603, 182.5, 552.9000000000001, 705.6999999999999, 1718.820000000001, 1.2028165151518797, 3.8398507695620068, 0.8844930038177397], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 2, 50.0, 0.011428571428571429], "isController": false}, {"data": ["Assertion failed", 2, 50.0, 0.011428571428571429], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 17500, 4, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 2, "Assertion failed", 2, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/-9", 500, 2, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 2, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/", 500, 2, "Assertion failed", 2, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
