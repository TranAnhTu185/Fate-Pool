<script setup>
import {CURRENCY} from "@/const.js";
import {useI18n} from "vue-i18n";
import number_utils from "@/tools/number_utils.js";

const props = defineProps({
  pot: {
    type: Object,
    required: true
  }
});

const {t} = useI18n();

</script>

<template>
  <div class="pot-box circle">
    <div>
      <span class="pot-tag">{{ t("pot_pool") }}: {{ number_utils.formatNumberEx(props.pot.pool) }}</span>
    </div>

    <div>
      <p class="mb-0">{{ t("pot_total") }}</p>
      <h4>{{ number_utils.formatNumberExFloatV2(props.pot.total) }} {{ CURRENCY }}</h4>
    </div>

    <div>
      <p class="mb-0">{{ t("pot_total_tickets") }}</p>
      <div>
          <span class="pot-tag">
            {{ number_utils.formatNumberEx(props.pot.tickets) }}
            <svg style=" margin-bottom: -2px; " width="16" height="15" viewBox="0 0 16 15" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_6103_1465)">
                <path
                    d="M3.20483 3C2.37749 3 1.70483 3.67266 1.70483 4.5V6C1.70483 6.20625 1.87827 6.36797 2.0728 6.43594C2.51343 6.58828 2.82983 7.00781 2.82983 7.5C2.82983 7.99219 2.51343 8.41172 2.0728 8.56406C1.87827 8.63203 1.70483 8.79375 1.70483 9V10.5C1.70483 11.3273 2.37749 12 3.20483 12H13.7048C14.5322 12 15.2048 11.3273 15.2048 10.5V9C15.2048 8.79375 15.0314 8.63203 14.8369 8.56406C14.3962 8.41172 14.0798 7.99219 14.0798 7.5C14.0798 7.00781 14.3962 6.58828 14.8369 6.43594C15.0314 6.36797 15.2048 6.20625 15.2048 6V4.5C15.2048 3.67266 14.5322 3 13.7048 3H3.20483ZM4.70483 5.625V9.375C4.70483 9.58125 4.87358 9.75 5.07983 9.75H11.8298C12.0361 9.75 12.2048 9.58125 12.2048 9.375V5.625C12.2048 5.41875 12.0361 5.25 11.8298 5.25H5.07983C4.87358 5.25 4.70483 5.41875 4.70483 5.625ZM3.95483 5.25C3.95483 4.83516 4.28999 4.5 4.70483 4.5H12.2048C12.6197 4.5 12.9548 4.83516 12.9548 5.25V9.75C12.9548 10.1648 12.6197 10.5 12.2048 10.5H4.70483C4.28999 10.5 3.95483 10.1648 3.95483 9.75V5.25Z"
                    fill="#001F30"/>
              </g>
              <defs>
                <clipPath id="clip0_6103_1465">
                  <rect width="15" height="15" fill="white" transform="translate(0.954834)"/>
                </clipPath>
              </defs>
            </svg>

          </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
@import "@/quasar-variables.sass"

.pot-box
  width: 80vw
  height: 80vw
  border-radius: 50%
  margin: 15px auto
  background-image: url("/images/pot-bg.png")
  background-size: contain
  text-align: center
  display: flex
  flex-direction: column
  color: $buttonTextPrimary
  justify-content: space-around
  position: relative

  i
    line-height: 9px

.pot-tag
  padding: 4px 12px
  border-radius: 20px
  color: $backgroundSecondary
  //background: $textUp
  background-color: #F883AF

</style>

<style lang="sass">
@import "@/quasar-variables.sass"


@keyframes waveRotate
  0%
    transform: rotate(0deg) scale(1.02)
    opacity: 0.8

  50%
    transform: rotate(180deg) scale(1.04)
    opacity: 0.3

  100%
    transform: rotate(360deg) scale(1.02)
    opacity: 0.8


</style>