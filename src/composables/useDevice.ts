import { ref, onMounted, onUnmounted } from 'vue'
import type { DeviceType } from '@/types'

export function useDevice() {
  const deviceType = ref<DeviceType>('desktop')
  const isMobile = ref(false)
  const screenWidth = ref(0)
  const screenHeight = ref(0)

  const updateDevice = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
    isMobile.value = window.innerWidth < 768
    deviceType.value = isMobile.value ? 'mobile' : 'desktop'
  }

  onMounted(() => {
    updateDevice()
    window.addEventListener('resize', updateDevice)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateDevice)
  })

  return {
    deviceType,
    isMobile,
    screenWidth,
    screenHeight
  }
}
