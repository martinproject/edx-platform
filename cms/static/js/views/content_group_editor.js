/**
 * This class defines an editing view for content groups.
 * It is expected to be backed by a Group model.
 */
define([
    'js/views/list_item_editor', 'underscore'
],
function(ListItemEditor, _) {
    'use strict';

    var ContentGroupEditorView = ListItemEditor.extend({
        tagName: 'div',
        className: 'group-configuration-edit',
        events: {
            'submit': 'setAndClose',
            'click .action-cancel': 'cancel'
        },

        initialize: function() {
            ListItemEditor.prototype.initialize.call(this);
            this.template = this.loadTemplate('content-group-editor');
        },

        getTemplateOptions: function() {
            return {
                name: this.model.escape('name'),
                index: this.model.collection.indexOf(this.model),
                isNew: this.model.isNew(),
                uniqueId: _.uniqueId()
            };
        },

        setValues: function() {
            this.model.set({name: this.$('input').val().trim()});
            return this;
        },

        getSaveableModel: function() {
            return this.model.collection.parents[0];
        }
    });

    return ContentGroupEditorView;
});
