define([
    'js/views/list_item_edit', 'underscore', 'jquery', 'gettext',
    'js/views/group_edit', 'js/views/utils/view_utils'
],
function(ListItemEdit, _, $, gettext, GroupEdit, ViewUtils) {
    'use strict';
    var GroupConfigurationEdit = ListItemEdit.extend({
        tagName: 'div',
        events: {
            'change .group-configuration-name-input': 'setName',
            'change .group-configuration-description-input': 'setDescription',
            'click .action-add-group': 'createGroup',
            'focus .input-text': 'onFocus',
            'blur .input-text': 'onBlur',
            'submit': 'setAndClose',
            'click .action-cancel': 'cancel'
        },

        className: function () {
            var index = this.model.collection.indexOf(this.model);

            return [
                'group-configuration-edit',
                'group-configuration-edit-' + index
            ].join(' ');
        },

        initialize: function() {
            var groups = this.model.get('groups');

            ListItemEdit.prototype.initialize.call(this);

            this.template = this.loadTemplate('group-configuration-edit');
            this.listenTo(groups, 'add', this.addOne);
            this.listenTo(groups, 'reset', this.addAll);
            this.listenTo(groups, 'all', this.render);
        },

        render: function() {
            ListItemEdit.prototype.render.call(this);
            this.addAll();
            return this;
        },

        getTemplateOptions: function() {
            return {
                id: this.model.get('id'),
                uniqueId: _.uniqueId(),
                name: this.model.escape('name'),
                description: this.model.escape('description'),
                usage: this.model.get('usage'),
                isNew: this.model.isNew()
            };
        },

        getSaveableModel: function() {
            return this.model;
        },

        addOne: function(group) {
            var view = new GroupEdit({ model: group });
            this.$('ol.groups').append(view.render().el);

            return this;
        },

        addAll: function() {
            this.model.get('groups').each(this.addOne, this);
        },

        createGroup: function(event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            var collection = this.model.get('groups');
            collection.add([{
                name: collection.getNextDefaultGroupName(),
                order: collection.nextOrder()
            }]);
        },

        setName: function(event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            this.model.set(
                'name', this.$('.group-configuration-name-input').val(),
                { silent: true }
            );
        },

        setDescription: function(event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            this.model.set(
                'description',
                this.$('.group-configuration-description-input').val(),
                { silent: true }
            );
        },

        setValues: function() {
            this.setName();
            this.setDescription();

            _.each(this.$('.groups li'), function(li, i) {
                var group = this.model.get('groups').at(i);

                if (group) {
                    group.set({
                        'name': $('.group-name', li).val()
                    });
                }
            }, this);

            return this;
        }
    });

    return GroupConfigurationEdit;
});
