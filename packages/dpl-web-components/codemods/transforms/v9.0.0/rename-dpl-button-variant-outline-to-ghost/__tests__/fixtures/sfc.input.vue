<template>
  <div class="container">
    <dpl-button variant="outline" label="Save" />
    <dpl-button :variant="isAdmin ? 'outline' : 'solid'" />
    <dpl-button variant="ghost" label="Already correct" />
    <some-other variant="outline" />
  </div>
</template>

<script setup lang="ts">
const isAdmin = true;
const fallback = 'outline';
</script>
