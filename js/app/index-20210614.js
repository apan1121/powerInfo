//Load common code that includes config, then load the app logic for this page.
require([jsVars.baseResUrl + 'js/lib/common.js'], function(common) {
    require([
        'jquery',
        'underscore',
        'backbone',
        'moment',

        "i18n!nls/lang",

        'collection/powerPlantInfo',
        'collection/powerInfo',
        'collection/summaryInfo',

        'views/filterBox',
        'views/pagerBox',
        'views/summaryBox',


    ], function($, _, Backbone, Moment, lang, PowerPlantInfo, PowerInfo, SummaryInfo, FilterBox, PagerBox, SummaryBox) {
        Moment.locale('zh-tw');
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
                that.Moment = Moment;
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

                var summaryInfo = new SummaryInfo({
                    app: that,
                    url: jsVars.baseUrl + "log/summary.log",
                    powerInfo: powerInfo,
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

                var summaryBox = new SummaryBox({
                    app: that,
                    powerInfo: powerInfo,
                    summaryInfo: summaryInfo,
                    filterBox: filterBox,
                    lang: lang,
                });

                that.$el.find("[data-toggle='tab']").on("shown.bs.tab", function(e){
                    that.mixpanel.track("tab", {"target":$(this).attr("aria-controls")});
                });


                $('#DownTimeNotice').on('shown.bs.modal', function (){
                    var options = {
                        threshold: 0,
                        rootMargin: "30px 30px 30px 30px",
                      };

                    var callback = function(entries){
                        for (var i in entries) {
                            console.log(entries[i]);
                            if (entries[i].isIntersecting) {
                                $('#V2Link').fadeIn();
                            }
                        }
                    };
                    var observer = new IntersectionObserver(callback, options);
                    const target = document.querySelector('#V2Detect');
                    observer.observe(target);

                });

                $('#DownTimeNotice').modal('show');
            }
        });

        new index_app();



    })
});