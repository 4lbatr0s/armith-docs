import DefaultTheme from 'vitepress/theme';
import RestApiPlayground from './RestApiPlayground.vue';
import './armith-neo-brutalist.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('RestApiPlayground', RestApiPlayground);
  }
};
