define([
    'jquery',
    'underscore',
    'backbone',

    "text!templates/filterPage.html",

    "bootstrap_toggle",
], function($, _, Backbone, FilterPage) {
    var FilterBox = Backbone.View.extend({
        el: 'body',
        params: {

        },
        templates: {
            FilterPage: _.template(FilterPage),
        },
        initialize: function(data) {
            var that = this;
            $.extend(this.params, data);
            that.initFlag = true;
            that.setAction();
            that.listenTo(that.params.powerInfo, "ajaxDone", that.setInfo);
        },
        setAction: function() {
            var that = this;
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

            that.plantTypeSelect = [];

            that.selectData = {
                groupType: "name",
                plantType: [],
                sortType: "sn"
            };

            that.$el.find(".filterBtn").bind("click", function() {
                if (that.$el.find(".filterBox form").length == 0) {
                    that.render();
                } else {
                    that.$el.find(".filterBox").slideUp(function() {
                        that.target.trigger("submit");
                        that.$el.find(".filterBox").empty();
                    });
                }
            });
        },
        render: function() {
            var that = this;
            var target = $(that.templates.FilterPage({ groupTypeSelect: that.groupTypeSelect, sortTypeSelect: that.sortTypeSelect, plantTypeSelect: that.plantTypeSelect, selectData: that.selectData, lang: that.params.lang }));


            target.find(".plantType input[type='checkbox']").bootstrapToggle({
                on: '開',
                off: '關',
                size: 'small'
            });

            /* 設定關閉後自動更新動作 */
            var submitFlag = false;
            target.find("input, select").bind("change", function() {
                submitFlag = true;
            });

            target.bind("submit", function(e) {
                e.preventDefault();
                if (!submitFlag) {
                    return false;
                }
                that.selectData = $.extend({ plantType: [] }, $(this).serializeObject());

                var plantType = that.selectData.plantType;
                if (["", null, undefined].indexOf(plantType) >= 0) {
                    plantType = [];
                } else if (typeof(plantType) == "string") {
                    plantType = [plantType];
                }
                that.selectData.plantType = plantType;
                that.params.app.mixpanel.track("search", that.selectData);
                that.trigger("renderPage");
            });

            that.target = target;

            that.$el.find(".filterBox").html(target);

            that.$el.find(".filterBox").slideDown();
        },
        setInfo: function() {
            var that = this;
            var powerInfo = that.params.powerInfo.toJSON();
            that.plantTypeSelect = {};
            powerInfo.map(function(item) {
                that.plantTypeSelect[item.type] = 1;
            });
            that.plantTypeSelect = Object.keys(that.plantTypeSelect);

            if (that.initFlag) {
                that.selectData.plantType = that.plantTypeSelect;
                that.trigger("renderPage");
            }

            that.initFlag = false;
        }
    });

    return FilterBox;
});