define([
    'jquery',
    'underscore',
    'backbone',
], function( $, _, Backbone ) {
    var PowerInfo = Backbone.Model.extend({
        idAttribute: 'sn',
        // id: 'tour_key',
        defaults: {
        },
        initialize: function () {
        }
    });

    return PowerInfo;
});
