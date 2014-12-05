;(function (define, undefined) {
'use strict';
define(['gettext', 'underscore', 'backbone', 'js/edxnotes/utils/template'],
function (gettext, _, Backbone, templateUtils) {
    var TabItemView = Backbone.View.extend({
        tagName: 'li',
        className: 'tab',
        activeClassName: 'is-active',

        events: {
            'click': 'selectHandler',
            'click a': function (event) { event.preventDefault(); },
            'click .btn-close': 'closeHandler'
        },

        initialize: function (options) {
            this.template = templateUtils.loadTemplate('tab-item');
            this.$el.attr('id', this.model.get('identifier'));
            this.listenTo(this.model, {
                'change:is_active': function (model, value) {
                    this.$el.toggleClass(this.activeClassName, value);
                },
                'destroy': this.remove
            });
        },

        render: function () {
            var html = this.template(this.model.toJSON());
            this.$el.html(html);
            return this;
        },

        selectHandler: function (event) {
            event.preventDefault();
            if (!this.model.isActive()) {
                this.model.activate();
            }
        },

        closeHandler: function (event) {
            event.preventDefault();
            event.stopPropagation();
            this.model.destroy();
        }
    });

    return TabItemView;
});
}).call(this, define || RequireJS.define);
