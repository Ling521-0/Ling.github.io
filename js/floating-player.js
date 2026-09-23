(() => {
  const PLAYER_ID = 'floating-music-player';
  const STORAGE_KEY = 'blog-floating-player-state-v1';
  const track = {
    title: '繁星、新生，与你',
    artist: '鸣潮先约电台, YUE.STEVEN',
    cover: '/assets/music/astrum-unicum.jpg',
    url: 'https://music.163.com/song/media/outer/url?id=2631878620.mp3',
    link: 'https://music.163.com/#/song?id=2631878620'
  };

  const loadSavedState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_error) {
      return {};
    }
  };

  const formatTime = value => {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const createPlayer = () => {
    if (document.getElementById(PLAYER_ID)) return;

    const saved = loadSavedState();
    const player = document.createElement('aside');
    player.id = PLAYER_ID;
    player.className = `floating-music-player${saved.collapsed ? ' is-collapsed' : ''}`;
    player.setAttribute('aria-label', '悬浮音乐播放器');
    player.style.setProperty('--player-cover', `url("${track.cover}")`);
    player.innerHTML = `
      <div class="floating-music-player__panel">
        <div class="floating-music-player__mini" data-action="expand" role="button" tabindex="0" aria-label="展开播放器" title="点击展开，按住空白处可拖动">
          <img class="floating-music-player__mini-cover" data-mini-cover alt="">
          <span class="floating-music-player__mini-title" data-mini-title></span>
          <button class="floating-music-player__icon-button" type="button" data-action="mini-play" aria-label="播放" title="播放">
            <i class="fas fa-play" aria-hidden="true"></i>
          </button>
          <button class="floating-music-player__icon-button" type="button" data-action="expand" aria-label="展开播放器" title="展开播放器">
            <i class="fas fa-chevron-up" aria-hidden="true"></i>
          </button>
        </div>
        <div class="floating-music-player__top">
          <img class="floating-music-player__cover" data-cover alt="">
          <div class="floating-music-player__meta">
            <p class="floating-music-player__title" data-title></p>
            <p class="floating-music-player__artist" data-artist></p>
            <p class="floating-music-player__status" data-status aria-live="polite"></p>
          </div>
          <button class="floating-music-player__icon-button" type="button" data-action="collapse" aria-label="收起播放器" title="收起播放器">
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
        </div>
        <div class="floating-music-player__body">
          <div class="floating-music-player__timeline">
            <span class="floating-music-player__time" data-current-time>0:00</span>
            <input class="floating-music-player__range" data-progress type="range" min="0" max="100" value="0" step="0.1" aria-label="播放进度">
            <span class="floating-music-player__time" data-duration>0:00</span>
          </div>
          <div class="floating-music-player__controls">
            <div class="floating-music-player__volume-wrap">
              <button class="floating-music-player__icon-button" type="button" data-action="mute" aria-label="静音" title="静音">
                <i class="fas fa-volume-up" aria-hidden="true"></i>
              </button>
              <input class="floating-music-player__range floating-music-player__volume" data-volume type="range" min="0" max="1" value="0.75" step="0.05" aria-label="音量">
            </div>
            <button class="floating-music-player__icon-button floating-music-player__play" type="button" data-action="play" aria-label="播放" title="播放">
              <i class="fas fa-play" aria-hidden="true"></i>
            </button>
            <a class="floating-music-player__icon-button" href="${track.link}" target="_blank" rel="noopener noreferrer" aria-label="在网易云音乐打开" title="在网易云音乐打开">
              <i class="fas fa-external-link-alt" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(player);

    const audio = new Audio();
    audio.preload = 'metadata';
    const elements = {
      cover: player.querySelector('[data-cover]'),
      miniCover: player.querySelector('[data-mini-cover]'),
      title: player.querySelector('[data-title]'),
      miniTitle: player.querySelector('[data-mini-title]'),
      artist: player.querySelector('[data-artist]'),
      status: player.querySelector('[data-status]'),
      currentTime: player.querySelector('[data-current-time]'),
      duration: player.querySelector('[data-duration]'),
      progress: player.querySelector('[data-progress]'),
      volume: player.querySelector('[data-volume]'),
      panel: player.querySelector('.floating-music-player__panel'),
      mini: player.querySelector('.floating-music-player__mini'),
      playButtons: player.querySelectorAll('[data-action="play"], [data-action="mini-play"]')
    };
    const savedVolume = Number(saved.volume);
    let previousVolume = Number.isFinite(savedVolume)
      ? Math.min(1, Math.max(0, savedVolume))
      : 0.75;
    let customPosition = Number.isFinite(saved.position?.x) && Number.isFinite(saved.position?.y)
      ? { x: saved.position.x, y: saved.position.y }
      : null;
    audio.volume = Math.min(1, Math.max(0, previousVolume));
    audio.muted = Boolean(saved.muted);
    elements.volume.value = audio.volume;

    const saveState = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        volume: audio.volume,
        muted: audio.muted,
        collapsed: player.classList.contains('is-collapsed'),
        position: customPosition
      }));
    };

    const applyPosition = (x, y) => {
      const padding = 8;
      const rect = player.getBoundingClientRect();
      const maxX = Math.max(padding, window.innerWidth - rect.width - padding);
      const maxY = Math.max(padding, window.innerHeight - rect.height - padding);
      customPosition = {
        x: Math.min(maxX, Math.max(padding, x)),
        y: Math.min(maxY, Math.max(padding, y))
      };
      player.style.left = `${customPosition.x}px`;
      player.style.top = `${customPosition.y}px`;
      player.style.right = 'auto';
      player.style.bottom = 'auto';
    };

    const resetPosition = () => {
      customPosition = null;
      player.style.removeProperty('left');
      player.style.removeProperty('top');
      player.style.removeProperty('right');
      player.style.removeProperty('bottom');
      saveState();
    };

    const keepPlayerInView = () => {
      if (customPosition) applyPosition(customPosition.x, customPosition.y);
    };

    const updateRange = (range, percent) => {
      const safePercent = Math.min(100, Math.max(0, percent || 0));
      range.style.setProperty('--range-progress', `${safePercent}%`);
    };

    const updatePlayButtons = () => {
      const isPlaying = !audio.paused && !audio.ended;
      player.classList.toggle('is-playing', isPlaying);
      elements.playButtons.forEach(button => {
        const icon = button.querySelector('i');
        button.setAttribute('aria-label', isPlaying ? '暂停' : '播放');
        button.title = isPlaying ? '暂停' : '播放';
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
      });
    };

    const updateVolume = () => {
      const icon = player.querySelector('[data-action="mute"] i');
      icon.className = audio.muted || audio.volume === 0
        ? 'fas fa-volume-mute'
        : audio.volume < 0.5 ? 'fas fa-volume-down' : 'fas fa-volume-up';
      elements.volume.value = audio.muted ? 0 : audio.volume;
      updateRange(elements.volume, (audio.muted ? 0 : audio.volume) * 100);
    };

    const setStatus = message => {
      elements.status.textContent = message;
    };

    const loadTrack = () => {
      audio.pause();
      elements.cover.src = track.cover;
      elements.cover.alt = `${track.title} 封面`;
      elements.miniCover.src = track.cover;
      elements.miniCover.alt = `${track.title} 封面`;
      elements.title.textContent = track.title;
      elements.miniTitle.textContent = track.title;
      elements.artist.textContent = track.artist;
      elements.currentTime.textContent = '0:00';
      elements.duration.textContent = '0:00';
      elements.progress.value = 0;
      updateRange(elements.progress, 0);

      audio.src = track.url;
      audio.load();
      setStatus('准备播放');
      updatePlayButtons();
      saveState();
    };

    const togglePlayback = () => {
      if (audio.paused) {
        audio.play().catch(() => setStatus('播放失败，请检查网络后重试'));
      } else {
        audio.pause();
      }
    };

    player.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      switch (actionButton.dataset.action) {
        case 'play':
        case 'mini-play':
          togglePlayback();
          break;
        case 'mute':
          if (audio.muted || audio.volume === 0) {
            audio.muted = false;
            audio.volume = previousVolume || 0.75;
          } else {
            previousVolume = audio.volume;
            audio.muted = true;
          }
          updateVolume();
          saveState();
          break;
        case 'collapse':
          player.classList.add('is-collapsed');
          saveState();
          window.setTimeout(keepPlayerInView, 260);
          break;
        case 'expand':
          player.classList.remove('is-collapsed');
          saveState();
          window.setTimeout(keepPlayerInView, 260);
          break;
        default:
          break;
      }
    });

    elements.mini.addEventListener('keydown', event => {
      if (event.target !== elements.mini || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      elements.mini.click();
    });

    let dragState = null;
    let suppressNextClick = false;
    elements.panel.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target.closest('button, a, input')) return;
      const rect = player.getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        moved: false
      };
    });

    window.addEventListener('pointermove', event => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const distance = Math.hypot(
        event.clientX - dragState.startX,
        event.clientY - dragState.startY
      );
      if (!dragState.moved && distance < 4) return;
      dragState.moved = true;
      player.classList.add('is-dragging');
      applyPosition(
        event.clientX - dragState.offsetX,
        event.clientY - dragState.offsetY
      );
      event.preventDefault();
    });

    const finishDrag = event => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const didMove = dragState.moved;
      dragState = null;
      player.classList.remove('is-dragging');
      if (didMove) {
        suppressNextClick = true;
        saveState();
        window.setTimeout(() => {
          suppressNextClick = false;
        }, 0);
      }
    };
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    document.addEventListener('click', event => {
      if (!suppressNextClick) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    elements.panel.addEventListener('dblclick', event => {
      if (event.target.closest('button, a, input')) return;
      resetPosition();
    });

    window.addEventListener('resize', keepPlayerInView);

    elements.progress.addEventListener('input', () => {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = (Number(elements.progress.value) / 100) * audio.duration;
    });

    elements.volume.addEventListener('input', () => {
      audio.muted = false;
      audio.volume = Number(elements.volume.value);
      previousVolume = audio.volume || previousVolume;
      updateVolume();
      saveState();
    });

    audio.addEventListener('loadedmetadata', () => {
      elements.duration.textContent = formatTime(audio.duration);
      setStatus('');
    });
    audio.addEventListener('timeupdate', () => {
      elements.currentTime.textContent = formatTime(audio.currentTime);
      const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      elements.progress.value = percent;
      updateRange(elements.progress, percent);
    });
    audio.addEventListener('play', () => {
      setStatus('正在播放');
      updatePlayButtons();
    });
    audio.addEventListener('pause', updatePlayButtons);
    audio.addEventListener('waiting', () => setStatus('正在缓冲'));
    audio.addEventListener('canplay', () => {
      if (audio.paused) setStatus('');
    });
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      updatePlayButtons();
      setStatus('');
    });
    audio.addEventListener('error', () => {
      setStatus('音源暂时不可用，请稍后重试');
      updatePlayButtons();
    });

    updateVolume();
    loadTrack();
    window.requestAnimationFrame(keepPlayerInView);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPlayer, { once: true });
  } else {
    createPlayer();
  }
  document.addEventListener('pjax:complete', createPlayer);
})();
