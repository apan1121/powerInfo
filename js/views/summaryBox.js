define([
    'jquery',
    'underscore',
    'backbone',

], function($, _, Backbone) {
    var SummaryBox = Backbone.View.extend({
        el: 'body',
        params: {
            statusType: ["cap", "used", "fix", "break", "limit"],
        },
        initialize: function(data) {
            var that = this;
            $.extend(this.params, data);

            that.listenTo(that.params.summaryInfo, "loadSummaryInfo", that.setData);
            that.listenTo(that.params.filterBox, "renderPage", that.setData);

            // that.setAction();
        },
        setData: function() {
            var that = this;
            var selectData = that.params.filterBox.selectData;

            var summaryInfo = {};
            _.each(that.params.statusType, function(statusType) {
                summaryInfo[statusType] = {};
            });

            var chartType = {};
            that.params.summaryInfo.comparator = function(model){
                return that.params.app.Moment(model.get("date")).format("x");
            };
            that.params.summaryInfo.sort();

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
                        if ( ["",null,undefined].indexOf(summaryInfo[statusType][item.date]) >= 0) {
                            summaryInfo[statusType][item.date] = item[statusType];
                        } else {
                            summaryInfo[statusType][item.date] += item[statusType];
                        }
                    });
                }
            });
            console.log(summaryInfo);
            console.log(chartType);
        }
    });
    return SummaryBox;
});