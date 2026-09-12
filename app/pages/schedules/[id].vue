<template>
  <ScheduleForm :schedule-id="scheduleId" />
</template>

<script setup lang="ts">
const route = useRoute()
const scheduleId = route.params.id as string
</script>
