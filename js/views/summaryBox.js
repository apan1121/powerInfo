define([
    'jquery',
    'underscore',
    'backbone',

    "text!templates/summaryBox.html",
    "text!templates/summaryChartBox.html",

    "chartjs",
], function($, _, Backbone, SummaryBoxTpl, SummaryChartBox) {

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
                "#2ecc71",
                "#34495e",
                "#16a085",
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
                that.setData();
            }, 10);
        },
        setData: function() {
            var that = this;
            that.target.empty();
            var selectData = that.params.filterBox.selectData;

            var summaryInfo = {};
            _.each(that.params.statusType, function(statusType) {
                summaryInfo[statusType] = {};
            });

            var chartType = {};
            that.params.summaryInfo.comparator = function(model) {
                return that.params.app.Moment(model.get("date")).format("x");
            };
            that.params.summaryInfo.sort();

            var summaryTypeInfo = {};

            _.each(that.params.summaryInfo.toJSON(), function(item) {
                if (selectData.plantType.indexOf(item.type) >= 0) {
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


            that.target.html(that.templates.SummaryBox());


            /* 總運轉量 */
            that.summaryChartBox(that.target.find(".summaryContent"), '總運轉', summaryInfo);

            /* 各運轉量 */
            that.summaryChartTypeBox(that.target.find(".summaryContent"), '各類運轉', summaryTypeInfo);

            /* 個別類型運轉量 */
            _.each(chartType, function(itemInfo, key){
                that.summaryChartBox(that.target.find(".summaryContent"), that.params.lang[key], itemInfo);
            });

        },
        summaryChartBox: function(targetBox, title, summaryInfo) {
            var that = this;
            var datasetsLabel = [];
            var datasets = [];
            var labels = [];

            _.each(summaryInfo, function(item, key) {
                labels = Object.keys(item);
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

            var summaryChartBox = $(that.templates.SummaryChartBox());
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
        summaryChartTypeBox: function(targetBox, title, summaryInfo) {
            var that = this;
            var datasetsLabel = [];
            var datasets = [];
            var labels = [];

            _.each(summaryInfo, function(item, key) {
                labels = Object.keys(item);
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

            var summaryChartBox = $(that.templates.SummaryChartBox());
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