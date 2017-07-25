define([
    'jquery',
    'underscore',
    'backbone',
    'models/powerInfo',

    'text!../../log/powerInfo.log'
], function( $, _, Backbone, PowerInfo, PowerInfoData) {

    var powerInfoDataLog = $.parseJSON(PowerInfoData);
    var time = powerInfoDataLog.time;
    var powerInfoData = powerInfoDataLog.info;
    var PowerInfoList = Backbone.Collection.extend({
        model: PowerInfo,
        initialize: function (data) {
            powerInfoData = powerInfoData.map(function(item, key){
                if (isNaN(item.percent)){
                    item.percent = 0;
                } else {
                    item.percent = parseFloat(item.percent);
                }
                if (isNaN(item.capacity)){
                    item.capacity = 0;
                } else {
                    item.capacity = parseFloat(item.capacity);
                }
                if (isNaN(item.used)){
                    item.used = 0;
                } else {
                    item.used = parseFloat(item.used);
                }

                item.sn = key;
                return item;
            });
            this.add(powerInfoData);
            this.getTime = time;
        },
    });
    return PowerInfoList;
});
