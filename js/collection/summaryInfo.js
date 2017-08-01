define([
    'jquery',
    'underscore',
    'backbone',
    'models/powerPlant',

], function($, _, Backbone, PowerPlant) {

    var SummaryInfo = Backbone.Collection.extend({
        model: PowerPlant,
        params: {
            statusType: ["cap", "used", "fix", "break", "limit"],
        },
        initialize: function(data) {
            var that = this;
            that.parms = $.extend(this.params, data);

            that.listenTo(that.params.powerInfo, "powerInfoDone", that.getData);
        },
        getData: function() {
            var that = this;
            $.get(that.parms.url, { time: new Date().getTime() }, function(data) {
                var inputData = [];
                _.each(data, function(items, date){
                    _.each(items, function(item, type){
                        _.each(that.params.statusType, function(statusType){
                            item[statusType] = parseFloat(item[statusType]);
                        });

                        inputData.push($.extend(true,{date: date, type: type}, item));
                    });
                });

                that.reset();
                that.add(inputData);
                that.trigger("loadSummaryInfo");
            }, 'JSON');
        },
        getPowerPlantByNickName: function(){
            var that = this;
            var powerPlant = {};
            that.toJSON().map(function(item){
                powerPlant[item.nickName] = item;
            });
            return powerPlant;
        }
    });

    return SummaryInfo;
});