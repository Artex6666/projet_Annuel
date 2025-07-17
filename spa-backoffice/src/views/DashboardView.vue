<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="chart-area">
      <p>Représentation du nombre de ventes sur les 7 derniers jours</p>
      <canvas id="myChart"></canvas>
    </div>

    <div class="stats">
      <div class="stat">
        <h3>{{ stats.clients }}</h3>
        <p>Clients</p>
      </div>
      <div class="stat">
        <h3>{{ stats.prestataires }}</h3>
        <p>Prestataires</p>
      </div>
      <div class="stat">
        <h3>{{ stats.livreurs }}</h3>
        <p>Livreurs</p>
      </div>
      <div class="stat">
        <h3>{{ stats.colisLivres }}</h3>
        <p>Colis finalisés (24h)</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "DashboardView",
  data() {
    return {
      stats: {
        clients: 0,
        prestataires: 0,
        livreurs: 0,
        colisLivres: 0
      }
    }
  },
  async mounted() {
    try {
      const res = await axios.get('https://api.axia.quest/api/stats');
      this.stats = res.data;


      //ptet mettre un chart à terme ici
    } catch (error) {
      console.error('Erreur lors de la récupération des stats :', error);
    }
  }
}
</script>

<style scoped>
.dashboard {
  width: 100%;
}
.chart-area {
  background: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
}
.stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.stat {
  background: #fff;
  flex: 1 1 200px;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
}
</style>
