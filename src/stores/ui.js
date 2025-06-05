// stores/ui.js
import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isMobile: false,
  }),
  actions: {
    setMobileState(val) {
      this.isMobile = val;
    },
  },
});
