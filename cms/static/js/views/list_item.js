/**
 * A generic view to represent an editable item in a list.  The item
 * has a edit view and a details view.
 *
 * Children Must implement:
 * - itemDisplayName (string): Display name for the list item.
 * - createEditView (function): Render and append the edit view to the
 *   DOM.
 * - createDetailsView (function): Render and append the details view
 *   to the DOM.
 */
define([
    'js/views/baseview', 'jquery', "gettext", "js/views/utils/view_utils"
], function(
    BaseView, $, gettext, ViewUtils
) {
    'use strict';

    var ListItem = BaseView.extend({
        canDelete: false,

        initialize: function() {
            this.listenTo(this.model, 'change:editing', this.render);
            this.listenTo(this.model, 'remove', this.remove);
        },

        deleteItem: function(event) {
            if (event && event.preventDefault) { event.preventDefault(); }
            if (!this.canDelete) { return; }
            var model = this.model,
                itemDisplayName = this.itemDisplayName;
            ViewUtils.confirmThenRunOperation(
                interpolate(
                    // Translators: "item_display_name" is the name of the item to be deleted.
                    gettext('Delete this %(item_display_name)s?'),
                    {item_display_name: itemDisplayName}, true
                ),
                interpolate(
                    // Translators: "item_display_name" is the name of the item to be deleted.
                    gettext('Deleting this %(item_display_name)s is permanent and cannot be undone.'),
                    {item_display_name: itemDisplayName},
                    true
                ),
                gettext('Delete'),
                function() {
                    return ViewUtils.runOperationShowingMessage(
                        gettext('Deleting') + '&hellip;',
                        function () {
                            return model.destroy({wait: true});
                        }
                    );
                }
            );
        },

        render: function() {
            // Removes a view from the DOM, and calls stopListening to remove
            // any bound events that the view has listened to.
            if (this.view) {
                this.view.remove();
            }

            if (this.model.get('editing')) {
                this.view = this.createEditView();
            } else {
                this.view = this.createDetailsView();
            }

            this.$el.html(this.view.render().el);

            return this;
        }
    });

    return ListItem;
});
