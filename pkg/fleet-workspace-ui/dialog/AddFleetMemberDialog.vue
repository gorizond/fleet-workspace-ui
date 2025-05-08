<script>
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { Card } from '@components/Card';
import { RadioGroup } from '@components/Form/Radio';

export default {
  components: { Card, RadioGroup, SelectPrincipal },
  props: {
    onAdd: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      selectedPrincipal: null,
      selectedRole: 'view',
      newValue: '',
      options: [
        {
          label:       this.t('fleet-workspace-ui.roles.admin.label'),
          description: this.t('fleet-workspace-ui.roles.admin.description'),
          value:       'admin'
        },
        {
          label:       this.t('fleet-workspace-ui.roles.editor.label'),
          description: this.t('fleet-workspace-ui.roles.editor.description'),
          value:       'editor'
        },
        {
          label:       this.t('fleet-workspace-ui.roles.view.label'),
          description: this.t('fleet-workspace-ui.roles.view.description'),
          value:       'view'
        }
      ]
    };
  },
  watch: {
    'newValue': {
      handler(a, b) {
        console.log(a, b);
      },
      deep: true,
    },
  },
  methods: {
    onSelectPrincipal(principalId) {
      this.selectedPrincipal = principalId;
    },
    confirm() {
      this.onAdd(this.selectedPrincipal, this.selectedRole);
      this.$emit('close');
    },
  },
};
</script>
<template>
  <Card
      class="m-0"
      :show-highlight-border="false"
      :show-actions="false"
  >
    <template v-slot:title>
      <div class="type-title">
        <h3>{{ t('fleet-workspace-ui.members.addMember') }}</h3>
      </div>
    </template>
    <template v-slot:body>
      <SelectPrincipal
          @add="onSelectPrincipal"
          :retain-selection="true"
      />
      <label>{{ t('fleet-workspace-ui.members.fleetPermissions.label') }}</label>
      <div class="type-description">
        {{ t('fleet-workspace-ui.members.fleetPermissions.description') }}
      </div>
      <RadioGroup
          v-model:value="selectedRole"
          :options="options"
          name="selected-role"
      />
      <button class="btn role-primary" @click="confirm" :disabled="!selectedPrincipal || !selectedRole">
        {{ t('generic.save') }}
      </button>
    </template>
  </Card>
</template>