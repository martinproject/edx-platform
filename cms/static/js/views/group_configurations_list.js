/**
 * This class defines a list view for content experiment group configurations.
 * It is expected to be backed by a GroupConfiguration collection.
 */
define([
    'js/views/list', 'js/views/group_configuration_item', 'gettext'
], function(ListView, GroupConfigurationItemView, gettext) {
    'use strict';

    var GroupConfigurationsListView = ListView.extend({
        tagName: 'div',

        className: 'group-configurations-list',

        newModelOptions: {addDefaultGroups: true},

        emptyTemplateName: 'no-group-configurations',

        // Translators: this refers to a collection of groups.
        itemCategoryDisplayName: gettext('group configuration'),

        createItemView: function(options) {
            return new GroupConfigurationItemView(options);
        }
    });

    return GroupConfigurationsListView;
});
