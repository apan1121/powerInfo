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
                var dateStorage = {};
                _.each(data, function(items, date){
                    _.each(items, function(item, type){
                        _.each(that.params.statusType, function(statusType){
                            item[statusType] = parseFloat(item[statusType]);
                        });

                        var formate_date = that.params.app.Moment(date).format("MM/DD HH:mm");
                        var timestamp = that.params.app.Moment(date).format("x")
                        dateStorage[timestamp] = 1;
                        inputData.push($.extend(true,{date: formate_date, timestamp: timestamp, type: type}, item));
                    });
                });

                dateStorage = Object.keys(dateStorage).map(function(item){
                    return parseInt(item);
                });
                that.startTime = _.min(dateStorage);
                that.endTime = _.max(dateStorage);

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