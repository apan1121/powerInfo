define([
    'jquery',
    'underscore',
    'backbone',

    "text!templates/filterBox.html",
    "text!templates/pagerBox.html",

    "text!templates/pagerBoxNote.html",

    "text!templates/plantInfoModal.html",

    "bootstrap_toggle",

    "jquery_circle_progress",
    "jquery_imgLiquid",
], function($, _, Backbone, FilterBox, PagerBox, PagerBoxNote, PlantInfoModal) {
    var FilterPower = Backbone.View.extend({
        el: 'body',
        params: {

        },
        templates: {
            FilterBox: _.template(FilterBox),
            PagerBox: _.template(PagerBox),
            PagerBoxNote: _.template(PagerBoxNote),
            PlantInfoModal: _.template(PlantInfoModal),
        },
        initialize: function(data) {
            var that = this;
            $.extend(this.params, data);

            that.sortTypeSelect = {
                sn: "不用排序",
                used: "使用量",
                percent: "發電比",
            };

            that.groupTypeSelect = {
                'all': "不分類",
                'name': "電廠",
                'plantType': "發電類型",
                'location': '地點',
            };


            that.selectData = {
                groupType: "name",
                plantType: [],
                sortType: "sn"
            };

            that.setAction();
            that.getFilterItem();

            that.$el.find(".setting").bind("click", function() {
                if (that.$el.find(".filterBox form").length == 0) {
                    that.render();
                } else {
                    that.$el.find(".filterBox").slideUp(function() {
                        that.$el.find(".filterBox").empty();
                    });
                }
            });

            that.reset();
        },
        getFilterItem: function() {
            var that = this;
            var powerInfo = that.params.powerInfo.toJSON();
            that.filterItem = {
                type: {},
            };
            _.each(powerInfo, function(item) {
                that.filterItem.type[item.type] = 1;
            });

            that.filterItem.type = Object.keys(that.filterItem.type);
            that.selectData.plantType = that.filterItem.type;
        },
        render: function() {
            var that = this;
            var target = $(that.templates.FilterBox({ groupTypeSelect: that.groupTypeSelect, sortTypeSelect: that.sortTypeSelect, filterItem: that.filterItem, selectData: that.selectData, lang: that.params.lang }));

            target.find(".plantType input[type='checkbox']").bootstrapToggle({
                on: '開',
                off: '關',
                size: 'small'
            });

            target.find(".groupFlag input[type='checkbox']").bootstrapToggle({
                on: '要',
                off: '不要',
                size: 'small'
            });

            target.find(".resetBtn").bind("click", function() {
                target.trigger("submit");
                return false;
            });

            target.bind("submit", function(e) {
                e.preventDefault();
                that.selectData = $.extend({ plantType: [] }, $(this).serializeObject());

                var plantType = that.selectData.plantType;
                if (["", null, undefined].indexOf(plantType) >= 0) {
                    plantType = [];
                } else if (typeof(plantType) == "string") {
                    plantType = [plantType];
                }

                that.selectData.plantType = plantType;
                that.reset();
                that.$el.find(".filterBox").slideUp().empty();
                return false;
            });

            that.$el.find(".filterBox").html(target);

            that.$el.find(".filterBox").slideDown();
        },
        reset: function() {
            var that = this;

            that.params.powerInfo.comparator = function(model) {
                var value = 0;
                switch (that.selectData.sortType) {
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

            var powerPlant = that.params.powerPlant.getPowerPlantByNickName();

            var result = that.params.powerInfo.toJSON().filter(function(data) {
                var item = data;
                var plantTypeFlag = that.selectData.plantType.indexOf(item.type) >= 0 ? true : false;
                // console.log([plantTypeFlag]);
                //
                return plantTypeFlag;
            });

            var groupResult = {};
            var totalCapacity = 0;
            var totalUsed = 0;
            var totalLimit = 0;
            var totalFix = 0;
            _.each(result, function(result_one) {
                var groupKey = "";
                switch (that.selectData.groupType) {
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
                        if (["", null, undefined].indexOf(powerPlant[result_one.mappingName]) == -1) {
                            groupKey = powerPlant[result_one.mappingName].location;
                        } else {
                            groupKey = "尚未設定：" + result_one.mappingName;
                        }
                        break;
                }

                var icon = "";
                switch (result_one.type) {
                    case "coal":
                        icon = "icon-coal";
                        break;
                    case "nuclear":
                        icon = "icon-nuclear";
                        break;
                    case "co-gen":
                        icon = "icon-co_gen";
                        break;
                    case "lng":
                        icon = "icon-lng";
                        break;
                    case "oil":
                        icon = "icon-oil";
                        break;
                    case "diesel":
                        icon = "icon-diesel";
                        break;
                    case "hydro":
                        icon = "icon-hydro";
                        break;
                    case "wind":
                        icon = "icon-wind";
                        break;
                    case "pumping gen":
                        icon = "icon-pumping_gen";
                        break;
                    case "pumping load":
                        icon = "icon-pumping_load";
                        break;
                    case "solar":
                        icon = "icon-solar";
                        break;
                }

                result_one.fullName = "";
                if (["", null, undefined].indexOf(powerPlant[result_one.mappingName]) == -1) {
                    result_one.fullName = powerPlant[result_one.mappingName].fullName;
                }

                result_one.icon = icon;
                if (["", null, undefined].indexOf(groupResult[groupKey]) >= 0) {
                    groupResult[groupKey] = { used: 0, capacity: 0, fix: 0, limit: 0, info: [] };
                }

                switch (result_one.status) {
                    case "limit":
                        groupResult[groupKey].limit += result_one.capacity;
                        totalLimit += result_one.capacity;
                        break;
                    case "fix":
                        groupResult[groupKey].fix += result_one.capacity;
                        totalFix += result_one.capacity;
                        break;
                    default:
                        groupResult[groupKey].used += result_one.used;
                        groupResult[groupKey].capacity += result_one.capacity;
                        totalCapacity += result_one.capacity;
                        totalUsed += result_one.used;
                        break;
                }



                result_one.showNote = that.templates.PagerBoxNote({ lang: that.params.lang, result: result_one });
                result_one.showNote = that.escapeHtml(result_one.showNote);
                groupResult[groupKey].info.push(result_one);
            });

            this.$el.find(".pagerBox").html(that.templates.PagerBox({
                getTime: that.params.powerInfo.getTime,
                totalCapacity: totalCapacity,
                totalUsed: totalUsed,
                totalLimit: totalLimit,
                totalFix: totalFix,
                groupResult: groupResult
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

            this.$el.find(".pagerBox").find(".plantIntro").bind("click", function() {


                var plantInfo = powerPlant[$(this).parents(".plantBox").data("mappingname")];
                console.log(plantInfo);

                var plantInfoModal = $(that.templates.PlantInfoModal({ plantInfo: plantInfo, lang: that.params.lang }));
                plantInfoModal.bind("shown.bs.modal", function() {
                    that.$el.find(".pagerBox").find('[data-toggle="popover"]').popover("hide");
                    that.$el.find(".imgLiquidFill").imgLiquid();
                })
                plantInfoModal.bind("hidden.bs.modal", function() {
                    plantInfoModal.remove();
                });
                plantInfoModal.modal("show");


            });

            this.$el.find(".pagerBox .circle").trigger("circle:set");
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
        }
    });
    return FilterPower;
});