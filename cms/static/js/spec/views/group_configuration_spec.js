define([
    'underscore', 'js/models/course', 'js/models/group_configuration', 'js/models/group',
    'js/collections/group_configuration', 'js/collections/group',
    'js/views/group_configuration_details', 'js/views/group_configurations_list', 'js/views/group_configuration_editor',
    'js/views/group_configuration_item', 'js/views/group_edit', 'js/views/content_group_list',
    'js/views/feedback_notification', 'js/common_helpers/ajax_helpers', 'js/common_helpers/template_helpers',
    'js/spec_helpers/view_helpers', 'jasmine-stealth'
], function(
    _, Course, GroupConfigurationModel, GroupModel, GroupConfigurationCollection, GroupCollection,
    GroupConfigurationDetailsView, GroupConfigurationsListView, GroupConfigurationEditorView, GroupConfigurationItemView, GroupEditView,
    GroupList, Notification, AjaxHelpers, TemplateHelpers, ViewHelpers
) {
    'use strict';
    var SELECTORS = {
        detailsView: '.group-configuration-details',
        editView: '.group-configuration-edit',
        itemView: '.group-configurations-list-item',
        group: '.group',
        groupFields: '.groups-fields',
        name: '.group-configuration-name',
        description: '.group-configuration-description',
        groupsCount: '.group-configuration-groups-count',
        groupsAllocation: '.group-allocation',
        errorMessage: '.group-configuration-edit-error',
        inputGroupName: '.group-name',
        inputName: '.group-configuration-name-input',
        inputDescription: '.group-configuration-description-input',
        usageCount: '.group-configuration-usage-count',
        usage: '.group-configuration-usage',
        usageText: '.group-configuration-usage-text',
        usageTextAnchor: '.group-configuration-usage-text > a',
        usageUnit: '.group-configuration-usage-unit',
        usageUnitAnchor: '.group-configuration-usage-unit a',
        usageUnitMessage: '.group-configuration-validation-message',
        usageUnitWarningIcon: '.group-configuration-usage-unit i.fa-warning',
        usageUnitErrorIcon: '.group-configuration-usage-unit i.fa-exclamation-circle',
        warningMessage: '.group-configuration-validation-text',
        warningIcon: '.wrapper-group-configuration-validation > i',
        note: '.wrapper-delete-button'
    };

    beforeEach(function() {
        window.course = new Course({
            id: '5',
            name: 'Course Name',
            url_name: 'course_name',
            org: 'course_org',
            num: 'course_num',
            revision: 'course_rev'
        });

        this.addMatchers({
            toContainText: function(text) {
                var trimmedText = $.trim(this.actual.text());

                if (text && $.isFunction(text.test)) {
                    return text.test(trimmedText);
                } else {
                    return trimmedText.indexOf(text) !== -1;
                }
            },
            toBeCorrectValuesInInputs: function (values) {
                var expected = {
                    name: this.actual.$(SELECTORS.inputName).val(),
                    description: this.actual
                        .$(SELECTORS.inputDescription).val()
                };

                return _.isEqual(values, expected);
            },
            toBeCorrectValuesInModel: function (values) {
                return _.every(values, function (value, key) {
                    return this.actual.get(key) === value;
                }.bind(this));
            },
            toHaveDefaultNames: function (values) {
                var actualValues = $.map(this.actual, function (item) {
                    return $(item).val();
                });

                return _.isEqual(actualValues, values);
            }
        });
    });

    afterEach(function() {
        delete window.course;
    });

    describe('GroupConfigurationDetailsView', function() {
        beforeEach(function() {
            TemplateHelpers.installTemplate('group-configuration-details', true);

            this.model = new GroupConfigurationModel({
                name: 'Configuration',
                description: 'Configuration Description',
                id: 0
            });

            this.collection = new GroupConfigurationCollection([ this.model ]);
            this.collection.outlineUrl = '/outline';
            this.view = new GroupConfigurationDetailsView({
                model: this.model
            });
            appendSetFixtures(this.view.render().el);
        });

        it('should render properly', function() {
            expect(this.view.$el).toContainText('Configuration');
            expect(this.view.$el).toContainText('ID: 0');
            expect(this.view.$('.delete')).toExist();
        });

        it('should show groups appropriately', function() {
            this.model.get('groups').add([{}]);
            this.model.set('showGroups', false);
            this.view.$('.show-groups').click();

            expect(this.model.get('showGroups')).toBeTruthy();
            expect(this.view.$(SELECTORS.group).length).toBe(3);
            expect(this.view.$(SELECTORS.groupsCount)).not.toExist();
            expect(this.view.$(SELECTORS.description))
                .toContainText('Configuration Description');
            expect(this.view.$(SELECTORS.groupsAllocation))
                .toContainText('33%');
        });

        it('should hide groups appropriately', function() {
            this.model.get('groups').add([{}]);
            this.model.set('showGroups', true);
            this.view.$('.hide-groups').click();

            expect(this.model.get('showGroups')).toBeFalsy();
            expect(this.view.$(SELECTORS.group)).not.toExist();
            expect(this.view.$(SELECTORS.groupsCount))
                .toContainText('Contains 3 groups');
            expect(this.view.$(SELECTORS.description)).not.toExist();
            expect(this.view.$(SELECTORS.groupsAllocation)).not.toExist();
        });

        it('should show empty usage appropriately', function() {
            this.model.set('showGroups', false);
            this.view.$('.show-groups').click();

            expect(this.view.$(SELECTORS.usageCount)).not.toExist();
            expect(this.view.$(SELECTORS.usageText))
                .toContainText('This Group Configuration is not in use. ' +
                               'Start by adding a content experiment to any ' +
                               'Unit via the');
            expect(this.view.$(SELECTORS.usageTextAnchor)).toExist();
            expect(this.view.$(SELECTORS.usageUnit)).not.toExist();
        });

        it('should hide empty usage appropriately', function() {
            this.model.set('showGroups', true);
            this.view.$('.hide-groups').click();

            expect(this.view.$(SELECTORS.usageText)).not.toExist();
            expect(this.view.$(SELECTORS.usageUnit)).not.toExist();
            expect(this.view.$(SELECTORS.usageCount))
                .toContainText('Not in Use');
        });

        it('should show non-empty usage appropriately', function() {
            var usageUnitAnchors;

            this.model.set('usage', [
                {'label': 'label1', 'url': 'url1'},
                {'label': 'label2', 'url': 'url2'}
            ]);
            this.model.set('showGroups', false);
            this.view.$('.show-groups').click();

            usageUnitAnchors = this.view.$(SELECTORS.usageUnitAnchor);

            expect(this.view.$(SELECTORS.note)).toHaveAttr(
                'data-tooltip', 'Cannot delete when in use by an experiment'
            );
            expect(this.view.$('.delete')).toHaveClass('is-disabled');
            expect(this.view.$(SELECTORS.usageCount)).not.toExist();
            expect(this.view.$(SELECTORS.usageText))
                .toContainText('This Group Configuration is used in:');
            expect(this.view.$(SELECTORS.usageUnit).length).toBe(2);
            expect(usageUnitAnchors.length).toBe(2);
            expect(usageUnitAnchors.eq(0)).toContainText('label1');
            expect(usageUnitAnchors.eq(0).attr('href')).toBe('url1');
            expect(usageUnitAnchors.eq(1)).toContainText('label2');
            expect(usageUnitAnchors.eq(1).attr('href')).toBe('url2');
        });

        it('should hide non-empty usage appropriately', function() {
            this.model.set('usage', [
                {'label': 'label1', 'url': 'url1'},
                {'label': 'label2', 'url': 'url2'}
            ]);
            this.model.set('showGroups', true);
            this.view.$('.hide-groups').click();

            expect(this.view.$(SELECTORS.note)).toHaveAttr(
                'data-tooltip', 'Cannot delete when in use by an experiment'
            );
            expect(this.view.$('.delete')).toHaveClass('is-disabled');
            expect(this.view.$(SELECTORS.usageText)).not.toExist();
            expect(this.view.$(SELECTORS.usageUnit)).not.toExist();
            expect(this.view.$(SELECTORS.usageCount))
                .toContainText('Used in 2 units');
        });

        it('should show validation warning icon and message appropriately', function() {
            this.model.set('usage', [
                {
                    'label': 'label1',
                    'url': 'url1',
                    'validation': {
                        'text': "Warning message",
                        'type': 'warning'
                    }
                }
            ]);
            this.model.set('showGroups', false);
            this.view.$('.show-groups').click();

            expect(this.view.$(SELECTORS.usageUnitMessage)).toContainText('Warning message');
            expect(this.view.$(SELECTORS.usageUnitWarningIcon)).toExist();
        });

        it('should show validation error icon and message appropriately', function() {
            this.model.set('usage', [
                {
                    'label': 'label1',
                    'url': 'url1',
                    'validation': {
                        'text': "Error message",
                        'type': 'error'
                    }
                }
            ]);
            this.model.set('showGroups', false);
            this.view.$('.show-groups').click();

            expect(this.view.$(SELECTORS.usageUnitMessage)).toContainText('Error message');
            expect(this.view.$(SELECTORS.usageUnitErrorIcon)).toExist();
        });

        it('should hide validation icons and messages appropriately', function() {
            this.model.set('usage', [
                {'label': 'label1', 'url': 'url1'},
                {'label': 'label2', 'url': 'url2'}
            ]);
            this.model.set('showGroups', true);
            this.view.$('.hide-groups').click();

            expect(this.view.$(SELECTORS.usageUnitMessage)).not.toExist();
            expect(this.view.$(SELECTORS.usageUnitWarningIcon)).not.toExist();
            expect(this.view.$(SELECTORS.usageUnitErrorIcon)).not.toExist();
        });
    });

    describe('GroupConfigurationEditorView', function() {

        var setValuesToInputs = function (view, values) {
            _.each(values, function (value, selector) {
                if (SELECTORS[selector]) {
                    view.$(SELECTORS[selector]).val(value);
                }
            });
        };

        beforeEach(function() {
            ViewHelpers.installViewTemplates();
            TemplateHelpers.installTemplates([
                'group-configuration-editor', 'group-edit'
            ]);

            this.model = new GroupConfigurationModel({
                name: 'Configuration',
                description: 'Configuration Description',
                id: 0,
                editing: true
            });
            this.collection = new GroupConfigurationCollection([this.model]);
            this.collection.url = '/group_configurations';
            this.view = new GroupConfigurationEditorView({
                model: this.model
            });
            appendSetFixtures(this.view.render().el);
        });

        it('should render properly', function() {
            expect(this.view).toBeCorrectValuesInInputs({
                name: 'Configuration',
                description: 'Configuration Description'
            });
            expect(this.view.$('.delete')).toExist();
        });

        it ('should allow you to create new groups', function() {
            var numGroups = this.model.get('groups').length;
            this.view.$('.action-add-group').click();
            expect(this.model.get('groups').length).toEqual(numGroups + 1);
        });

        it('should save properly', function() {
            var requests = AjaxHelpers.requests(this),
                notificationSpy = ViewHelpers.createNotificationSpy(),
                groups;

            this.view.$('.action-add-group').click();
            setValuesToInputs(this.view, {
                inputName: 'New Configuration',
                inputDescription: 'New Description'
            });

            this.view.$('form').submit();
            ViewHelpers.verifyNotificationShowing(notificationSpy, /Saving/);
            requests[0].respond(200);
            ViewHelpers.verifyNotificationHidden(notificationSpy);

            expect(this.model).toBeCorrectValuesInModel({
                name: 'New Configuration',
                description: 'New Description'
            });

            groups = this.model.get('groups');
            expect(groups.length).toBe(3);
            expect(groups.at(2).get('name')).toBe('Group C');
            expect(this.view.$el).not.toExist();
        });

        it('does not hide saving message if failure', function() {
            var requests = AjaxHelpers.requests(this),
                notificationSpy = ViewHelpers.createNotificationSpy();

            setValuesToInputs(this.view, { inputName: 'New Configuration' });
            this.view.$('form').submit();
            ViewHelpers.verifyNotificationShowing(notificationSpy, /Saving/);
            AjaxHelpers.respondWithError(requests);
            ViewHelpers.verifyNotificationShowing(notificationSpy, /Saving/);
        });

        it('does not save on cancel', function() {
            this.view.$('.action-add-group').click();
            setValuesToInputs(this.view, {
                inputName: 'New Configuration',
                inputDescription: 'New Description'
            });

            expect(this.model.get('groups').length).toBe(3);

            this.view.$('.action-cancel').click();
            expect(this.model).toBeCorrectValuesInModel({
                name: 'Configuration',
                description: 'Configuration Description'
            });
            // Model is still exist in the collection
            expect(this.collection.indexOf(this.model)).toBeGreaterThan(-1);
            expect(this.collection.length).toBe(1);
            expect(this.model.get('groups').length).toBe(2);
        });

        it('should be removed on cancel if it is a new item', function() {
            spyOn(this.model, 'isNew').andReturn(true);
            setValuesToInputs(this.view, {
                inputName: 'New Configuration',
                inputDescription: 'New Description'
            });
            this.view.$('.action-cancel').click();
            // Model is removed from the collection
            expect(this.collection.length).toBe(0);
        });

        it('should be possible to correct validation errors', function() {
            var requests = AjaxHelpers.requests(this);

            // Set incorrect value
            setValuesToInputs(this.view, { inputName: '' });
            // Try to save
            this.view.$('form').submit();
            // See error message
            expect(this.view.$(SELECTORS.errorMessage)).toContainText(
                'Group Configuration name is required.'
            );
            // No request
            expect(requests.length).toBe(0);
            // Set correct value
            setValuesToInputs(this.view, { inputName: 'New Configuration' });
            // Try to save
            this.view.$('form').submit();
            requests[0].respond(200);
            // Model is updated
            expect(this.model).toBeCorrectValuesInModel({
                name: 'New Configuration'
            });
            // Error message disappear
            expect(this.view.$(SELECTORS.errorMessage)).not.toExist();
            expect(requests.length).toBe(1);
        });

        it('should have appropriate class names on focus/blur', function () {
            var groupInput = this.view.$(SELECTORS.inputGroupName).first(),
                groupFields = this.view.$(SELECTORS.groupFields);

            groupInput.focus();
            expect(groupFields).toHaveClass('is-focused');
            groupInput.blur();
            expect(groupFields).not.toHaveClass('is-focused');
        });

        describe('removes all newly created groups on cancel', function () {
            it('if the model has a non-empty groups', function() {
                var groups = this.model.get('groups');

                this.view.render();
                groups.add([{ name: 'non-empty' }]);
                expect(groups.length).toEqual(3);
                this.view.$('.action-cancel').click();
                // Restore to default state (2 groups by default).
                expect(groups.length).toEqual(2);
            });

            it('if the model has no non-empty groups', function() {
                var groups = this.model.get('groups');

                this.view.render();
                groups.add([{}, {}, {}]);
                expect(groups.length).toEqual(5);
                this.view.$('.action-cancel').click();
                // Restore to default state (2 groups by default).
                expect(groups.length).toEqual(2);
            });
        });

        it('groups have correct default names', function () {
            var group1 = new GroupModel({ name: 'Group A' }),
                group2 = new GroupModel({ name: 'Group B' }),
                collection = this.model.get('groups');

            collection.reset([group1, group2]); // Group A, Group B
            this.view.$('.action-add-group').click(); // Add Group C
            this.view.$('.action-add-group').click(); // Add Group D
            this.view.$('.action-add-group').click(); // Add Group E

            expect(this.view.$(SELECTORS.inputGroupName)).toHaveDefaultNames([
                'Group A', 'Group B', 'Group C', 'Group D', 'Group E'
            ]);

            // Remove Group B
            this.view.$('.group-1 .action-close').click();

            expect(this.view.$(SELECTORS.inputGroupName)).toHaveDefaultNames([
                'Group A', 'Group C', 'Group D', 'Group E'
            ]);

            this.view.$('.action-add-group').click(); // Add Group F
            this.view.$('.action-add-group').click(); // Add Group G

            expect(this.view.$(SELECTORS.inputGroupName)).toHaveDefaultNames([
                'Group A', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G'
            ]);
        });

        it('cannot be deleted if it is in use', function () {
            this.model.set('usage', [ {'label': 'label1', 'url': 'url1'} ]);
            this.view.render();
            expect(this.view.$(SELECTORS.note)).toHaveAttr(
                'data-tooltip', 'Cannot delete when in use by an experiment'
            );
            expect(this.view.$('.delete')).toHaveClass('is-disabled');
        });

        it('contains warning message if it is in use', function () {
            this.model.set('usage', [ {'label': 'label1', 'url': 'url1'} ]);
            this.view.render();
            expect(this.view.$(SELECTORS.warningMessage)).toContainText(
                'This configuration is currently used in content ' +
                'experiments. If you make changes to the groups, you may ' +
                'need to edit those experiments.'
            );
            expect(this.view.$(SELECTORS.warningIcon)).toExist();
        });

        it('does not contain warning message if it is not in use', function () {
            this.model.set('usage', []);
            this.view.render();
            expect(this.view.$(SELECTORS.warningMessage)).not.toExist();
            expect(this.view.$(SELECTORS.warningIcon)).not.toExist();
        });
    });

    describe('GroupConfigurationsListView', function() {
        var emptyMessage = 'You have not created any group configurations yet.';

        beforeEach(function() {
            TemplateHelpers.installTemplates(
                ['add-list-item', 'no-group-configurations', 'group-configuration-editor', 'group-edit']
            );

            this.model = new GroupConfigurationModel({ id: 0 });
            this.collection = new GroupConfigurationCollection();
            this.view = new GroupConfigurationsListView({
                collection: this.collection
            });
            appendSetFixtures(this.view.render().el);
        });

        describe('empty template', function () {
            it('should be rendered if no group configurations', function() {
                expect(this.view.$el).toContainText(emptyMessage);
                expect(this.view.$('.new-button')).toExist();
                expect(this.view.$(SELECTORS.itemView)).not.toExist();
            });

            it('should disappear if group configuration is added', function() {
                expect(this.view.$el).toContainText(emptyMessage);
                expect(this.view.$(SELECTORS.itemView)).not.toExist();
                this.collection.add(this.model);
                expect(this.view.$el).not.toContainText(emptyMessage);
                expect(this.view.$(SELECTORS.itemView)).toExist();
            });

            it('should appear if configurations were removed', function() {
                this.collection.add(this.model);
                expect(this.view.$(SELECTORS.itemView)).toExist();
                this.collection.remove(this.model);
                expect(this.view.$el).toContainText(emptyMessage);
                expect(this.view.$(SELECTORS.itemView)).not.toExist();
            });

            it('can create a new group configuration', function () {
                this.view.$('.new-button').click();
                expect($('.group-configuration-edit').length).toBeGreaterThan(0);
            });
        });
    });

    describe('GroupConfigurationItemView', function() {
        var clickDeleteItem;

        beforeEach(function() {
            TemplateHelpers.installTemplates([
                'group-configuration-editor', 'group-configuration-details'
            ], true);
            this.model = new GroupConfigurationModel({ id: 0 });
            this.collection = new GroupConfigurationCollection([ this.model ]);
            this.collection.url = '/group_configurations';
            this.view = new GroupConfigurationItemView({
                model: this.model
            });
            appendSetFixtures(this.view.render().el);
        });

        clickDeleteItem = function (view, promptSpy) {
            view.$('.delete').click();
            ViewHelpers.verifyPromptShowing(promptSpy, /Delete this Group Configuration/);
            ViewHelpers.confirmPrompt(promptSpy);
            ViewHelpers.verifyPromptHidden(promptSpy);
        };

        it('should render properly', function() {
            // Details view by default
            expect(this.view.$(SELECTORS.detailsView)).toExist();
            this.view.$('.action-edit .edit').click();
            expect(this.view.$(SELECTORS.editView)).toExist();
            expect(this.view.$(SELECTORS.detailsView)).not.toExist();
            this.view.$('.action-cancel').click();
            expect(this.view.$(SELECTORS.detailsView)).toExist();
            expect(this.view.$(SELECTORS.editView)).not.toExist();
        });

        it('should destroy itself on confirmation of deleting', function () {
            var requests = AjaxHelpers.requests(this),
                promptSpy = ViewHelpers.createPromptSpy(),
                notificationSpy = ViewHelpers.createNotificationSpy();

            clickDeleteItem(this.view, promptSpy);
            // Backbone.emulateHTTP is enabled in our system, so setting this
            // option  will fake PUT, PATCH and DELETE requests with a HTTP POST,
            // setting the X-HTTP-Method-Override header with the true method.
            AjaxHelpers.expectJsonRequest(requests, 'POST', '/group_configurations/0');
            expect(_.last(requests).requestHeaders['X-HTTP-Method-Override']).toBe('DELETE');
            ViewHelpers.verifyNotificationShowing(notificationSpy, /Deleting/);
            AjaxHelpers.respondToDelete(requests);
            ViewHelpers.verifyNotificationHidden(notificationSpy);
            expect($(SELECTORS.itemView)).not.toExist();
        });

        it('does not hide deleting message if failure', function() {
            var requests = AjaxHelpers.requests(this),
                promptSpy = ViewHelpers.createPromptSpy(),
                notificationSpy = ViewHelpers.createNotificationSpy();

            clickDeleteItem(this.view, promptSpy);
            // Backbone.emulateHTTP is enabled in our system, so setting this
            // option  will fake PUT, PATCH and DELETE requests with a HTTP POST,
            // setting the X-HTTP-Method-Override header with the true method.
            AjaxHelpers.expectJsonRequest(requests, 'POST', '/group_configurations/0');
            expect(_.last(requests).requestHeaders['X-HTTP-Method-Override']).toBe('DELETE');
            ViewHelpers.verifyNotificationShowing(notificationSpy, /Deleting/);
            AjaxHelpers.respondWithError(requests);
            ViewHelpers.verifyNotificationShowing(notificationSpy, /Deleting/);
            expect($(SELECTORS.itemView)).toExist();
        });
    });

    describe('GroupEditView', function() {
        beforeEach(function() {
            TemplateHelpers.installTemplate('group-edit', true);

            this.model = new GroupModel({
                name: 'Group A'
            });

            this.collection = new GroupCollection([this.model]);

            this.view = new GroupEditView({
                model: this.model
            });
        });

        describe('Basic', function () {
            it('can render properly', function() {
                this.view.render();
                expect(this.view.$('.group-name').val()).toBe('Group A');
                expect(this.view.$('.group-allocation')).toContainText('100%');
            });

            it ('can delete itself', function() {
                this.view.render().$('.action-close').click();
                expect(this.collection.length).toEqual(0);
            });
        });
    });

    describe('ContentGroupListView', function() {
        var newGroupCss = '.new-button',
            addGroupCss = '.action-add',
            inputCss = '.group-configuration-name-input',
            saveButtonCss = '.action-primary',
            cancelButtonCss = '.action-cancel',
            validationErrorCss = '.group-configuration-edit-error',
            createGroups, renderView, editNewGroup, verifyEditingGroup, respondToSave, expectGroupsVisible;

        createGroups = function (groupNames) {
            var groups = new GroupCollection(_.map(groupNames, function (groupName) {
                    return {name: groupName};
                })),
                groupConfiguration = new GroupConfigurationModel({
                    id: 0,
                    name: 'Group Configuration',
                    groups: groups
                });
            groupConfiguration.urlRoot = '/mock_url';
            return groups;
        };

        renderView = function(groupNames) {
            var view = new GroupList({collection: createGroups(groupNames || [])}).render();
            appendSetFixtures(view.el);
            return view;
        };

        editNewGroup = function(view, groupName) {
            if (view.collection.length === 0) {
                view.$(newGroupCss).click();
            } else {
                view.$(addGroupCss).click();
            }
            view.$(inputCss).val(groupName);
            verifyEditingGroup(view, true);
        };

        verifyEditingGroup = function(view, expectEditing) {
            // Should prevent the user from opening more than one edit
            // form at a time by removing the add button(s) when
            // editing a group.
            if (expectEditing) {
                expect(view.$('.group-configuration-edit')).toExist();
                expect(view.$(newGroupCss)).not.toExist();
                expect(view.$(addGroupCss)).not.toExist();
            } else {
                expect(view.$('.group-configuration-edit')).not.toExist();
                if (view.collection.length === 0) {
                    expect(view.$(newGroupCss)).toExist();
                    expect(view.$(addGroupCss)).not.toExist();
                } else {
                    expect(view.$(newGroupCss)).not.toExist();
                    expect(view.$(addGroupCss)).toExist();
                }
            }
        };

        respondToSave = function(requests, view) {
            expect(requests.length).toBe(1);
            expect(requests[0].method).toBe('POST');
            expect(requests[0].url).toBe('/mock_url/0');
            AjaxHelpers.respondWithJson(requests, {
                name: 'Group Configuration',
                groups: view.collection.map(function(groupModel, index) {
                    return _.extend(groupModel.toJSON(), {id: index});
                })
            });
        };

        expectGroupsVisible = function(view, groupNames) {
            _.each(groupNames, function(groupName) {
                expect(view.$('.group-configurations-list-item')).toContainText(groupName);
            });
        };

        beforeEach(function() {
            TemplateHelpers.installTemplates(
                ['add-list-item', 'no-content-groups', 'content-group-editor', 'content-group-details']
            );
        });

        it('shows a message when no groups are present', function() {
            expect(renderView().$('.no-group-configurations-content')).toExist();
        });

        it('can render groups', function() {
            var groupNames = ['Group 1', 'Group 2', 'Group 3'];
            renderView(groupNames).$('.group-configuration-details').each(function(index) {
                expect($(this)).toContainText(groupNames[index]);
            });
        });

        it('can create an initial group and save', function() {
            var requests = AjaxHelpers.requests(this),
                newGroupName = 'New Group Name',
                view = renderView();
            editNewGroup(view, newGroupName);
            view.$(saveButtonCss).click();
            respondToSave(requests, view);
            verifyEditingGroup(view, false);
            expectGroupsVisible(view, [newGroupName]);
        });

        it('can add another group and save', function() {
            var requests = AjaxHelpers.requests(this),
                oldGroupName = 'Old Group Name',
                newGroupName = 'New Group Name',
                view = renderView([oldGroupName]);
            editNewGroup(view, newGroupName);
            view.$(saveButtonCss).click();
            respondToSave(requests, view);
            verifyEditingGroup(view, false);
            expectGroupsVisible(view, [oldGroupName, newGroupName]);
        });

        it('can cancel adding a group', function() {
            var requests = AjaxHelpers.requests(this),
                newGroupName = 'New Group Name',
                view = renderView();
            editNewGroup(view, newGroupName);
            view.$(cancelButtonCss).click();
            expect(requests.length).toBe(0);
            verifyEditingGroup(view, false);
            expect(view.$()).not.toContainText(newGroupName);
        });

        it('can cancel editing a group', function() {
            var requests = AjaxHelpers.requests(this),
                originalGroupName = 'Original Group Name',
                view = renderView([originalGroupName]);
            view.$('.edit').click();
            view.$(inputCss).val('New Group Name');
            view.$(cancelButtonCss).click();
            verifyEditingGroup(view, false);
            expect(requests.length).toBe(0);
            expect(view.collection.at(0).get('name')).toBe(originalGroupName);
        });

        it('can show and correct a validation error', function() {
            var requests = AjaxHelpers.requests(this),
                newGroupName = 'New Group Name',
                view = renderView();
            editNewGroup(view, '');
            view.$(saveButtonCss).click();
            expect(requests.length).toBe(0);
            expect(view.$(validationErrorCss)).toExist();
            verifyEditingGroup(view, true);
            view.$(inputCss).val(newGroupName);
            view.$(saveButtonCss).click();
            respondToSave(requests, view);
            expect(view.$(validationErrorCss)).not.toExist();
        });

        it('trims whitespace', function() {
            var requests = AjaxHelpers.requests(this),
                newGroupName = 'New Group Name',
                view = renderView();
            editNewGroup(view, '  ' + newGroupName + '  ');
            view.$(saveButtonCss).click();
            respondToSave(requests, view);
            expect(view.collection.at(0).get('name')).toBe(newGroupName);
        });

        it('only edits one form at a time', function() {
            var view = renderView();
            view.collection.add({name: 'Editing Group', editing: true});
            verifyEditingGroup(view, true);
        });
    });
});
