import { useEffect } from 'react'

const ORIGINAL_ASSET = 'FnTwkwh1zMIK062vyZfEtx5gGlA.mp4'
const LOCAL_VIDEO = '/decor/video.mp4'
const LOCAL_POSTER = '/decor/about-video-poster.jpg'
const SELECTOR = `.unframer-page[data-route="/about"] video[src*="${ORIGINAL_ASSET}"], .unframer-page[data-route="/about"] video[data-about-hero-video]`

/** Use the local About clip with sound available from the first Play click. */
export function useAboutHeroVideo() {
    useEffect(() => {
        const togglePlayback = (video: HTMLVideoElement) => {
            video.muted = false
            if (video.paused) {
                void video.play().catch(() => {})
            } else {
                video.pause()
            }
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
            document.querySelectorAll<HTMLVideoElement>(SELECTOR).forEach((video) => {
                const sourceChanged = video.getAttribute('src') !== LOCAL_VIDEO
                video.dataset.aboutHeroVideo = ''
                if (video.defaultMuted) video.defaultMuted = false
                if (video.muted) video.muted = false
                if (video.autoplay) video.autoplay = false
                if (video.controls) video.controls = false
                if (video.tabIndex !== 0) video.tabIndex = 0
                if (video.getAttribute('role') !== 'button') video.setAttribute('role', 'button')
                if (video.getAttribute('aria-label') !== 'Play or pause the About video with sound') {
                    video.setAttribute('aria-label', 'Play or pause the About video with sound')
                }
                if (video.style.cursor !== 'pointer') video.style.cursor = 'pointer'
                if (video.getAttribute('poster') !== LOCAL_POSTER) video.poster = LOCAL_POSTER

                if (sourceChanged) {
                    video.pause()
                    video.src = LOCAL_VIDEO
                    video.load()
                }
            })
        }

        update()
        document.addEventListener('click', onClick)
        document.addEventListener('keydown', onKeyDown)
        const observer = new MutationObserver(update)
        observer.observe(document.querySelector('.unframer-page') ?? document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'poster', 'muted', 'autoplay', 'controls'],
        })
        return () => {
            observer.disconnect()
            document.removeEventListener('click', onClick)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [])
}
