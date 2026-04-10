<template>
  <ul
    class="nav nav-pills flex-column shadow d-flex sidebar"
    :class="{ collapsed: collapsed, 'mobile-hid': mobileHidden }"
  >
    <li class="nav-item logo-holder logo-color">
      <div class="logo py-4 mx-4">
        <img src="@/assets/img/logo-inels.svg" style="max-width: 60%; margin-top: -19px; margin-bottom: -11px" />
        <span class="fs-5 fw-bold text-dark logo" v-show="!collapsed && !mobileHidden" style="padding-right: 30px"></span>
        <a class="float-end text-dark" href="#" @click.prevent="toggle">
          <img src="@/assets/img/menu-icon-black.svg" />
        </a>
      </div>
    </li>

    <li class="nav-item">
      <RouterLink class="nav-link text-start py-1 px-0 text-color" to="/rooms">
        <img class="navbar-icon" src="@/assets/img/overview-icon-active.svg" />
        <span class="text-nowrap mx-2">Rooms</span>
      </RouterLink>
    </li>
    <li class="nav-item">
      <RouterLink class="nav-link text-start py-1 px-0 text-color" to="/devices">
        <img class="navbar-icon" src="@/assets/img/settings-icon-inactive.svg" />
        <span class="text-nowrap mx-2">Devices</span>
      </RouterLink>
    </li>
    <li class="nav-item">
      <RouterLink class="nav-link text-start py-1 px-0 text-color" to="/temp-plans">
        <img class="navbar-icon" src="@/assets/img/settings-icon-inactive.svg" />
        <span class="text-nowrap mx-2">Temperature plans</span>
      </RouterLink>
    </li>
    <li class="nav-item">
      <RouterLink class="nav-link text-start py-1 px-0 text-color" to="/accounts">
        <img class="navbar-icon" src="@/assets/img/settings-icon-inactive.svg" />
        <span class="text-nowrap mx-2">App accounts</span>
      </RouterLink>
    </li>
  </ul>
</template>

<script setup>
import { ref } from "vue";

const collapsed = ref(false);
const mobileHidden = ref(window.innerWidth < 992);

function toggle() {
  if (window.innerWidth < 992) {
    mobileHidden.value = !mobileHidden.value;
  } else {
    collapsed.value = !collapsed.value;
  }
}
</script>
