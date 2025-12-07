// Gamification sound and animation utilities

export const playSound = (type: "xp" | "levelup" | "checkpoint" | "alert") => {
  // Create audio context for sounds
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const now = audioContext.currentTime
    const frequency = 400
    const duration = 0.2

    switch (type) {
      case "xp": {
        // Coin collect sound - 2 tones
        const osc1 = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc1.connect(gain)
        gain.connect(audioContext.destination)
        osc1.frequency.value = 600
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc1.start(now)
        osc1.stop(now + 0.2)
        break
      }
      case "levelup": {
        // Heroic fanfare - ascending tones
        const freqs = [523, 659, 784, 1047] // C, E, G, C
        freqs.forEach((freq, idx) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          osc.connect(gain)
          gain.connect(audioContext.destination)
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.2, now + idx * 0.15)
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.3)
          osc.start(now + idx * 0.15)
          osc.stop(now + idx * 0.15 + 0.3)
        })
        break
      }
      case "checkpoint": {
        // Victory sting
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.frequency.setValueAtTime(800, now)
        osc.frequency.linearRampToValueAtTime(1000, now + 0.3)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
        osc.start(now)
        osc.stop(now + 0.5)
        break
      }
      case "alert": {
        // Soft beep for alerts
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.frequency.value = 400
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
        osc.start(now)
        osc.stop(now + 0.2)
        break
      }
    }
  } catch (error) {
    console.log("[v0] Audio context not available")
  }
}

export const showXPPopup = (element: HTMLElement, xpAmount: number) => {
  const popup = document.createElement("div")
  popup.textContent = `+${xpAmount}!`
  popup.className = "fixed pointer-events-none font-bold text-primary text-lg animate-xp-float"
  popup.style.left = element.getBoundingClientRect().left + "px"
  popup.style.top = element.getBoundingClientRect().top + "px"

  document.body.appendChild(popup)

  setTimeout(() => popup.remove(), 1500)
}

export const triggerConfetti = () => {
  const colors = ["#DAA520", "#FF7F50", "#20B2AA", "#FFD700", "#FF6347"]
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div")
    confetti.style.position = "fixed"
    confetti.style.left = Math.random() * 100 + "%"
    confetti.style.top = "-10px"
    confetti.style.width = "10px"
    confetti.style.height = "10px"
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.borderRadius = "50%"
    confetti.className = "animate-confetti-fall pointer-events-none"
    document.body.appendChild(confetti)

    setTimeout(() => confetti.remove(), 2000)
  }
}
