<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <h2>EcoDeli Admin</h2>
    </div>
    <ul class="sidebar-menu">
      <li :class="{ active: currentPage === 'dashboard' }" @click="$emit('change-page', 'dashboard')">
        <i class="fas fa-home"></i>
        <span>Dashboard</span>
      </li>
      <li :class="{ active: currentPage === 'utilisateurs' }" @click="$emit('change-page', 'utilisateurs')">
        <i class="fas fa-user"></i>
        <span>Utilisateurs</span>
      </li>
      <li>
        <i class="fas fa-calendar-alt"></i>
        <span>Annonces & Réservations</span>
      </li>
      <li>
        <i class="fas fa-credit-card"></i>
        <span>Facturation & Paiement</span>
      </li>
      <li>
        <i class="fas fa-box"></i>
        <span>Stockage & Box</span>
      </li>
      <li>
        <i class="fas fa-headset"></i>
        <span>Support</span>
      </li>
    </ul>
  </aside>
</template>

<script>
export default {
  name: "SidebarMenu",
  props: {
    currentPage: {
      type: String,
      default: "dashboard"
    }
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;         
  background-color: #2c3e50;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid rgba(236, 240, 241, 0.2);
}
.sidebar-brand h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}


.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1; 
}

.sidebar-menu li {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}
.sidebar-menu li:hover {
  background-color: #34495e;
}
.sidebar-menu li.active {
  background-color: #34495e;
}

.sidebar-menu li i {
  margin-right: 10px;
}
.sidebar-menu li span {
  font-size: 1rem;
}
</style>
