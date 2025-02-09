<template>
    <div id="subtitles-control">
        <span @click="activePanel = !activePanel">
            <ion-icon name="chatbox-ellipses-outline" v-show="!activePanel"></ion-icon>
            <ion-icon name="chatbox-ellipses" v-show="activePanel"></ion-icon>
        </span>

        <transition name="fade">
            <div class="panel" v-if="activePanel">
                <div class="bar">
                    <div class="toggle" @click="subtitles.active = !subtitles.active">
                        <div v-show="subtitles.active" class="status">
                            <ion-icon name="toggle"></ion-icon> On
                        </div>
                        <div v-show="!subtitles.active" class="status">
                            <ion-icon name="toggle-outline" class="flip"></ion-icon> Off
                        </div>
                    </div>

                    <List class="sizes" small v-model="subtitles.size" :items="sizes">
                        <template #left>
                            <ion-icon name="text-outline"></ion-icon>
                        </template>
                    </List>
                </div>

                <div class="loading" v-if="!langs.length">
                    <ion-icon name="sync-outline" class="spin"></ion-icon>
                </div>
                
                <div class="lists">
                    <List class="langs" small v-model="panelLang" :items="langs" itemKey="iso">
                        <template #left="{ item }">
                            {{ item.local }}
                        </template>
                    </List>
                    <List class="subs" small v-model="subtitles.current" :items="filterSubs()" itemKey="id">
                        <template #left="{ index }">
                            {{ `${$t(`components.player.subtitle`)} ${ index + 1 }` }}
                        </template>
                    </List>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { where } from 'langs';
import { mapGetters } from 'vuex';
import List from '@/components/ui/List.vue';
import StremioService from '@/services/stremio.service';
import AddonService from '@/services/addon.service';

export default {
    name: 'SubtitlesControl',
    components: {
        List
    },
    props: {
        videoUrl: String,
        meta: Object,
        userSubtitle: File
    },
    computed: {
        sizes() {
            return [
                'small',
                'medium',
                'large'
            ];
        },
        ...mapGetters(['installedSubtitles', 'subtitles'])
    },
    data() {
        return {
            activePanel: false,
            panelLang: null,
            list: [],
            localeLang: (this.$i18n && this.$i18n.locale) || 'en',
            langs: []
        };
    },
    watch: {
        list() {
            this.langs = this.extractLangs(this.list);

            const isCurrentUser = this.panelLang && this.panelLang.iso === 'user';
            const current = this.list.find(s => isCurrentUser ? s.lang === 'user' : s.lang.startsWith(this.localeLang)) || this.list[0];

            this.panelLang = this.langs.find(({ iso }) => iso === current.lang);
            this.$store.dispatch('updateCurrent', current);
        },
        'subtitles.active'(state) {
            this.$store.dispatch('updateActive', state);
        },
        'subtitles.current'(state) {
            this.$store.dispatch('updateCurrent', state);
        },
        'subtitles.size'(state) {
            this.$store.dispatch('updateSize', state);
        },
        userSubtitle(file) {
            const reader = new FileReader();
            reader.readAsText(file, 'ASCII');
            reader.addEventListener('load', () => {
                const userIndex = this.list.filter(({ lang }) => lang === 'user').length;

                const subtitle = {
                    id: `user-${userIndex}`,
                    lang: 'user',
                    data: reader.result
                };

                this.list = [
                    subtitle,
                    ...this.list
                ];
            });
        },
        installedSubtitles() {
            this.fetchSubtitles();
        }
    },
    methods: {
        fetchSubtitles() {
            const addToList = subtitles => {
                this.list.push(...subtitles);

                const urls = [...new Set(this.list.map(({ url }) => url))];
                this.list = urls.map(url => this.list.find(sub => sub.url === url));
            };

            StremioService.getSubtitles(this.videoUrl).then(stremioSubtitles => addToList(stremioSubtitles));
            this.installedSubtitles.map(addon => AddonService.getSubtitles([addon], this.meta.type, this.meta.id).then(addonsSubtitles => addToList(addonsSubtitles)));
        },
        filterSubs() {
            return this.panelLang ? this.list.filter(s => s.lang === this.panelLang.iso) : [];
        },
        extractLangs(list) {
            return list
                    .map(({ lang }) => lang)
                    .filter((el, i, self) => i == self.indexOf(el))
                    .map(lang => {
                        const iso2 = where('2', lang);
                        const iso2B = where('2B', lang);
                        return {
                            iso: lang,
                            local: lang === 'user' ? 'User' : (iso2 ? iso2.local : iso2B ? iso2B.local : lang)
                        }
                    })
                    .sort();
        }
    },
    mounted() {
        this.$store.dispatch('updateSize', this.sizes[1]);
        this.fetchSubtitles();
    }
}
</script>

<style lang="scss">
#subtitles-control {
    .panel {
        $panel-height: 250px;
        $panel-width: 320px;

        position: absolute;
        height: $panel-height;
        width: $panel-width;
        top: calc(-#{$panel-height} - 15px);
        right: -2.5vw;
        border-radius: 10px;
        font-size: 15px;
        overflow: hidden;
        background-color: rgba($primary-color, 0.8);
        backdrop-filter: blur(10px);
        cursor: default;

        $bar-height: 65px;

        .bar {
            height: $bar-height;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-left: 10px;
            padding-right: 20px;
            font-size: 20px;

            .toggle {
                height: 100%;
                display: grid;
                align-items: center;
                padding: 0 10px;
                cursor: pointer;

                .status {
                    display: flex;
                    align-items: center;

                    ion-icon {
                        margin-right: 10px;
                    }
                }
            }

            .sizes {
                display: flex;
                flex-direction: row;

                .item {
                    font-size: 20px;
                    --ionicon-stroke-width: 40px;

                    &:first-child {
                        font-size: 13px;
                        --ionicon-stroke-width: 20px;
                    }

                    &:last-child {
                        font-size: 25px;
                        --ionicon-stroke-width: 60px;
                    }
                }
            }
        }

        .loading {
            top: 0;
            position: absolute;
            height: 100%;
            width: 100%;
            display: grid;
            place-items: center;
            font-size: 30px;
        }

        .lists {
            display: flex;
            justify-content: space-between;
            padding: 0 5px;

            .list {
                height: calc(#{$panel-height} - #{$bar-height});
                width: 50%;
                padding: 0 10px;
                padding-bottom: 10px;

                &:first-child .item div:last-child {
                    font-family: 'Montserrat-SemiBold' !important;
                }
            }
        }
    }
}
</style>