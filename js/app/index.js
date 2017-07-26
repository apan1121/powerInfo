//Load common code that includes config, then load the app logic for this page.
require([jsVars.baseResUrl + 'js/lib/common.js'], function(common) {
    require([
         'jquery',
        'underscore',
        'backbone',

        "i18n!nls/lang",

        'collection/powerInfoList',
        'collection/powerPlantList',

        'views/filterPower',


    ], function($, _, Backbone, lang, PowerInfo, PowerPlant, FilterPower) {

        $.fn.serializeObject = function()
        {
            var o = {};
            var a = this.serializeArray();
            $.each(a, function() {
                if (o[this.name] !== undefined) {
                    if (!o[this.name].push) {
                        o[this.name] = [o[this.name]];
                    }
                    o[this.name].push(this.value || '');
                } else {
                    o[this.name] = this.value || '';
                }
            });
            return o;
        };

        var powerInfo =  new PowerInfo();
        var powerPlant =  new PowerPlant();
        var index_app = Backbone.View.extend({
            el: 'body',
            params: {

            },
            templates: {
            },
            initialize: function(data) {
                var that = this;
                this.mixpanel = mixpanel;

                this.mixpanel.track("index");

                $.extend( that.params, data );

                that.filterPower = new FilterPower({app: that, powerPlant: powerPlant, powerInfo: powerInfo, lang: lang});
            },
        });

        new index_app();
    })
});
