<script setup>
import {  ref, onMounted } from "vue";
import { RouterLink, RouterView } from 'vue-router'
import GoogleCalendarQuickstart from "@/components/GoogleQuickstart.vue";

const accessToken = ref("");

</script>

<template>
    <GoogleCalendarQuickstart />

</template>


<style scoped>

</style>
