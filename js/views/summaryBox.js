define([
    'jquery',
    'underscore',
    'backbone',

    "text!templates/summaryBox.html",
    "text!templates/summaryChartBox.html",

    "nouislider",
    "chartjs",

], function($, _, Backbone, SummaryBoxTpl, SummaryChartBox, noUiSlider) {

    var SummaryBox = Backbone.View.extend({
        el: 'body',
        params: {
            statusType: ["cap", "used", "fix", "break", "limit"],
            color: [
                "#1abc9c",
                "#c0392b",
                "#e67e22",
                "#9b59b6",
                "#95a5a6",
                "#81B563",
                "#34495e",
                "#2529d8",
                "#27ae60",
                "#2980b9",
                "#8e44ad",
                "#2c3e50",
                "#f1c40f",
                "#e74c3c",
                "#ecf0f1",
                "#95a5a6",
                "#ecf0f1",
                "#95a5a6",
                "#d35400",
                "#c0392b",
                "#bdc3c7",
                "#7f8c8d",
            ]
        },
        templates: {
            SummaryBox: _.template(SummaryBoxTpl),
            SummaryChartBox: _.template(SummaryChartBox),
        },
        initialize: function(data) {
            var that = this;
            $.extend(this.params, data);

            that.listenTo(that.params.summaryInfo, "loadSummaryInfo", that.setDataWait);
            that.listenTo(that.params.filterBox, "renderPage", that.setDataWait);


            that.target = that.$el.find(".summaryBox");
            // that.setAction();
        },
        setDataWaitTimer: null,
        setDataWait: function() {
            var that = this;
            clearTimeout(that.setDataWaitTimer);
            that.setDataWaitTimer = setTimeout(function() {
                if (that.params.summaryInfo.length > 0 && !isNaN(that.params.summaryInfo.startTime) && !isNaN(that.params.summaryInfo.endTime)) {
                    that.setData();
                }
            }, 10);
        },
        setData: function() {
            var that = this;

            that.selectDateRange = {
                start: parseInt(that.params.summaryInfo.startTime),
                end: parseInt(that.params.summaryInfo.endTime),
            };

            that.target.html(that.templates.SummaryBox());

            var sliderTarget = that.target.find("#slider")[0];
            noUiSlider.create(sliderTarget,{
                step: 36000,
                connect: true,
                range: {
                    min: parseInt(that.params.summaryInfo.startTime),
                    max: parseInt(that.params.summaryInfo.endTime)
                },
                start: [ parseInt(that.params.summaryInfo.endTime) -86400000*3, parseInt(that.params.summaryInfo.endTime) ]
            });

            var reRenderTimer = null;
            var initFlag = true;
            sliderTarget.noUiSlider.on('update', function( values, handle ) {
                that.target.find(".summarySlider .start").html(that.params.app.Moment(parseInt(values[0])).format("MM/DD HH:mm"));
                that.target.find(".summarySlider .end").html(that.params.app.Moment(parseInt(values[1])).format("MM/DD HH:mm"));


                that.selectDateRange = {
                    start: parseInt(values[0]),
                    end: parseInt(values[1]),
                };

                clearTimeout(reRenderTimer);
                reRenderTimer = setTimeout(function(){
                    var selectDate = [
                        that.params.app.Moment(that.selectDateRange.start).format("YYYY/MM/DD HH:mm:ss"),
                        that.params.app.Moment(that.selectDateRange.end).format("YYYY/MM/DD HH:mm:ss")
                    ];

                    if (!initFlag) {
                        that.params.app.mixpanel.track("sliderDate", selectDate);
                    }

                    initFlag = false;
                    that.renderPage();
                },500);
            });

            // that.renderPage();
        },
        renderPage: function() {
            var that = this;
            that.target.find(".summaryContent").empty();
            var selectData = that.params.filterBox.selectData;

            var summaryInfo = {};
            _.each(that.params.statusType, function(statusType) {
                summaryInfo[statusType] = {};
            });

            var chartType = {};
            that.params.summaryInfo.comparator = function(model) {
                return model.get("timestamp");
            };
            that.params.summaryInfo.sort();

            var summaryTypeInfo = {};

            var summaryChooseDays = {};
            var thisWeekNum = that.params.app.Moment().format("ww");
            var setSummaryChooseDaysData = function(cutDay){
                var date = that.params.app.Moment().add('days', cutDay*-1);
                var showWeek = date.format("ddd");
                if (date.format("ww") == thisWeekNum -1) {
                    showWeek = "上"+ showWeek;
                } else if (date.format("ww") == thisWeekNum -2) {
                    showWeek = "上上"+ showWeek;
                }
                summaryChooseDays[date.format("YYYY-MM-DD")] = showWeek;
            }
            for (var i = 0; i<=7; i++) {
                setSummaryChooseDaysData(i);
            }
            setSummaryChooseDaysData(7*2);
            // summaryChooseDays[that.params.app.Moment().format("YYYY-MM-DD")] = "今天";
            // summaryChooseDays[that.params.app.Moment().add('days',-1).format("YYYY-MM-DD")] = "昨天";
            // summaryChooseDays[that.params.app.Moment().add('days',-2).format("YYYY-MM-DD")] = "前天";
            // summaryChooseDays[that.params.app.Moment().add('days',-7).format("YYYY-MM-DD")] = "上週" + that.params.app.Moment().add('days',-7).format("dd");
            summaryByDays = {};

            _.each(that.params.summaryInfo.toJSON(), function(item) {
                var thatDay = that.params.app.Moment(parseInt(item.timestamp)).format("YYYY-MM-DD");
                if (["",null, undefined].indexOf(summaryChooseDays[thatDay]) == -1) {
                    if (["",null, undefined].indexOf(summaryByDays[summaryChooseDays[thatDay]]) >= 0) {
                        summaryByDays[summaryChooseDays[thatDay]] = {};
                    }
                    if (["",null, undefined].indexOf(summaryByDays[summaryChooseDays[thatDay]][item.date]) >= 0) {
                        summaryByDays[summaryChooseDays[thatDay]][item.date] = 0;
                    }
                    summaryByDays[summaryChooseDays[thatDay]][item.date] += item.used;
                }


                if (selectData.plantType.indexOf(item.type) >= 0 && item.timestamp >= that.selectDateRange.start && item.timestamp <= that.selectDateRange.end ) {
                    if (["", null, undefined].indexOf(chartType[item.type]) >= 0) {
                        chartType[item.type] = {};
                        _.each(that.params.statusType, function(statusType) {
                            chartType[item.type][statusType] = {};
                        });
                    }

                    _.each(that.params.statusType, function(statusType) {
                        chartType[item.type][statusType][item.date] = item[statusType];
                        if (["", null, undefined].indexOf(summaryInfo[statusType][item.date]) >= 0) {
                            summaryInfo[statusType][item.date] = item[statusType];
                        } else {
                            summaryInfo[statusType][item.date] += item[statusType];
                        }
                    });

                    if (["",null,undefined].indexOf(summaryTypeInfo[item.type]) >= 0){
                        summaryTypeInfo[item.type] = {};
                    }
                    summaryTypeInfo[item.type][item.date] = item.used;

                }
            });



            /* 各運轉量 */
            that.summaryChartTypeDays(that.target.find(".summaryContent"), '一週使用量', 'calendar',summaryByDays);

            /* 總運轉量 */
            that.summaryChartBox(that.target.find(".summaryContent"), '區間總運轉', 'power',summaryInfo);

            /* 各運轉量 */
            that.summaryChartTypeBox(that.target.find(".summaryContent"), '各類運轉', 'machine',summaryTypeInfo);

            /* 個別類型運轉量 */
            _.each(chartType, function(itemInfo, key){
                that.summaryChartBox(that.target.find(".summaryContent"), that.params.lang[key], key.replace(" ","_").replace("-","_"), itemInfo);
            });

        },
        summaryChartBox: function(targetBox, title, icon, summaryInfo) {
            var that = this;
            var datasetsLabel = [];
            var datasets = [];
            var labels = [];

            _.each(summaryInfo, function(item, key) {
                datasetsLabel.push(that.params.lang[key]);
                // var hidden = (datasets.length >= 2) ? true : false;
                var hidden = false;
                datasets.push({
                    label: that.params.lang[key],
                    backgroundColor: that.params.color[datasets.length],
                    borderColor: that.params.color[datasets.length],
                    data: Object.values(item),
                    fill: false,
                    hidden: hidden,
                    radius: 1,
                });
            });

            for (var key in summaryInfo) {
                labels = Object.keys(summaryInfo[key]);
                break;
            }

            var summaryChartBox = $(that.templates.SummaryChartBox({icon: icon}));
            targetBox.append(summaryChartBox);
            summaryChartBox.find("canvas");
            Chart.defaults.global.pointHitDetectionRadius = 1;

            var customTooltips = function(tooltip) {

                var tooltipEl = this._chart.canvas.parentNode.querySelector("#chartjs-tooltip")
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chartjs-tooltip';
                    this._chart.canvas.parentNode.appendChild(tooltipEl);
                }

                // Hide if no tooltip
                if (tooltip.opacity === 0) {
                    tooltipEl.style.opacity = 0;
                    return;
                }

                // Set caret Position
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltip.yAlign) {
                    tooltipEl.classList.add(tooltip.yAlign);
                } else {
                    tooltipEl.classList.add('no-transform');
                }

                var innerHtml = [];
                var titleLines = tooltip.title || [];
                if (["", null, undefined, []].indexOf(titleLines) == -1) {
                    innerHtml.push('<div style="text-align:center; font-weight:900;">' + titleLines.join(",") + '</div>');
                }

                var used = cap = 0;
                _.each(tooltip.dataPoints, function(item, i) {
                    var colors = tooltip.labelColors[i];
                    var style = [];
                    style.push('background:' + colors.backgroundColor);
                    style.push('border-color:' + colors.borderColor);
                    style.push('border-width: 2px');
                    style.push('font-weight: 600');
                    var labelColorBox = '<span class="chartjs-tooltip-key" style="' + style.join(";") + '"></span>';
                    var labelName = datasetsLabel[item.datasetIndex];
                    var value = item.yLabel.toFixed(2);
                    innerHtml.push("<div>" + labelColorBox + labelName + ": " + value + " MW</div>");
                    switch (item.datasetIndex) {
                        case 1:
                            used = item.yLabel;
                            break;
                        case 0:
                            cap = item.yLabel;
                            break;
                    }
                });
                if (cap != 0 && used != 0) {
                    innerHtml.push("<div style='text-align: center;'>使用佔比: " + ((used / cap) * 100).toFixed(2) + "%</div>");
                }


                tooltipEl.innerHTML = innerHtml.join("\<n></n>");

                var positionY = this._chart.canvas.offsetTop;
                var positionX = this._chart.canvas.offsetLeft;
                var boxWidth = $(tooltipEl).outerWidth();

                var diff = 0;
                if (positionX + tooltip.caretX + boxWidth > $(window).width()) {
                    diff = $(window).width() - (positionX + tooltip.caretX + boxWidth);
                }

                // Display, position, and set styles for font
                tooltipEl.style.opacity = 1;
                tooltipEl.style.left = positionX + tooltip.caretX + diff + 'px';
                tooltipEl.style.top = positionY + tooltip.caretY + 'px';
                tooltipEl.style.fontFamily = tooltip._fontFamily;
                tooltipEl.style.fontSize = tooltip.fontSize;
                tooltipEl.style.fontStyle = tooltip._fontStyle;
                tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
            };

            var config = {
                type: 'line',
                animation: false,
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: true,
                        text: title,
                        fontSize: 20,
                    },
                    tooltips: {
                        enabled: false,
                        mode: 'index',
                        position: 'nearest',
                        custom: customTooltips
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: that.params.lang["dateTime"],
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: that.params.lang["actionPower"],
                            }
                        }]
                    },
                },
            };

            new Chart(summaryChartBox.find("canvas")[0], config);
        },
        summaryChartTypeBox: function(targetBox, title, icon, summaryInfo) {
            var that = this;
            var datasetsLabel = [];
            var datasets = [];
            var labels = [];

            _.each(summaryInfo, function(item, key) {
                datasetsLabel.push(that.params.lang[key] || key);
                // var hidden = (datasets.length >= 2) ? true : false;
                var hidden = false;
                datasets.push({
                    label: that.params.lang[key] || key,
                    backgroundColor: that.params.color[datasets.length],
                    borderColor: that.params.color[datasets.length],
                    data: Object.values(item),
                    fill: false,
                    hidden: hidden,
                    radius: 1,
                });
            });

            for (var key in summaryInfo) {
                labels = Object.keys(summaryInfo[key]);
                break;
            }

            var summaryChartBox = $(that.templates.SummaryChartBox({icon: icon}));
            targetBox.append(summaryChartBox);
            summaryChartBox.find("canvas");
            Chart.defaults.global.pointHitDetectionRadius = 1;

            var customTooltips = function(tooltip) {

                var tooltipEl = this._chart.canvas.parentNode.querySelector("#chartjs-tooltip")
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chartjs-tooltip';
                    this._chart.canvas.parentNode.appendChild(tooltipEl);
                }

                // Hide if no tooltip
                if (tooltip.opacity === 0) {
                    tooltipEl.style.opacity = 0;
                    return;
                }

                // Set caret Position
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltip.yAlign) {
                    tooltipEl.classList.add(tooltip.yAlign);
                } else {
                    tooltipEl.classList.add('no-transform');
                }

                var innerHtml = [];
                var titleLines = tooltip.title || [];
                if (["", null, undefined, []].indexOf(titleLines) == -1) {
                    innerHtml.push('<div style="text-align:center; font-weight:900;">' + titleLines.join(",") + '</div>');
                }


                var totalUsed = tooltip.dataPoints.map(function(item){
                    return item.yLabel;
                }).reduce(function(lastVal, newVal){
                    return lastVal + newVal;
                });

                _.each(tooltip.dataPoints, function(item, i) {
                    var colors = tooltip.labelColors[i];
                    var style = [];
                    style.push('background:' + colors.backgroundColor);
                    style.push('border-color:' + colors.borderColor);
                    style.push('border-width: 2px');
                    style.push('font-weight: 600');
                    var labelColorBox = '<span class="chartjs-tooltip-key" style="' + style.join(";") + '"></span>';
                    var labelName = datasetsLabel[item.datasetIndex];
                    var value = item.yLabel.toFixed(2);
                    var percent = ((item.yLabel / totalUsed) *100).toFixed(2) + "%";

                    innerHtml.push("<div>" + labelColorBox + labelName + ": " + value + " MW ("+percent+")</div>");
                    switch (item.datasetIndex) {
                        case 1:
                            used = item.yLabel;
                            break;
                        case 0:
                            cap = item.yLabel;
                            break;
                    }
                });

                tooltipEl.innerHTML = innerHtml.join("\<n></n>");

                var positionY = this._chart.canvas.offsetTop;
                var positionX = this._chart.canvas.offsetLeft;
                var boxWidth = $(tooltipEl).outerWidth();

                var diff = 0;
                if (positionX + tooltip.caretX + boxWidth > $(window).width()) {
                    diff = $(window).width() - (positionX + tooltip.caretX + boxWidth);
                }

                // Display, position, and set styles for font
                tooltipEl.style.opacity = 1;
                tooltipEl.style.left = positionX + tooltip.caretX + diff + 'px';
                tooltipEl.style.top = positionY + tooltip.caretY + 'px';
                tooltipEl.style.fontFamily = tooltip._fontFamily;
                tooltipEl.style.fontSize = tooltip.fontSize;
                tooltipEl.style.fontStyle = tooltip._fontStyle;
                tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
            };

            var config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                options: {
                    animation: false,
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: true,
                        text: title,
                        fontSize: 20,
                    },
                    tooltips: {
                        enabled: false,
                        mode: 'index',
                        position: 'nearest',
                        custom: customTooltips
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: that.params.lang["dateTime"],
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: that.params.lang["actionPower"],
                            }
                        }]
                    },
                },
            };

            new Chart(summaryChartBox.find("canvas")[0], config);
        },
        summaryChartTypeDays: function(targetBox, title, icon, summaryInfo) {
            var that = this;
            var datasetsLabel = [];
            var datasets = [];
            var labels = [];

            _.each(summaryInfo, function(item, key) {
                datasetsLabel.push(that.params.lang[key] || key);
                // var hidden = (datasets.length >= 2) ? true : false;
                var hidden = false;
                datasets.push({
                    label: that.params.lang[key] || key,
                    backgroundColor: that.params.color[datasets.length],
                    borderColor: that.params.color[datasets.length],
                    data: Object.values(item),
                    fill: false,
                    hidden: hidden,
                    radius: 1,
                });
            });

            for (var key in summaryInfo) {
                labels = Object.keys(summaryInfo[key]);
                break;
            }

            var summaryChartBox = $(that.templates.SummaryChartBox({icon: icon}));
            targetBox.append(summaryChartBox);
            summaryChartBox.find("canvas");
            Chart.defaults.global.pointHitDetectionRadius = 1;

            var customTooltips = function(tooltip) {

                var tooltipEl = this._chart.canvas.parentNode.querySelector("#chartjs-tooltip")
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chartjs-tooltip';
                    this._chart.canvas.parentNode.appendChild(tooltipEl);
                }

                // Hide if no tooltip
                if (tooltip.opacity === 0) {
                    tooltipEl.style.opacity = 0;
                    return;
                }

                // Set caret Position
                tooltipEl.classList.remove('above', 'below', 'no-transform');
                if (tooltip.yAlign) {
                    tooltipEl.classList.add(tooltip.yAlign);
                } else {
                    tooltipEl.classList.add('no-transform');
                }

                var innerHtml = [];
                var titleLines = tooltip.title || [];
                if (["", null, undefined, []].indexOf(titleLines) == -1) {
                    innerHtml.push('<div style="text-align:center; font-weight:900;">' + titleLines.join(",") + '</div>');
                }


                var totalUsed = tooltip.dataPoints.map(function(item){
                    return item.yLabel;
                }).reduce(function(lastVal, newVal){
                    return lastVal + newVal;
                });

                _.each(tooltip.dataPoints, function(item, i) {
                    var colors = tooltip.labelColors[i];
                    var style = [];
                    style.push('background:' + colors.backgroundColor);
                    style.push('border-color:' + colors.borderColor);
                    style.push('border-width: 2px');
                    style.push('font-weight: 600');
                    var labelColorBox = '<span class="chartjs-tooltip-key" style="' + style.join(";") + '"></span>';
                    var labelName = datasetsLabel[item.datasetIndex];
                    var value = item.yLabel.toFixed(2);

                    innerHtml.push("<div>" + labelColorBox + labelName + ": " + value + " MW</div>");
                    switch (item.datasetIndex) {
                        case 1:
                            used = item.yLabel;
                            break;
                        case 0:
                            cap = item.yLabel;
                            break;
                    }
                });

                tooltipEl.innerHTML = innerHtml.join("\<n></n>");

                var positionY = this._chart.canvas.offsetTop;
                var positionX = this._chart.canvas.offsetLeft;
                var boxWidth = $(tooltipEl).outerWidth();

                var diff = 0;
                if (positionX + tooltip.caretX + boxWidth > $(window).width()) {
                    diff = $(window).width() - (positionX + tooltip.caretX + boxWidth);
                }

                // Display, position, and set styles for font
                tooltipEl.style.opacity = 1;
                tooltipEl.style.left = positionX + tooltip.caretX + diff + 'px';
                tooltipEl.style.top = positionY + tooltip.caretY + 'px';
                tooltipEl.style.fontFamily = tooltip._fontFamily;
                tooltipEl.style.fontSize = tooltip.fontSize;
                tooltipEl.style.fontStyle = tooltip._fontStyle;
                tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
            };

            var config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                options: {
                    animation: false,
                    maintainAspectRatio: false,
                    responsive: true,
                    title: {
                        display: true,
                        text: title,
                        fontSize: 20,
                    },
                    tooltips: {
                        enabled: false,
                        mode: 'index',
                        position: 'nearest',
                        custom: customTooltips
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: that.params.lang["dateTime"],
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: that.params.lang["actionPower"],
                            }
                        }]
                    },
                },
            };

            new Chart(summaryChartBox.find("canvas")[0], config);
        },
    });
    return SummaryBox;
});