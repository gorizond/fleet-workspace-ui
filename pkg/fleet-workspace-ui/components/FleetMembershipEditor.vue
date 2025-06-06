<template>
  <div>
    <Loading v-if="loading" />
    <div v-else>
      <ArrayList
          v-model:value="members"
          :addAllowed="!disableEdit"
          :removeAllowed="!disableEdit"
          :show-header="true"
      >
        <template #column-headers>
          <div class="box mb-0">
            <div class="column-headers row">
              <div class="col span-4">
                <label class="text-label">{{ t('membershipEditor.user') }}</label>
              </div>
              <div class="col span-4">
                <label class="text-label">{{ t('membershipEditor.role') }}</label>
              </div>
              <div class="col span-4">
                <label class="text-label">Type</label>
              </div>
            </div>
          </div>
        </template>
        <template #columns="{ row, i }">
          <div class="columns row">
            <div class="col span-4">
              <Principal :value="row.value.principalId" />
            </div>
            <div class="col span-4 role">
              {{ row.value.role }}
            </div>
            <div class="col span-4 role">
              {{ row.value.type }}
            </div>
          </div>
        </template>
        <template #add>
          <button
              type="button"
              class="btn role-primary mt-10 "
              @click="openAddMemberDialog"
          >
            {{ t('generic.add') }}
          </button>
        </template>
        <template #remove-button="{ remove, i }">
          <button
              type="button"
              class="btn role-secondary mt-10"
              @click="removeMember(i)"
          >
            {{ t('generic.remove') }}
          </button>
        </template>
      </ArrayList>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ArrayList from '@shell/components/form/ArrayList';
import Principal from '@shell/components/auth/Principal';
import Loading from '@shell/components/Loading';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';

export default {
  components: {
    ArrayList,
    Principal,
    Loading,
    SelectPrincipal,
  },
  props: {
    value: Object,
  },
  data() {
    return {
      loading: true,
      members: [],
      workspace: Object,
      disableEdit: true,
      isAdmin: false,
    };
  },
  watch: {
    'workspace.metadata.annotations': {
      handler() {
        this.loadMembers();
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters(['currentCluster']),
  },
  async created() {
    const fleetWorkspaceId = this.$route.params.id;
    [this.workspace] = await Promise.all([ this.$store.dispatch('management/find', {
      type: 'management.cattle.io.fleetworkspace',
      id: fleetWorkspaceId,
    })]);
    if (!this.workspace) {
      throw new Error('Failed to fetch fleet workspace');
    }
    await this.loadMembers();
    this.checkAdminStatus();
    this.loading = false;
  },
  methods: {
    checkAdminStatus() {
      const labels = this.$store.getters['auth/v3User']?.labels;
      if (labels) {
        if (labels["authz.management.cattle.io/bootstrapping"] === "admin-user") {
          this.isAdmin = true;
          this.disableEdit = false;
        }
      }
    },
    async loadMembers() {
      const annotations = this.workspace?.metadata?.annotations || {};
      let disableEdit = true
      let list = []
      let tmpMembers = Object.entries(annotations)
          .filter(([key]) => key.startsWith('gorizond-user.'))
          .map(([key, value]) => {
            const parts = key.split('.');
            const userID = parts[1];
            const role = parts[2];
            if (userID === this.$store.getters['auth/v3User'].id && (role === 'admin' ||role === 'editor')) {
              disableEdit = false;
            }
            return {
              principalId: value,
              ID: userID,
              type: "user",
              role: role,
            };
          });
      let tmpGroups = Object.entries(annotations)
          .filter(([key]) => key.startsWith('gorizond-group.'))
          .map(([key, value]) => {
            const parts = key.split('.');
            const group = parts[1];
            const role = parts[2];
            return {
              principalId: value,
              ID: group,
              type: "group",
              role: role,
            };
          });
      if (this.isAdmin) {
        this.disableEdit = false;
      } else {
        this.disableEdit = disableEdit;
      }
      if (tmpMembers.length !== 0) {
        list = list.concat(tmpMembers);
      }
      if (tmpGroups.length !== 0) {
        list = list.concat(tmpGroups);
      }
      this.members = list
    },
    async openAddMemberDialog() {
      this.$store.dispatch('cluster/promptModal', {
        component: 'AddFleetMemberDialog',
        componentProps: {
          onAdd: this.addMember,
        },
        modalWidth: '600px',
        modalSticky: true,
      });
    },
    async addMember(principalId, role) {
      const principalIdSplit = principalId.split('://');
      let value = principalId;
      let key = `gorizond-user.${principalIdSplit[1]}.${role}`;
      if (principalIdSplit[0] !== 'local') {
        let random = Math.random().toString(36).substring(2) + Date.now();
        key = `gorizond-principal.${random}.${role}`;
        value = principalId;
      }
      const annotations = {
        ...this.workspace.metadata.annotations,
        [key]: value,
      };
      await this.updateAnnotations(annotations);
    },
    async removeMember(index) {
      const member = this.members[index];
      const key = `gorizond-${member.type}.${member.ID}.${member.role}`;
      const annotations = { ...this.workspace.metadata.annotations };
      delete annotations[key];
      await this.updateAnnotations(annotations);
    },
    async updateAnnotations(annotations) {
      let oldAnnotations = this.workspace.metadata.annotations
      try {
        this.workspace.metadata.annotations = annotations;
        await this.workspace.save();
      } catch (error) {
        this.$store.dispatch('growl/error', {
          title:   'Error',
          message: error.message,
        }, { root: true });
        this.workspace.metadata.annotations = oldAnnotations;
      }
    },
  },
};
</script>

<style scoped>
.role {
  display: flex;
  align-items: center;
  flex-direction: row;
}
</style>