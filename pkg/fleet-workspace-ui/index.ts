import {importTypes} from '@rancher/auto-import';
import {IPlugin, TabLocation} from '@shell/core/types';

// Init the package
export default function (plugin: IPlugin): void {
    // Auto-import model, detail, edit from the folders
    importTypes(plugin);

    // Provide plugin metadata from package.json
    plugin.metadata = require('./package.json');

    // Load a product
    // plugin.addProduct(require('./product'));
    plugin.addTab(
        TabLocation.RESOURCE_DETAIL,
        {resource: ['management.cattle.io.fleetworkspace']},
        {
            name: 'users',
            labelKey: 'fleet-workspace-ui.manageUsers',
            label: 'manage-users',
            weight: -2,
            showHeader: true,
            component: () => import('./components/FleetMembershipEditor.vue')
        }
    );
}
