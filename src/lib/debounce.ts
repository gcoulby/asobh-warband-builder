export interface Debounced {
  schedule: () => void
  flush: () => void
  cancel: () => void
}

/** Runs `run` once, `delay` ms after the last call to `schedule`. */
export function debounce(run: () => void, delay: number): Debounced {
  let timer: ReturnType<typeof setTimeout> | undefined
  return {
    schedule: () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        run()
      }, delay)
    },
    flush: () => {
      if (timer === undefined) return
      clearTimeout(timer)
      timer = undefined
      run()
    },
    cancel: () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
    },
  }
}
