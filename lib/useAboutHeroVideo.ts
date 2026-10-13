import { useEffect } from 'react'

const ORIGINAL_ASSET = 'FnTwkwh1zMIK062vyZfEtx5gGlA.mp4'
const LOCAL_VIDEO = '/decor/video.mp4'
const LOCAL_POSTER = '/decor/about-video-poster.jpg'
const SELECTOR = `.unframer-page[data-route="/about"] video[src*="${ORIGINAL_ASSET}"], .unframer-page[data-route="/about"] video[src="${LOCAL_VIDEO}"], .unframer-page[data-route="/about"] video[data-about-hero-video]`

/** Autoplay the local About clip muted on phones; show a cue to enable sound. */
export function useAboutHeroVideo() {
    useEffect(() => {
        const configured = new WeakSet<HTMLVideoElement>()
        const withSound = new WeakSet<HTMLVideoElement>()
        const userPaused = new WeakSet<HTMLVideoElement>()
        const soundHintListeners = new Map<HTMLVideoElement, () => void>()

        const soundHintContainer = (video: HTMLVideoElement) =>
            video.closest('.framer-15yttpj-container') ?? video.parentElement

        const syncSoundHint = (video: HTMLVideoElement) => {
            const hint = soundHintContainer(video)?.querySelector<HTMLButtonElement>('.about-video-sound-hint')
            if (hint) hint.hidden = window.innerWidth >= 768 || !video.muted
        }

        const ensureSoundHint = (video: HTMLVideoElement) => {
            const container = soundHintContainer(video)
            if (!container || window.innerWidth >= 768) return
            let hint = container.querySelector<HTMLButtonElement>('.about-video-sound-hint')
            if (!hint) {
                hint = document.createElement('button')
                hint.type = 'button'
                hint.className = 'about-video-sound-hint'
                hint.setAttribute('aria-label', 'Turn on sound for the About video')
                hint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg><span>Tap for sound</span>'
                hint.addEventListener('click', (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    togglePlayback(video)
                })
                container.appendChild(hint)
            }
            if (!soundHintListeners.has(video)) {
                const onVolumeChange = () => syncSoundHint(video)
                video.addEventListener('volumechange', onVolumeChange)
                soundHintListeners.set(video, onVolumeChange)
            }
            syncSoundHint(video)
        }

        const togglePlayback = (video: HTMLVideoElement) => {
            if (video.paused) {
                userPaused.delete(video)
                withSound.add(video)
                video.muted = false
                void video.play().catch(() => {})
            } else if (video.muted) {
                withSound.add(video)
                video.muted = false
            } else {
                userPaused.add(video)
                video.pause()
            }
            syncSoundHint(video)
        }

        const onClick = (event: MouseEvent) => {
            if (event.target instanceof HTMLVideoElement && event.target.matches(SELECTOR)) {
                togglePlayback(event.target)
            }
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.target instanceof HTMLVideoElement &&
                event.target.matches(SELECTOR) &&
                (event.key === 'Enter' || event.key === ' ')
            ) {
                event.preventDefault()
                togglePlayback(event.target)
            }
        }

        const update = () => {
            const mobile = window.innerWidth < 768
            document.querySelectorAll<HTMLVideoElement>(SELECTOR).forEach((video) => {
                const sourceChanged = video.getAttribute('src') !== LOCAL_VIDEO
                video.dataset.aboutHeroVideo = ''
                if (video.getAttribute('poster') !== LOCAL_POSTER) video.poster = LOCAL_POSTER
                if (video.controls) video.controls = false
                if (!video.playsInline) video.playsInline = true
                if (video.tabIndex !== 0) video.tabIndex = 0
                if (video.getAttribute('role') !== 'button') video.setAttribute('role', 'button')
                if (video.getAttribute('aria-label') !== 'Play, pause, or unmute the About video') {
                    video.setAttribute('aria-label', 'Play, pause, or unmute the About video')
                }
                if (video.style.cursor !== 'pointer') video.style.cursor = 'pointer'

                if (sourceChanged) {
                    video.pause()
                    video.src = LOCAL_VIDEO
                    video.load()
                }

                if (mobile) {
                    if (!video.defaultMuted) video.defaultMuted = true
                    if (!withSound.has(video) && !video.muted) video.muted = true
                    if (!video.autoplay) video.autoplay = true
                    if (!configured.has(video)) {
                        configured.add(video)
                        video.addEventListener('loadeddata', () => {
                            if (video.isConnected && window.innerWidth < 768 && !userPaused.has(video)) {
                                void video.play().catch(() => {})
                            }
                        }, { once: true })
                    }
                    if (video.readyState >= video.HAVE_CURRENT_DATA && video.paused && !userPaused.has(video)) {
                        void video.play().catch(() => {})
                    }
                    ensureSoundHint(video)
                } else {
                    if (video.defaultMuted) video.defaultMuted = false
                    if (video.muted && !withSound.has(video)) video.muted = false
                    if (video.autoplay) video.autoplay = false
                    if (!configured.has(video)) {
                        configured.add(video)
                        video.pause()
                    }
                    syncSoundHint(video)
                }
            })
        }

        update()
        document.addEventListener('click', onClick)
        document.addEventListener('keydown', onKeyDown)
        window.addEventListener('resize', update)
        const observer = new MutationObserver(update)
        observer.observe(document.querySelector('.unframer-page') ?? document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'poster', 'muted', 'autoplay', 'controls'],
        })
        return () => {
            observer.disconnect()
            soundHintListeners.forEach((listener, video) => {
                video.removeEventListener('volumechange', listener)
                soundHintContainer(video)?.querySelector('.about-video-sound-hint')?.remove()
            })
            document.removeEventListener('click', onClick)
            document.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('resize', update)
        }
    }, [])
}
