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

    var data = {"OkPercent": 99.96571428571428, "KoPercent": 0.03428571428571429};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8466666666666667, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, ""], "isController": true}, {"data": [0.464, 500, 1500, "/ru/index.html"], "isController": false}, {"data": [0.997, 500, 1500, "/-0"], "isController": false}, {"data": [0.961, 500, 1500, "/-1"], "isController": false}, {"data": [0.987, 500, 1500, "/-2"], "isController": false}, {"data": [0.973, 500, 1500, "/ru/index.html-0"], "isController": false}, {"data": [0.947, 500, 1500, "/-3"], "isController": false}, {"data": [0.917, 500, 1500, "/-4"], "isController": false}, {"data": [0.901, 500, 1500, "/ru/doc.html"], "isController": false}, {"data": [0.905, 500, 1500, "/-5"], "isController": false}, {"data": [0.911, 500, 1500, "/-6"], "isController": false}, {"data": [0.977, 500, 1500, "/ru/doc.html-2"], "isController": false}, {"data": [0.9, 500, 1500, "/ru/index.html-4"], "isController": false}, {"data": [0.908, 500, 1500, "/-7"], "isController": false}, {"data": [0.974, 500, 1500, "/ru/doc.html-1"], "isController": false}, {"data": [0.918, 500, 1500, "/ru/index.html-3"], "isController": false}, {"data": [0.886, 500, 1500, "/-8"], "isController": false}, {"data": [0.986, 500, 1500, "/ru/doc.html-0"], "isController": false}, {"data": [0.902, 500, 1500, "/ru/index.html-2"], "isController": false}, {"data": [0.626, 500, 1500, "/-9"], "isController": false}, {"data": [0.925, 500, 1500, "/ru/index.html-1"], "isController": false}, {"data": [0.611, 500, 1500, "/ru/index.html-7"], "isController": false}, {"data": [0.973, 500, 1500, "/ru/doc.html-4"], "isController": false}, {"data": [0.899, 500, 1500, "/ru/index.html-6"], "isController": false}, {"data": [0.97, 500, 1500, "/ru/doc.html-3"], "isController": false}, {"data": [0.908, 500, 1500, "/ru/index.html-5"], "isController": false}, {"data": [0.984, 500, 1500, "/ru/signup.html-0"], "isController": false}, {"data": [0.515, 500, 1500, "/ru/signup.html"], "isController": false}, {"data": [0.667, 500, 1500, "/ru/signup.html-7"], "isController": false}, {"data": [0.926, 500, 1500, "/ru/signup.html-5"], "isController": false}, {"data": [0.92, 500, 1500, "/ru/signup.html-6"], "isController": false}, {"data": [0.941, 500, 1500, "/ru/signup.html-3"], "isController": false}, {"data": [0.925, 500, 1500, "/ru/signup.html-4"], "isController": false}, {"data": [0.956, 500, 1500, "/ru/signup.html-1"], "isController": false}, {"data": [0.377, 500, 1500, "/"], "isController": false}, {"data": [0.943, 500, 1500, "/ru/signup.html-2"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 17500, 6, 0.03428571428571429, 372.10354285714214, 48, 9786, 187.0, 830.0, 1109.0, 2091.9600000000064, 42.80298397945457, 362.41126501926135, 48.575038025865226], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["", 500, 2, 0.4, 3999.6400000000017, 1884, 14824, 3592.5, 5854.200000000001, 6694.049999999999, 10024.67, 1.222789868452266, 181.18303171565367, 24.284489762650374], "isController": true}, {"data": ["/ru/index.html", 500, 1, 0.2, 1133.401999999999, 358, 9314, 915.0, 1738.5000000000011, 2739.899999999999, 5089.210000000002, 1.2326139798147135, 48.997173673923065, 7.139914070627548], "isController": false}, {"data": ["/-0", 500, 0, 0.0, 169.48, 100, 1411, 136.0, 263.0, 351.39999999999986, 482.97, 1.2295374234305572, 0.4418650115453564, 0.5475283838714199], "isController": false}, {"data": ["/-1", 500, 0, 0.0, 194.61999999999983, 102, 1155, 136.0, 382.90000000000003, 552.9, 779.94, 1.2301000563385824, 0.48651418243859956, 0.547778931338275], "isController": false}, {"data": ["/-2", 500, 0, 0.0, 185.6000000000001, 109, 2822, 145.0, 278.8000000000004, 409.4499999999999, 690.7100000000003, 1.2319033399363353, 6.856071420212085, 0.5618152927248716], "isController": false}, {"data": ["/ru/index.html-0", 500, 0, 0.0, 217.33199999999997, 105, 8706, 148.0, 285.00000000000034, 438.6499999999999, 1540.0300000000036, 1.2338610968531607, 6.879016603451849, 0.8868376633632091], "isController": false}, {"data": ["/-3", 500, 0, 0.0, 249.86800000000005, 106, 2422, 170.0, 502.50000000000017, 612.8, 1425.94, 1.2330699495921005, 6.094303725474238, 0.6056974459422134], "isController": false}, {"data": ["/-4", 500, 0, 0.0, 279.0640000000001, 105, 2444, 177.0, 590.8000000000001, 709.6499999999999, 1099.5000000000005, 1.233042581892523, 3.9363439455143148, 0.6068881457752262], "isController": false}, {"data": ["/ru/doc.html", 500, 0, 0.0, 456.8720000000002, 251, 9786, 349.0, 730.6000000000001, 932.95, 1618.8100000000002, 1.2335536460145116, 38.549756080185915, 4.348758459094127], "isController": false}, {"data": ["/-5", 500, 0, 0.0, 294.1780000000002, 111, 2434, 173.5, 614.5000000000002, 767.0499999999997, 1532.6400000000012, 1.2330760314681004, 0.5876377962465166, 0.5960670269303805], "isController": false}, {"data": ["/-6", 500, 0, 0.0, 302.3919999999999, 113, 4539, 187.0, 625.6000000000001, 802.4499999999996, 1416.4400000000005, 1.233142936064005, 11.531813238036047, 0.5900781627650024], "isController": false}, {"data": ["/ru/doc.html-2", 500, 0, 0.0, 203.37799999999987, 105, 992, 161.0, 318.4000000000002, 466.1999999999998, 834.95, 1.2340224937620163, 2.351150278642279, 0.876107766567369], "isController": false}, {"data": ["/ru/index.html-4", 500, 0, 0.0, 330.28400000000016, 124, 4896, 189.5, 656.9000000000001, 849.0999999999998, 2283.330000000008, 1.2336632148769915, 11.536678657873114, 0.8879001849261159], "isController": false}, {"data": ["/-7", 500, 0, 0.0, 292.7179999999999, 128, 1881, 190.0, 622.0000000000003, 698.9, 1237.4300000000005, 1.2331216474505209, 11.531614156236513, 0.5864553147543005], "isController": false}, {"data": ["/ru/doc.html-1", 500, 0, 0.0, 216.65600000000003, 109, 7569, 160.5, 289.9000000000004, 497.5499999999999, 832.6200000000003, 1.2340255393925632, 6.099026616079846, 0.8797252380435265], "isController": false}, {"data": ["/ru/index.html-3", 500, 0, 0.0, 292.9360000000004, 110, 4885, 175.0, 603.7, 712.8499999999999, 1457.8600000000001, 1.2336632148769915, 0.5879176258398162, 0.8939239310925075], "isController": false}, {"data": ["/-8", 500, 0, 0.0, 312.0139999999998, 114, 1927, 185.0, 643.9000000000001, 798.2999999999998, 1355.5100000000004, 1.2330790724285985, 4.388027480400209, 0.5960684969259339], "isController": false}, {"data": ["/ru/doc.html-0", 500, 0, 0.0, 197.36799999999997, 108, 1739, 158.5, 306.7000000000001, 412.0, 731.870000000001, 1.234183932899888, 14.184678424119904, 0.8605540313383985], "isController": false}, {"data": ["/ru/index.html-2", 500, 0, 0.0, 301.2840000000001, 116, 3247, 182.5, 637.6000000000005, 760.75, 1505.2600000000007, 1.2336632148769915, 3.9383252435868017, 0.9047666741920122], "isController": false}, {"data": ["/-9", 500, 2, 0.4, 583.4539999999998, 48, 4399, 567.5, 903.8000000000001, 1207.6999999999998, 2010.0500000000009, 1.2339006808663957, 4.073236285502407, 0.5928796373072339], "isController": false}, {"data": ["/ru/index.html-1", 500, 0, 0.0, 288.2280000000001, 110, 3186, 174.0, 607.7, 749.4999999999999, 2395.2600000000007, 1.2336753903965774, 6.097296045700271, 0.9035708425756181], "isController": false}, {"data": ["/ru/index.html-7", 500, 1, 0.2, 642.0239999999994, 112, 4712, 575.5, 997.8000000000004, 1494.4499999999996, 2951.3900000000003, 1.2334593106442604, 4.073352418289488, 0.8907864868056858], "isController": false}, {"data": ["/ru/doc.html-4", 500, 0, 0.0, 216.72400000000007, 106, 6536, 165.0, 299.7000000000001, 507.74999999999994, 838.9200000000001, 1.2340194481465028, 4.391373895552594, 0.8700801187126709], "isController": false}, {"data": ["/ru/index.html-6", 500, 0, 0.0, 319.932, 113, 4610, 181.0, 661.0, 812.95, 2399.240000000009, 1.2336632148769915, 4.390106206066169, 0.8939239310925075], "isController": false}, {"data": ["/ru/doc.html-3", 500, 0, 0.0, 233.14399999999978, 112, 9538, 168.0, 342.4000000000002, 556.6999999999999, 847.98, 1.2340224937620163, 11.540038476821357, 0.8640567656517244], "isController": false}, {"data": ["/ru/index.html-5", 500, 0, 0.0, 311.92999999999995, 114, 3259, 186.0, 641.6000000000001, 802.0, 1457.8600000000001, 1.2336632148769915, 11.536678657873114, 0.8842859372262809], "isController": false}, {"data": ["/ru/signup.html-0", 500, 0, 0.0, 193.64800000000008, 104, 2804, 147.0, 286.0, 406.69999999999993, 851.2800000000007, 1.2343454142833512, 3.085863535708379, 0.8908020128470672], "isController": false}, {"data": ["/ru/signup.html", 500, 0, 0.0, 1013.275999999999, 368, 7523, 897.5, 1458.4000000000005, 1830.5999999999997, 4190.660000000002, 1.233523213673358, 45.24042755148109, 7.167444454449688], "isController": false}, {"data": ["/ru/signup.html-7", 500, 0, 0.0, 541.1780000000005, 112, 3909, 551.5, 899.8000000000004, 1181.7999999999997, 1808.4300000000005, 1.234412456702983, 4.076936453681141, 0.8956723196585121], "isController": false}, {"data": ["/ru/signup.html-5", 500, 0, 0.0, 290.22000000000025, 120, 3814, 191.0, 599.8000000000001, 752.75, 1286.95, 1.234186979327368, 11.541576673866091, 0.8870718913915459], "isController": false}, {"data": ["/ru/signup.html-6", 500, 0, 0.0, 287.59999999999997, 119, 1933, 182.0, 611.5000000000002, 729.6499999999999, 1484.3800000000015, 1.2341108231519191, 4.391699062075775, 0.8966586449463162], "isController": false}, {"data": ["/ru/signup.html-3", 500, 0, 0.0, 262.95599999999973, 111, 1723, 174.5, 561.5000000000005, 702.3999999999999, 1325.97, 1.2342844729481872, 0.5882136941393704, 0.8967848123764173], "isController": false}, {"data": ["/ru/signup.html-4", 500, 0, 0.0, 299.58800000000014, 114, 4997, 192.0, 598.8000000000001, 715.75, 1278.7200000000003, 1.2341230075084044, 11.540978437402812, 0.8906415063952254], "isController": false}, {"data": ["/ru/signup.html-1", 500, 0, 0.0, 252.06799999999984, 111, 7368, 174.0, 401.80000000000007, 629.8499999999999, 1209.8100000000002, 1.2341382382923476, 6.099583617185128, 0.9063202687459427], "isController": false}, {"data": ["/", 500, 2, 0.4, 1396.0900000000001, 639, 6666, 1219.5, 2087.3, 2593.65, 3297.7200000000003, 1.227626506911537, 49.71207842538486, 5.808476454123597], "isController": false}, {"data": ["/ru/signup.html-2", 500, 0, 0.0, 262.1179999999999, 116, 3278, 178.5, 561.3000000000002, 672.6499999999999, 1192.740000000002, 1.2342631449024932, 3.940240449888916, 0.9076173321402122], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 3, 50.0, 0.017142857142857144], "isController": false}, {"data": ["Assertion failed", 3, 50.0, 0.017142857142857144], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 17500, 6, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 3, "Assertion failed", 3, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": ["/ru/index.html", 500, 1, "Assertion failed", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/-9", 500, 2, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 2, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": ["/ru/index.html-7", 500, 1, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/", 500, 2, "Assertion failed", 2, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
