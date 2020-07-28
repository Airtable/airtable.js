<template>
  <div>
    <main>
      <h1 class="title">
        Design Projects by
        <a href="https://airtable.com">Airtable!</a>
      </h1>
      <div class="grid col-3">
        <div v-for="(project, index) of projects" :key="`project-${index}`" class="card">
          <h4>{{ project.fields['Name'] }}</h4>
          <img
            class="image"
            v-if="project.fields['Project images']"
            :src="project.fields['Project images'][0].url"
            alt
          />
        </div>
      </div>
    </main>

    <footer>
      <a href="https://nuxtjs.org/" target="_blank" rel="noopener noreferrer">
        Powered by
        <img src="https://nuxtjs.org/logos/nuxtjs-typo.svg" alt="Nuxt Logo" class="logo" />
      </a>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      projects: [],
    }
  },
  async fetch() {
    this.projects = await fetch('http://localhost:3000/api/projects').then((res) => res.json())
  },
}
</script>

<style>
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell,
    Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

* {
  box-sizing: border-box;
}

.container {
  min-height: 100vh;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

main {
  padding: 5rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

footer {
  width: 100%;
  height: 100px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: center;
  align-items: center;
}

footer img {
  margin-left: 0.5rem;
}

footer a {
  display: flex;
  justify-content: center;
  align-items: center;
}

a {
  color: inherit;
  text-decoration: none;
}

.title a {
  color: #0070f3;
  text-decoration: none;
}

.title a:hover,
.title a:focus,
.title a:active {
  text-decoration: underline;
}

.title {
  margin: 0;
  line-height: 1.15;
  font-size: 4rem;
}

.title,
.description {
  text-align: center;
}

.description {
  line-height: 1.5;
  font-size: 1.5rem;
}

code {
  background: #fafafa;
  border-radius: 5px;
  padding: 0.75rem;
  font-size: 1.1rem;
  font-family: Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono,
    Bitstream Vera Sans Mono, Courier New, monospace;
}

.grid {
  display: grid;

  max-width: 900px;
  margin-top: 3rem;
}

.col-3 {
  grid-template-columns: repeat(3, 1fr);
}

.card {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin: 1rem;
  flex-basis: 45%;
  padding: 1.5rem;
  text-align: left;
  color: inherit;
  text-decoration: none;
  border: 1px solid #eaeaea;
  border-radius: 10px;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.card:hover,
.card:focus,
.card:active {
  color: #0070f3;
  border-color: #0070f3;
}

.card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.card p {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
}

.image {
  width: 150px;
  height: 100px;
  object-fit: cover;
  object-position: center;
  border-radius: 3px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.logo {
  height: 1em;
}
</style>
