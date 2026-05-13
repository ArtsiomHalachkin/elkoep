<template>
  <nav class="sidebar" :class="{ collapsed, 'mobile-hid': mobileHidden }">
    <div class="sidebar-logo nav-item logo-holder">
      <span v-show="!collapsed && !mobileHidden" class="sidebar-logo-text">iNELS</span>
      <button class="sidebar-toggle" @click="toggle" aria-label="Toggle sidebar">
        <i class="pi pi-bars"></i>
      </button>
    </div>
    <div class="sidebar-nav">
      <div class="nav-item">
        <RouterLink class="nav-link" to="/rooms">
          <i class="pi pi-home"></i>
          <span v-show="!collapsed && !mobileHidden">Rooms</span>
        </RouterLink>
      </div>
      <div class="nav-item">
        <RouterLink class="nav-link" to="/devices">
          <i class="pi pi-server"></i>
          <span v-show="!collapsed && !mobileHidden">Devices</span>
        </RouterLink>
      </div>
      <div class="nav-item">
        <RouterLink class="nav-link" to="/temp-plans">
          <i class="pi pi-calendar"></i>
          <span v-show="!collapsed && !mobileHidden">Temperature plans</span>
        </RouterLink>
      </div>
      <div class="nav-item">
        <RouterLink class="nav-link" to="/accounts">
          <i class="pi pi-users"></i>
          <span v-show="!collapsed && !mobileHidden">App accounts</span>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";
const collapsed    = ref(false);
const mobileHidden = ref(window.innerWidth < 992);
function toggle() {
  if (window.innerWidth < 992) mobileHidden.value = !mobileHidden.value;
  else collapsed.value = !collapsed.value;
}
</script>
