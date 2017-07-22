define([
    'jquery',
    'underscore',
    'backbone',
    'models/powerPlant',

    'text!../../log/powerPlant.log'
], function( $, _, Backbone, PowerPlant,  PowerPlantData) {

    var powerPlantData = $.parseJSON(PowerPlantData);


    var PowerPlantList = Backbone.Collection.extend({
        model: PowerPlant,
        initialize: function (data) {
            this.add(powerPlantData);
        },
        getPowerPlantByNickName: function(){
            var powerPlant = {};
            this.toJSON().map(function(item){
                powerPlant[item.nickName] = item;
            });
            return powerPlant;
        }
    });
    return PowerPlantList;
});
