import { ref } from 'vue'

export function useTypewriter() {
  const displayText = ref('')
  const isTyping = ref(false)
  const typingSpeed = ref(50)

  let timeoutId: number | null = null

  const typeText = async (text: string, speed: number = 50): Promise<void> => {
    return new Promise((resolve) => {
      isTyping.value = true
      typingSpeed.value = speed
      displayText.value = ''

      let index = 0

      const type = () => {
        if (index < text.length) {
          displayText.value += text[index]
          index++
          timeoutId = window.setTimeout(type, speed)
        } else {
          isTyping.value = false
          resolve()
        }
      }

      type()
    })
  }

  const stopTyping = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    isTyping.value = false
  }

  const clearText = () => {
    stopTyping()
    displayText.value = ''
  }

  const setTextInstant = (text: string) => {
    stopTyping()
    displayText.value = text
  }

  return {
    displayText,
    isTyping,
    typingSpeed,
    typeText,
    stopTyping,
    clearText,
    setTextInstant
  }
}
