//The build will inline common dependencies into this file.

//For any third party dependencies, like jQuery, place them in the lib folder.

//Configure loading modules from the lib directory,
//except for 'app' ones, which are in a sibling
//directory.
requirejs.config({
    baseUrl: jsVars.baseResUrl+'js',
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    shim: {
        underscore: {
            exports: '_'
        },
        underscore_string: {
            deps: [
                'underscore',
            ],
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        backbone_validation: {
            deps: [
                'backbone',
            ],
        },

        bootstrap: {
            deps: [
                'jquery',
            ]
        },

        bootstrap_toggle: {
            deps: [
                'bootstrap'
            ]
        },

        bootstrap_datepicker:{
            deps: [
                'bootstrap'
            ]
        },

        bootstrap_select:{
            deps: [
                'bootstrap'
            ]
        },

        adminLTE: {
            deps: [
                'bootstrap',
            ],
        },

        dataTable: {
            deps: [
                'jquery'
            ]
        },


        jquery_multipleSelect: {
            deps: [
                'jquery'
            ]
        },

        bootstrap_toggle: {
            deps: [
                'jquery',
                'bootstrap',
            ]
        },

        jquery_circle_progress: {
            deps: [
                'jquery',
            ]
        },
        jquery_imgLiquid: {
            deps: [
                'jquery',
            ]
        }
    },
    urlArgs: "ver="+jsVars.version,
    paths: {
        /* 絕對必要預載 */
        jquery: CDN.jquery,
        underscore: CDN.underscore,
        underscore_string: CDN.underscore_string,
        backbone: CDN.backbone,
        backbone_validation: CDN.backbone_validation,

        i18n: CDN.i18n,
        text: CDN.text,
        async: CDN.async,

        /* adminLTE 一定要用 */
        bootstrap: CDN.bootstrap,

        moment: CDN.moment,

        bootstrap_toggle: CDN.bootstrap_toggle,

        jquery_circle_progress: CDN.jquery_circle_progress,
        jquery_imgLiquid: CDN.jquery_imgLiquid,

        chartjs: CDN.chartjs,
    }
});

