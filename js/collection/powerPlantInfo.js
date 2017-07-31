define([
    'jquery',
    'underscore',
    'backbone',
    'models/powerPlant',

], function($, _, Backbone, PowerPlant) {

    var PowerPlantList = Backbone.Collection.extend({
        model: PowerPlant,
        params: {},
        initialize: function(data) {
            var that = this;
            that.parms = $.extend(this.params, data);

            that.getData();
        },
        getData: function() {
            var that = this;
            $.get(that.parms.url, { time: new Date().getTime() }, function(data) {
                that.reset();
                that.add(data);
                that.trigger("loadPowerInfo");
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

    return PowerPlantList;
});