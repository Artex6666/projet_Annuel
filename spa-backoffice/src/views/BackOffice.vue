<template>
    <div class="back-office">
      <!-- Menu latéral -->
      <SidebarMenu :currentPage="currentPage" @change-page="changePage" />
  
      <main class="main-content">
        <component :is="currentComponent" />
      </main>
    </div>
  </template>
  
  <script>
  import SidebarMenu from "@/components/SidebarMenu.vue"
  import Dashboard from "@/views/DashboardView.vue"
  import UserManagement from "@/components/UserManagement.vue"
  
  export default {
    name: "BackOffice",
    components: {
      SidebarMenu,
      Dashboard,
      UserManagement
    },
    data() {
      return {
        currentPage: "dashboard" 
      }
    },
    computed: {
      currentComponent() {
        switch (this.currentPage) {
          case "dashboard":
            return Dashboard
          case "utilisateurs":
            return UserManagement
          default:
            return Dashboard
        }
      }
    },
    methods: {
      changePage(page) {
        this.currentPage = page
      }
    }
  }
  </script>
  
  <style scoped>
  .back-office {
    display: flex;
  }
  
  .main-content {
    margin-left: 240px;
    padding: 20px;
    width: calc(100% - 240px);
    min-height: 100vh;
    background-color: #f4f6f8;
  }
  </style>
  