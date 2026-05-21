<template>
  <div class="container">
    <dpl-button variant="ghost" label="Save" />
    <dpl-button :variant="isAdmin ? 'ghost' : 'solid'" />
    <dpl-button variant="ghost" label="Already correct" />
    <some-other variant="outline" />
  </div>
</template>

<script setup lang="ts">
const isAdmin = true;
const fallback = 'outline';
</script>
