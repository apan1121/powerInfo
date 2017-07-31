//Load common code that includes config, then load the app logic for this page.
require([jsVars.baseResUrl + 'js/lib/common.js'], function(common) {
    require([
        'jquery',
        'underscore',
        'backbone',

        "i18n!nls/lang",

        'collection/powerPlantInfo',
        'collection/powerInfo',

        'views/filterBox',
        'views/pagerBox'


    ], function($, _, Backbone, lang, PowerPlantInfo, PowerInfo, FilterBox, PagerBox) {

        $.fn.serializeObject = function() {
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

        var index_app = Backbone.View.extend({
            el: 'body',
            params: {

            },
            templates: {},
            initialize: function(data) {
                var that = this;

                that.mixpanel = mixpanel;
                that.mixpanel.track("index");

                var powerPlantInfo = new PowerPlantInfo({
                    app: that,
                    url: jsVars.baseUrl + "log/powerPlant.log"
                });
                var powerInfo = new PowerInfo({
                    app: that,
                    url: jsVars.baseUrl + "log/powerInfo.log",
                    powerPlantInfo: powerPlantInfo,
                });

                var filterBox = new FilterBox({
                    app: that,
                    powerInfo: powerInfo,
                    lang: lang
                });
                var pagerBox = new PagerBox({
                    app: that,
                    powerInfo: powerInfo,
                    powerPlantInfo: powerPlantInfo,
                    filterBox: filterBox,
                    lang: lang
                });
            }
        });

        new index_app();



    })
});