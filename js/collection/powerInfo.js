define([
    'jquery',
    'underscore',
    'backbone',
    'models/powerInfo',

], function($, _, Backbone, PowerInfo) {

    var PowerInfoList = Backbone.Collection.extend({
        model: PowerInfo,
        params: {

        },
        initialize: function(data) {
            var that = this;
            that.parms = $.extend(this.params, data);

            that.listenTo(that.params.powerPlantInfo, "loadPowerInfo", that.getData);

            // that.getData();
        },
        getData: function() {
            var that = this;
            var powerPlant = that.params.powerPlantInfo.getPowerPlantByNickName();
            $.get(that.parms.url, { time: new Date().getTime() }, function(data) {
                var powerInfoData = data.info.map(function(item, key) {
                    var matchPowerPlant = false;
                    for (var i = 0; i < item.mappingName.length; i++) {
                        if (["",null,undefined].indexOf(powerPlant[item.mappingName[i]]) == -1) {
                            matchPowerPlant = true;
                            break;
                        }
                    }
                    item.matchPowerPlant = matchPowerPlant;

                    if (isNaN(item.percent)) {
                        item.percent = 0;
                    } else {
                        item.percent = parseFloat(item.percent);
                    }
                    if (isNaN(item.capacity)) {
                        item.capacity = 0;
                    } else {
                        item.capacity = parseFloat(item.capacity);
                    }
                    if (isNaN(item.used)) {
                        item.used = 0;
                    } else {
                        item.used = parseFloat(item.used);
                    }
                    item.sn = key;
                    return item;
                });
                that.reset();
                that.add(powerInfoData);
                that.getTime = data.time;
                that.trigger("powerInfoDone");
            }, 'JSON');
        }
    });
    return PowerInfoList;
});