import StorageService from '@/services/storage.service';
import locales from '../common/locales';

export default {
    namespaced: true,
    state: {
        locale: 'en',
        locales: Object.keys(locales),
        username: null,
        allowControl: false,
    },
    mutations: {
        updateLocale(state, value) {
            state.locale = value;
        },
        updateUsername(state, value) {
            state.username = value;
        },
        updateAllowControl(state, value) {
            state.allowControl = value;
        }
    },
    actions: {
        load({ commit }) {
            const storedLocale = StorageService.get('locale');
            const storedUsername = StorageService.get('username');
            const storedAllowControl = StorageService.get('allowControl');
            if (storedLocale) commit('updateLocale', storedLocale);
            if (storedUsername) commit('updateUsername', storedUsername);
            if (storedAllowControl) commit('updateAllowControl', storedAllowControl);
        },
        updateLocale({ commit }, value) {
            commit('updateLocale', value);
            StorageService.set('locale', value);
        },
        updateUsername({ commit }, value) {
            commit('updateUsername', value);
            StorageService.set('username', value);
        },
        updateAllowControl({ commit }, value) {
            console.log(value)
            commit('updateAllowControl', value);
            StorageService.set('allowControl', value);
        }
    }
};
