/**
 * This class defines a list view for content groups.
 * It is expected to be backed by a Group collection.
 */
define([
    'js/views/list', 'js/views/content_group_item', 'gettext'
], function(ListView, ContentGroupItemView, gettext) {
    'use strict';

    var ContentGroupListView = ListView.extend({
        tagName: 'div',

        className: 'group-configurations-list',

        emptyTemplateName: 'no-content-groups',

        // Translators: This refers to a content group that can be linked to a student cohort.
        itemCategoryDisplayName: gettext('content group'),

        createItemView: function(options) {
            return new ContentGroupItemView(options);
        }
    });

    return ContentGroupListView;
});
