<template>
  <AppSidebar />

  <div class="d-flex justify-content-between align-items-center stripe">
    <span class="d-xxl-flex justify-content-xxl-start page-info-left">{{ title }}</span>
    <span class="unit-info-right">iNELS Heating</span>
  </div>

  <section class="text-center position-relative py-2 px-5 section-heading">
    <span class="second-title page-heading">{{ title }}</span>
  </section>

  <section class="service-template section-expand">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-10 col-lg-8">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import AppSidebar from "./AppSidebar.vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
