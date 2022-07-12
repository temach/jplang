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

    var data = {"OkPercent": 99.98857142857143, "KoPercent": 0.011428571428571429};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8573333333333333, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, ""], "isController": true}, {"data": [0.5, 500, 1500, "/ru/index.html"], "isController": false}, {"data": [0.998, 500, 1500, "/-0"], "isController": false}, {"data": [0.966, 500, 1500, "/-1"], "isController": false}, {"data": [0.986, 500, 1500, "/-2"], "isController": false}, {"data": [0.987, 500, 1500, "/ru/index.html-0"], "isController": false}, {"data": [0.95, 500, 1500, "/-3"], "isController": false}, {"data": [0.926, 500, 1500, "/-4"], "isController": false}, {"data": [0.91, 500, 1500, "/ru/doc.html"], "isController": false}, {"data": [0.92, 500, 1500, "/-5"], "isController": false}, {"data": [0.915, 500, 1500, "/-6"], "isController": false}, {"data": [0.985, 500, 1500, "/ru/doc.html-2"], "isController": false}, {"data": [0.922, 500, 1500, "/ru/index.html-4"], "isController": false}, {"data": [0.908, 500, 1500, "/-7"], "isController": false}, {"data": [0.991, 500, 1500, "/ru/doc.html-1"], "isController": false}, {"data": [0.928, 500, 1500, "/ru/index.html-3"], "isController": false}, {"data": [0.91, 500, 1500, "/-8"], "isController": false}, {"data": [0.986, 500, 1500, "/ru/doc.html-0"], "isController": false}, {"data": [0.925, 500, 1500, "/ru/index.html-2"], "isController": false}, {"data": [0.654, 500, 1500, "/-9"], "isController": false}, {"data": [0.961, 500, 1500, "/ru/index.html-1"], "isController": false}, {"data": [0.643, 500, 1500, "/ru/index.html-7"], "isController": false}, {"data": [0.985, 500, 1500, "/ru/doc.html-4"], "isController": false}, {"data": [0.915, 500, 1500, "/ru/index.html-6"], "isController": false}, {"data": [0.986, 500, 1500, "/ru/doc.html-3"], "isController": false}, {"data": [0.908, 500, 1500, "/ru/index.html-5"], "isController": false}, {"data": [0.988, 500, 1500, "/ru/signup.html-0"], "isController": false}, {"data": [0.521, 500, 1500, "/ru/signup.html"], "isController": false}, {"data": [0.667, 500, 1500, "/ru/signup.html-7"], "isController": false}, {"data": [0.927, 500, 1500, "/ru/signup.html-5"], "isController": false}, {"data": [0.928, 500, 1500, "/ru/signup.html-6"], "isController": false}, {"data": [0.938, 500, 1500, "/ru/signup.html-3"], "isController": false}, {"data": [0.937, 500, 1500, "/ru/signup.html-4"], "isController": false}, {"data": [0.958, 500, 1500, "/ru/signup.html-1"], "isController": false}, {"data": [0.405, 500, 1500, "/"], "isController": false}, {"data": [0.93, 500, 1500, "/ru/signup.html-2"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 17500, 2, 0.011428571428571429, 336.6838285714301, 96, 7706, 185.0, 750.0, 994.0, 1592.9600000000064, 47.76292123484892, 405.128674802398, 54.21041451733522], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["", 500, 1, 0.2, 3619.69, 2114, 12880, 3411.5, 4373.200000000001, 5029.499999999999, 9431.470000000023, 1.364491031200452, 202.540014445696, 27.101952595193715], "isController": true}, {"data": ["/ru/index.html", 500, 0, 0.0, 960.7659999999997, 374, 7706, 890.0, 1221.8000000000004, 1495.4499999999998, 3063.870000000007, 1.3797214066535683, 54.934200654953756, 7.99403037663635], "isController": false}, {"data": ["/-0", 500, 0, 0.0, 150.02200000000016, 96, 1028, 129.0, 227.80000000000007, 270.95, 490.8700000000001, 1.3776267898816068, 0.4950846276137025, 0.613474429869153], "isController": false}, {"data": ["/-1", 500, 0, 0.0, 189.82200000000006, 102, 2075, 144.0, 241.90000000000003, 566.75, 742.8300000000002, 1.378492756020567, 0.5505893918089961, 0.6138600554154089], "isController": false}, {"data": ["/-2", 500, 0, 0.0, 191.80599999999995, 117, 1028, 165.5, 253.80000000000007, 334.4999999999999, 734.8600000000001, 1.3812078386307258, 7.776038271197397, 0.629906309219286], "isController": false}, {"data": ["/ru/index.html-0", 500, 0, 0.0, 192.952, 123, 1028, 166.5, 247.0, 311.74999999999994, 774.0800000000008, 1.3807615728531228, 7.787009846901157, 0.992422380488182], "isController": false}, {"data": ["/-3", 500, 0, 0.0, 233.588, 116, 1236, 172.0, 501.30000000000024, 609.95, 950.8100000000002, 1.3828580911026909, 6.834614061592499, 0.6792750193600133], "isController": false}, {"data": ["/-4", 500, 0, 0.0, 250.766, 115, 1800, 175.0, 556.0, 623.6499999999999, 987.4800000000005, 1.3828160218595555, 4.41447810103407, 0.680604760759], "isController": false}, {"data": ["/ru/doc.html", 500, 0, 0.0, 438.43400000000014, 262, 3543, 375.0, 597.8000000000001, 770.2999999999998, 1235.2600000000007, 1.3804184876687215, 43.23109421977367, 4.866514395003989], "isController": false}, {"data": ["/-5", 500, 0, 0.0, 258.88000000000005, 115, 2294, 172.0, 552.0, 669.8499999999999, 1096.0700000000018, 1.3828160218595555, 0.6589982604174445, 0.668451104316875], "isController": false}, {"data": ["/-6", 500, 0, 0.0, 282.2159999999998, 113, 2762, 183.0, 585.9000000000001, 707.0, 1477.4800000000014, 1.3810971988586613, 12.915416773701699, 0.6608765892976016], "isController": false}, {"data": ["/ru/doc.html-2", 500, 0, 0.0, 186.93400000000005, 108, 929, 162.5, 246.80000000000007, 306.84999999999997, 592.6800000000003, 1.3828848637720121, 2.6347737980656207, 0.9817942343381375], "isController": false}, {"data": ["/ru/index.html-4", 500, 0, 0.0, 272.96399999999994, 123, 3103, 184.5, 577.8000000000001, 647.75, 940.2300000000007, 1.3808835997978386, 12.913419288734476, 0.9938586064951241], "isController": false}, {"data": ["/-7", 500, 0, 0.0, 282.8599999999997, 115, 2396, 184.0, 589.0, 682.75, 1136.850000000001, 1.3828504419590013, 12.931812336132223, 0.6576642238613609], "isController": false}, {"data": ["/ru/doc.html-1", 500, 0, 0.0, 183.41999999999993, 111, 955, 160.0, 239.7000000000001, 271.95, 665.97, 1.3828810390414976, 6.834727479090838, 0.9858429282229425], "isController": false}, {"data": ["/ru/index.html-3", 500, 0, 0.0, 264.0800000000003, 117, 4281, 170.0, 550.0, 681.6499999999999, 1147.4400000000005, 1.380677691838262, 0.6579792125166717, 1.0004519993593655], "isController": false}, {"data": ["/-8", 500, 0, 0.0, 275.11600000000027, 103, 1771, 182.0, 582.9000000000001, 662.8, 963.94, 1.3828274950356494, 4.920921281162018, 0.6684566504322719], "isController": false}, {"data": ["/ru/doc.html-0", 500, 0, 0.0, 217.56199999999995, 119, 2594, 176.0, 299.60000000000014, 369.84999999999997, 782.7600000000002, 1.3827395388840187, 15.98387492360364, 0.964136748792177], "isController": false}, {"data": ["/ru/index.html-2", 500, 0, 0.0, 268.126, 109, 3924, 176.0, 560.0, 639.6999999999999, 1361.0200000000027, 1.380750133932763, 4.407882995924026, 1.012639990804204], "isController": false}, {"data": ["/-9", 500, 1, 0.2, 525.7439999999992, 112, 5050, 539.5, 727.6000000000001, 937.1499999999999, 2208.3000000000015, 1.3838532008524536, 4.57020492703634, 0.6662658537682322], "isController": false}, {"data": ["/ru/index.html-1", 500, 0, 0.0, 226.77199999999968, 118, 2495, 172.0, 341.30000000000024, 569.3999999999999, 812.2500000000007, 1.3808302103556742, 6.824591498642644, 1.0113502517253474], "isController": false}, {"data": ["/ru/index.html-7", 500, 0, 0.0, 529.6180000000007, 111, 3747, 547.0, 740.9000000000003, 938.9, 1639.8000000000002, 1.3810247203424941, 4.561157816599917, 0.999354802513465], "isController": false}, {"data": ["/ru/doc.html-4", 500, 0, 0.0, 189.05800000000013, 113, 934, 165.0, 248.80000000000007, 311.9, 677.6100000000004, 1.381322312223045, 4.915564947012476, 0.9739401459228891], "isController": false}, {"data": ["/ru/index.html-6", 500, 0, 0.0, 281.1800000000002, 117, 3136, 183.0, 572.0, 693.55, 1096.94, 1.3806738793070121, 4.913257437690188, 1.0004492367634796], "isController": false}, {"data": ["/ru/doc.html-3", 500, 0, 0.0, 194.5760000000001, 118, 974, 167.0, 264.90000000000003, 322.9, 723.7700000000002, 1.3821165179509294, 12.924948999900487, 0.9677515071980628], "isController": false}, {"data": ["/ru/index.html-5", 500, 0, 0.0, 296.77199999999993, 124, 6899, 189.5, 590.8000000000001, 656.3499999999999, 1377.1600000000026, 1.3806738793070121, 12.91145807445698, 0.9896627220813935], "isController": false}, {"data": ["/ru/signup.html-0", 500, 0, 0.0, 183.942, 111, 2529, 152.0, 225.80000000000007, 274.79999999999995, 853.2400000000016, 1.3813375768023692, 3.541026503033417, 0.9968832707587411], "isController": false}, {"data": ["/ru/signup.html", 500, 0, 0.0, 923.5939999999997, 394, 3933, 878.0, 1197.8000000000002, 1467.6999999999998, 2352.430000000001, 1.3778279919534846, 50.620377817658245, 8.005934132932845], "isController": false}, {"data": ["/ru/signup.html-7", 500, 0, 0.0, 500.19799999999987, 115, 1790, 539.5, 749.9000000000001, 914.1999999999998, 1487.3800000000006, 1.3791429454080057, 4.554942813837769, 1.0006867269903792], "isController": false}, {"data": ["/ru/signup.html-5", 500, 0, 0.0, 272.994, 117, 1524, 190.0, 601.6000000000001, 699.5999999999999, 996.97, 1.3815589511204442, 12.919734878837279, 0.9929954961178192], "isController": false}, {"data": ["/ru/signup.html-6", 500, 0, 0.0, 267.81, 111, 1654, 186.0, 565.8000000000001, 668.6999999999999, 1071.8700000000001, 1.3815971262779772, 4.916542898590771, 1.003816662061343], "isController": false}, {"data": ["/ru/signup.html-3", 500, 0, 0.0, 248.43400000000008, 117, 1206, 178.0, 541.0, 635.8499999999999, 912.8500000000001, 1.3813299444705363, 0.6582900516617399, 1.003622537779374], "isController": false}, {"data": ["/ru/signup.html-4", 500, 0, 0.0, 264.86, 121, 2423, 191.0, 525.0, 625.0, 1062.5000000000005, 1.3814597055833076, 12.9188067779939, 0.9969714086192034], "isController": false}, {"data": ["/ru/signup.html-1", 500, 0, 0.0, 227.922, 107, 1807, 177.0, 354.00000000000034, 554.95, 954.7500000000002, 1.3815169608837288, 6.827985682648976, 1.0145515181489884], "isController": false}, {"data": ["/", 500, 1, 0.2, 1296.8939999999993, 624, 7386, 1177.5, 1812.4000000000024, 2076.4499999999994, 3181.970000000001, 1.3742493163109653, 55.74537940876359, 6.5035436306979815], "isController": false}, {"data": ["/ru/signup.html-2", 500, 0, 0.0, 253.25199999999998, 117, 1609, 180.0, 548.9000000000001, 637.4999999999999, 1032.6600000000003, 1.3815131437160493, 4.410318815241958, 1.0158978488458839], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 1, 50.0, 0.005714285714285714], "isController": false}, {"data": ["Assertion failed", 1, 50.0, 0.005714285714285714], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 17500, 2, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 1, "Assertion failed", 1, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/-9", 500, 1, "Non HTTP response code: java.net.SocketException/Non HTTP response message: Socket closed", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["/", 500, 1, "Assertion failed", 1, null, null, null, null, null, null, null, null], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
