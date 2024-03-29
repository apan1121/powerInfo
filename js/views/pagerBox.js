define([
    'jquery',
    'underscore',
    'backbone',

    "text!templates/pagerBoxNote.html",
    "text!templates/pagerBox.html",

    "text!templates/plantInfoBox.html",

    "jquery_circle_progress",
    "jquery_imgLiquid",

    "chartjs",
], function($, _, Backbone, PagerBoxNote, PagerBox, PlantInfoBox) {
    var PagerBox = Backbone.View.extend({
        el: 'body',
        params: {

        },
        templates: {
            PagerBoxNote: _.template(PagerBoxNote),
            PagerBox: _.template(PagerBox),
            PlantInfoBox: _.template(PlantInfoBox),
        },
        initialize: function(data) {
            var that = this;
            $.extend(this.params, data);

            that.listenTo(that.params.filterBox, "renderPage", that.render);

            that.setAction();
        },
        render: function() {
            var that = this;
            /* 取得搜尋條件 */
            var selectData = that.params.filterBox.selectData;

            /* 重新排序 */
            that.params.powerInfo.comparator = function(model) {
                var value = 0;
                switch (selectData.sortType) {
                    case "sn":
                        value = parseFloat(model.get("sn"));
                        break;
                    case "used":
                        value = parseFloat(model.get("used")) * -1;
                        break;
                    case "percent":
                        value = (parseFloat(model.get("used")) / parseFloat(model.get("capacity"))) * -1;
                        if (isNaN(value)) {
                            value = 0;
                        }
                        break;
                }
                return value;
            };
            that.params.powerInfo.sort();

            var powerPlant = that.params.powerPlantInfo.getPowerPlantByNickName();

            var result = that.params.powerInfo.toJSON().filter(function(data) {
                var item = data;
                var plantTypeFlag = selectData.plantType.indexOf(item.type) >= 0 ? true : false;

                return plantTypeFlag;
            });

            var groupResult = {};
            var nowSummary = {
                cap: 0,
                used: 0,
                limit: 0,
                fix: 0,
                break: 0,
            };

            _.each(result, function(result_one) {
                var groupKey = "";
                switch (selectData.groupType) {
                    case "all":
                        groupKey = "不分類";
                        break;
                    case "name":
                        groupKey = result_one.mappingName;
                        break;
                    case "plantType":
                        groupKey = that.params.lang[result_one.type];
                        break;
                    case "location":
                        var location = {};
                        var match = false;

                        _.each(result_one.mappingName, function(mappingName) {
                            if (["", null, undefined].indexOf(powerPlant[mappingName]) == -1) {
                                locationKey = powerPlant[mappingName].location;
                                if (["", null, undefined].indexOf(location[locationKey]) == -1) {
                                    location[locationKey] += 1;
                                } else {
                                    location[locationKey] = 1;
                                }
                                match = true;
                            }
                        });

                        location = Object.keys(location);
                        if (location.length == 0) {
                            groupKey = "△無對應電廠:" + result_one.mappingName[0];
                        } else if (location.length > 1) {
                            groupKey = "△可能地點:" + location.join("、");
                        } else {
                            groupKey = location[0];
                        }

                        break;
                }

                result_one.fullName = "";
                if (result_one.mappingName.length > 1) {
                    result_one.fullName = "多個電廠";
                } else {
                    if (["", null, undefined].indexOf(powerPlant[result_one.mappingName[0]]) == -1) {
                        result_one.fullName = powerPlant[result_one.mappingName[0]].fullName;
                    } else {
                        result_one.fullName = result_one.name;
                    }
                }

                if (["", null, undefined].indexOf(powerPlant[result_one.mappingName]) == -1) {
                    result_one.fullName = powerPlant[result_one.mappingName].fullName;
                }


                if (["", null, undefined].indexOf(groupResult[groupKey]) >= 0) {
                    groupResult[groupKey] = { used: 0, cap: 0, fix: 0, limit: 0, break: 0, info: [] };
                }

                switch (result_one.status) {
                    case "break":
                        groupResult[groupKey][result_one.status] += result_one.capacity;
                        nowSummary[result_one.status] += result_one.capacity;
                        break;
                    case "fix":
                    case "limit":
                        groupResult[groupKey][result_one.status] += result_one.capacity;
                        nowSummary[result_one.status] += result_one.capacity;
                        break;
                    default:
                        groupResult[groupKey]["cap"] += result_one.capacity;
                        groupResult[groupKey]["used"] += result_one.used;
                        nowSummary["cap"] += result_one.capacity;
                        nowSummary["used"] += result_one.used;
                        break;
                }

                result_one.icon = "icon-" + result_one.type.replace(" ", "_").replace("-", "_");

                result_one.showNote = that.templates.PagerBoxNote({ lang: that.params.lang, result: result_one });
                result_one.showNote = that.escapeHtml(result_one.showNote).replace(/\n/ig, "").replace(/\s{2,}/ig, "");
                groupResult[groupKey].info.push(result_one);
            });


            // groupResult = that.sortObject(groupResult);
            Object.keys(groupResult).filter(function(key) {
                if (key.indexOf("△") >= 0) {
                    return true;
                } else {
                    return false;
                }
            }).sort().map(function(key) {
                var tmpSave = groupResult[key];
                delete groupResult[key];
                groupResult[key] = tmpSave;
            });

            this.$el.find(".pagerBox").html(that.templates.PagerBox({
                lang: that.params.lang,
                getTime: that.params.powerInfo.getTime,
                nowSummary: nowSummary,
                groupResult: groupResult,
            }));

            this.$el.find(".pagerBox").find('[data-toggle="popover"]').popover({
                html: true,
                trigger: "click hover",
                animation: true,
                placement: function(item, item2) {
                    if ($(item2).offset().top < $(window).scrollTop() + 100) {
                        return "bottom";
                    } else {
                        return "top";
                    }
                }
            });

            this.$el.find(".powerPercent").each(function() {
                var val = parseFloat($(this).data("val"));
                if (val > 90) {
                    $(this).addClass("label label-danger");
                } else if (val > 80) {
                    $(this).addClass("label label-warning");
                } else if (val == 0) {
                    $(this).addClass("label label-default");
                } else if (val < 0) {
                    $(this).addClass("label label-info");
                } else {
                    $(this).addClass("label label-success");
                }
            });


            this.$el.find(".pagerBox").find(".plantIntro").bind("click", function() {
                var mappingname = $(this).parents(".plantBox").data("mappingname").split(",");

                var plantInfo = mappingname.map(function(itemKey) {
                    return powerPlant[itemKey];
                });

                var plantInfoBox = $(that.templates.PlantInfoBox({
                    plantInfo: plantInfo,
                    lang: that.params.lang
                }));

                plantInfoBox.bind("shown.bs.modal", function() {
                    that.$el.find(".pagerBox").find('[data-toggle="popover"]').popover("hide");
                    that.$el.find(".imgLiquidFill").imgLiquid();
                })
                plantInfoBox.bind("hidden.bs.modal", function() {
                    plantInfoBox.remove();
                });
                plantInfoBox.modal("show");
            });

            this.$el.find(".pagerBox .circle").trigger("circle:set");

            that.setPeiData(groupResult, selectData.groupType);
        },
        setPeiData: function(groupResult, groupType) {
            var that = this;
            var pieObject = {};
            _.each(groupResult, function(item, key) {
                pieObject[key] = item.used;
            });

            var pie = [];
            _.each(pieObject, function(item, key) {
                pie.push({ group: key, value: parseFloat(item.toFixed(2)) });
            });
            pie = pie.sort(function(a, b) {
                if (a.value > b.value)
                    return -1;
                if (a.value < b.value)
                    return 1;
                return 0;
            });


            var limit = 10;
            switch (groupType) {
                case "all":
                    limit = 10;
                    break;
                case "name":
                    limit = 15;
                    break;
                case "plantType":
                    limit = 10;
                    break;
                case "location":
                    limit = 10;
                    break;
            }
            var newPie = [];
            var other = 0;
            for (var i = 0; i < pie.length; i++) {
                if (i < limit) {
                    newPie.push(pie[i]);
                } else {
                    other += pie[i].value;
                }
            }
            if (other > 0) {
                newPie.push({ group: "其他", value: parseFloat(other.toFixed(2)) });
            }

            var data = {
                datasets: {
                    data: [

                    ],
                },
                labels: [],
            };

            _.each(newPie, function(newPie_one) {
                data.labels.push(newPie_one.group);
                data.datasets.data.push(newPie_one.value);
            });

            var config = {
                type: 'pie',
                data: {
                    datasets: [{
                        data: data.datasets.data,
                        backgroundColor: [
                            "#1abc9c",
                            "#2ecc71",
                            "#95a5a6",
                            "#9b59b6",
                            "#34495e",
                            "#16a085",
                            "#27ae60",
                            "#2980b9",
                            "#8e44ad",
                            "#2c3e50",
                            "#f1c40f",
                            "#e67e22",
                            "#e74c3c",
                            "#ecf0f1",
                            "#95a5a6",
                            "#ecf0f1",
                            "#95a5a6",
                            "#d35400",
                            "#c0392b",
                            "#c0392b",
                            "#bdc3c7",
                            "#7f8c8d",
                        ],
                        label: 'Dataset 1'
                    }],
                    labels: data.labels
                },
                options: {
                    responsive: true,
                    animation: false,
                    tooltips: {
                        callbacks: {
                            label: function(tooltipItem, data) {
                                //get the concerned dataset
                                var dataset = data.datasets[tooltipItem.datasetIndex];
                                //calculate the total of this data set
                                var total = dataset.data.reduce(function(previousValue, currentValue, currentIndex, array) {
                                    return previousValue + currentValue;
                                });
                                //get the current items value
                                var currentValue = dataset.data[tooltipItem.index];
                                //calculate the precentage based on the total and current item, also this does a rough rounding to give a whole number
                                var precentage = Math.floor(((currentValue / total) * 100) + 0.5);

                                return data.labels[tooltipItem.index] + ": " + currentValue + " MW(" + precentage + "%)";
                            }
                        }
                    }
                }
            };
            var ctx = that.$el.find(".groupPie #chart-area")[0].getContext("2d");
            new Chart(ctx, config);


        },
        setAction: function() {
            var that = this;
            that.$el.on("circle:set", ".circle", function(e) {
                var value = $(this).data("value");
                var color = "#dedede";
                if (!isNaN(value)) {
                    if (value > 90) {
                        color = "#e74c3c";
                    } else if (value <= 90 && value > 80) {
                        color = "#e67e22";
                    } else if (value < 80 && value >= 60) {
                        color = "#f1c40f";
                    } else if (value < 60 && value >= 40) {
                        color = "#2ecc71";
                    } else if (value < 40 && value >= 10) {
                        color = "#1abc9c";
                    } else if (value < 10) {
                        color = "#3498db";
                    }
                    value = value / 100;
                } else {
                    value = 0;
                }
                $(this).circleProgress({
                    startAngle: 0,
                    value: value,
                    thickness: 'auto',
                    size: $(this).data("size"),
                    fill: {
                        color: color,
                    }
                });
            });

            $(window).bind("scroll", function() {
                that.$el.find(".pagerBox").find('[data-toggle="popover"]').popover("hide");
            });
        },
        escapeHtml: function(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },
        sortObject: function(o) {
            var sorted = {},
                key, a = [];

            for (key in o) {
                if (o.hasOwnProperty(key)) {
                    a.push(key);
                }
            }

            a.sort(function(a, b) {
                return a <= b;
            });

            for (key = 0; key < a.length; key++) {
                sorted[a[key]] = o[a[key]];
            }
            return sorted;
        }
    });

    return PagerBox;
});